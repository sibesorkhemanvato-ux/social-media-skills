#!/usr/bin/env python3
"""Leverage Gap Score calculator for offer-scout.

Reads a CSV of scored offers and prints them ranked by LGS.

CSV columns (header required):
name,bucket,cash,speed,repeat,asset,leverage,money,time,mental,skillgap,risk

All ten score columns are integers from 1 to 10.
Return axes: higher is better. Cost axes: higher means more expensive.

Usage:
    python3 score.py offers.csv
    python3 score.py offers.csv --top 10
"""

import argparse
import csv
import sys

RETURN_WEIGHTS = {"cash": 0.30, "speed": 0.20, "repeat": 0.20, "asset": 0.15, "leverage": 0.15}
COST_WEIGHTS = {"money": 0.25, "time": 0.30, "mental": 0.25, "skillgap": 0.10, "risk": 0.10}
RETURN_MULTIPLIER = 1.6  # return is deliberately weighted above cost


def lgs(row):
    r = sum(w * float(row[k]) for k, w in RETURN_WEIGHTS.items())
    c = sum(w * float(row[k]) for k, w in COST_WEIGHTS.items())
    gap = (RETURN_MULTIPLIER * r) - c
    return r, c, gap, round(((gap + 8.4) / 23.4) * 100)


def band(score):
    if score >= 80:
        return "start this week"
    if score >= 65:
        return "strong"
    if score >= 50:
        return "redesign the cost side"
    return "drop"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_path")
    ap.add_argument("--top", type=int, default=0, help="only show the top N")
    ap.add_argument("--max-per-bucket", type=int, default=4)
    args = ap.parse_args()

    with open(args.csv_path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))

    scored = []
    for row in rows:
        try:
            r, c, gap, score = lgs(row)
        except (KeyError, TypeError, ValueError) as exc:
            print(f"skipping {row.get('name', '?')}: {exc}", file=sys.stderr)
            continue
        scored.append({**row, "R": round(r, 2), "C": round(c, 2), "gap": round(gap, 2), "LGS": score})

    scored.sort(key=lambda x: x["LGS"], reverse=True)

    if args.top:
        picked, counts = [], {}
        for item in scored:
            bucket = item.get("bucket", "")
            if counts.get(bucket, 0) >= args.max_per_bucket:
                continue
            counts[bucket] = counts.get(bucket, 0) + 1
            picked.append(item)
            if len(picked) == args.top:
                break
        scored = picked

    print("| Rank | Offer | Bucket | R | C | Gap | LGS | Verdict |")
    print("|---|---|---|---|---|---|---|---|")
    for i, item in enumerate(scored, 1):
        print(
            f"| {i} | {item['name']} | {item.get('bucket', '')} | {item['R']} | "
            f"{item['C']} | {item['gap']} | {item['LGS']} | {band(item['LGS'])} |"
        )


if __name__ == "__main__":
    main()
