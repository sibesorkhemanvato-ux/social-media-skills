"""API boundary for the Mind Architect launch MVP.

Secrets belong only in the deployment environment. The payment provider adapter remains
explicitly unimplemented until the provider URL, authentication method and callback
contract are supplied.
"""
from __future__ import annotations

import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pydantic import BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    allowed_origins: str = "https://mehdirabeti.com,https://www.mehdirabeti.com"
    mongodb_uri: str | None = None
    mongodb_db: str = "mind_architect"
    kavenegar_api_key: str | None = None
    kavenegar_template: str | None = None
    payment_gateway_url: str | None = None
    payment_gateway_key: str | None = None

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
app = FastAPI(title="Mind Architect API", version="1.0.0", docs_url=None if settings.app_env == "production" else "/docs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins if settings.app_env == "production" else ["http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

mongo_client: AsyncIOMotorClient[Any] | None = None
mongo_db: AsyncIOMotorDatabase[Any] | None = None
memory_store: dict[str, list[dict[str, Any]]] = {"webinar_leads": [], "otp_requests": [], "checkout_intents": []}


class MobilePayload(BaseModel):
    mobile: str = Field(min_length=11, max_length=11)

    @field_validator("mobile")
    @classmethod
    def valid_iranian_mobile(cls, value: str) -> str:
        if not value.isdigit() or not value.startswith("09"):
            raise ValueError("شماره موبایل معتبر نیست")
        return value


class WebinarPayload(MobilePayload):
    name: str = Field(min_length=1, max_length=80)

    @field_validator("name")
    @classmethod
    def cleaned_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("نام معتبر نیست")
        return cleaned


class OtpVerifyPayload(MobilePayload):
    code: str = Field(min_length=4, max_length=6)

    @field_validator("code")
    @classmethod
    def numeric_code(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError("کد معتبر نیست")
        return value


class CheckoutPayload(MobilePayload):
    coupon: str | None = Field(default=None, max_length=64)


async def collection_insert(collection: str, payload: dict[str, Any]) -> None:
    if mongo_db is not None:
        await mongo_db[collection].insert_one(payload)
    else:
        memory_store[collection].append(payload)


async def latest_otp(mobile: str) -> dict[str, Any] | None:
    if mongo_db is not None:
        return await mongo_db["otp_requests"].find_one({"mobile": mobile}, sort=[("created_at", -1)])
    records = [record for record in memory_store["otp_requests"] if record["mobile"] == mobile]
    return records[-1] if records else None


@app.on_event("startup")
async def start_database() -> None:
    global mongo_client, mongo_db
    if not settings.mongodb_uri:
        return
    try:
        mongo_client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=1800)
        await mongo_client.admin.command("ping")
        mongo_db = mongo_client[settings.mongodb_db]
        await mongo_db["webinar_leads"].create_index("mobile", unique=True)
        await mongo_db["otp_requests"].create_index([("mobile", 1), ("created_at", -1)])
    except Exception:
        # The website can still render / accept local launch-preview data without a DB.
        if mongo_client:
            mongo_client.close()
        mongo_client = None
        mongo_db = None


@app.on_event("shutdown")
async def stop_database() -> None:
    if mongo_client:
        mongo_client.close()


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "storage": "mongodb" if mongo_db is not None else "development-memory"}


@app.post("/api/webinar/register")
async def register_webinar(payload: WebinarPayload) -> dict[str, str]:
    record = {"name": payload.name, "mobile": payload.mobile, "created_at": datetime.now(UTC), "source": "website"}
    try:
        await collection_insert("webinar_leads", record)
    except Exception as exception:
        # A duplicate registration is not an error for the visitor; prevent user enumeration.
        if "duplicate" not in str(exception).lower():
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="ثبت‌نام در حال حاضر در دسترس نیست") from exception
    return {"message": "ثبت‌نام وبینار ثبت شد."}


@app.post("/api/auth/otp/start")
async def start_otp(payload: MobilePayload) -> dict[str, str]:
    code = f"{secrets.randbelow(1_000_000):06d}"
    expires_at = datetime.now(UTC) + timedelta(minutes=3)
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    await collection_insert("otp_requests", {"mobile": payload.mobile, "code_hash": code_hash, "created_at": datetime.now(UTC), "expires_at": expires_at, "used": False})

    if settings.kavenegar_api_key and settings.kavenegar_template:
        url = f"https://api.kavenegar.com/v1/{settings.kavenegar_api_key}/verify/lookup.json"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(url, data={"receptor": payload.mobile, "token": code, "template": settings.kavenegar_template})
                response.raise_for_status()
        except httpx.HTTPError as exception:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="ارسال کد با مشکل روبه‌رو شد") from exception
        return {"message": "کد یک‌بارمصرف ارسال شد."}

    if settings.app_env == "production":
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="سرویس پیامک هنوز تنظیم نشده است")
    return {"message": "در محیط آزمایشی، ارسال پیامک پس از اتصال کاوه‌نگار فعال می‌شود."}


@app.post("/api/auth/otp/verify")
async def verify_otp(payload: OtpVerifyPayload) -> dict[str, str]:
    record = await latest_otp(payload.mobile)
    if record is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="ابتدا کد یک‌بارمصرف را دریافت کنید")
    if record.get("used") or record["expires_at"] < datetime.now(UTC):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="این کد منقضی شده است")
    is_valid = secrets.compare_digest(record["code_hash"], hashlib.sha256(payload.code.encode()).hexdigest())
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="کد یک‌بارمصرف صحیح نیست")
    if mongo_db is not None and "_id" in record:
        await mongo_db["otp_requests"].update_one({"_id": record["_id"]}, {"$set": {"used": True}})
    else:
        record["used"] = True
    return {"message": "ورود با موفقیت تأیید شد."}


@app.post("/api/payments/course")
async def create_course_payment(payload: CheckoutPayload) -> dict[str, str]:
    # Intentionally no provider-specific request until its required address/key/callback contract is supplied.
    await collection_insert("checkout_intents", {"mobile": payload.mobile, "coupon": payload.coupon, "created_at": datetime.now(UTC), "product": "mind-architect"})
    if not (settings.payment_gateway_url and settings.payment_gateway_key):
        return {"message": "اتصال درگاه شخصی پس از دریافت آدرس و کلید درگاه انجام می‌شود."}
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="جزئیات فنی درگاه پرداخت هنوز پیاده‌سازی نشده است")
