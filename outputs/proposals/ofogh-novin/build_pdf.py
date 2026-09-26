#!/usr/bin/env python3
"""Build the Persian (RTL) PDF proposal for Ofogh Novin school.

Fonts: Vazirmatn by Saber Rastikerdar, SIL Open Font License 1.1.
Licence text shipped at assets/fonts/vazirmatn/OFL.txt.

Usage: python3 build_pdf.py
"""

from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

ROOT = Path(__file__).resolve().parents[3]
FONT_DIR = ROOT / "assets" / "fonts" / "vazirmatn"
OUT = Path(__file__).resolve().parent / "proposal-ofogh-novin.pdf"

INK = (28, 33, 44)
MUTED = (104, 112, 128)
BRAND = (12, 90, 122)
ACCENT = (198, 120, 40)
LINE = (219, 224, 232)
SOFT = (243, 246, 249)

MARGIN = 18


class Proposal(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_margins(MARGIN, 18, MARGIN)
        self.set_auto_page_break(True, margin=20)
        for style, name in (("", "Regular"), ("B", "Bold"), ("I", "Medium")):
            self.add_font("Vazir", style, str(FONT_DIR / f"Vazirmatn-{name}.ttf"))
        self.set_text_shaping(True, direction="rtl")
        self.set_font("Vazir", "", 10.5)
        self.cover = True

    # --- page furniture -------------------------------------------------
    def header(self):
        if self.cover:
            return
        self.set_y(9)
        self.set_font("Vazir", "", 7.5)
        self.set_text_color(*MUTED)
        self.cell(0, 5, "پیشنهاد «نسل آماده» — دبیرستان افق نوین، کرج", align="R")
        self.set_xy(MARGIN, 9)
        self.cell(0, 5, "مهدی رابطی", align="L")
        self.set_draw_color(*LINE)
        self.set_line_width(0.2)
        self.line(MARGIN, 15, 210 - MARGIN, 15)
        self.set_y(21)

    def footer(self):
        if self.cover:
            return
        self.set_y(-14)
        self.set_draw_color(*LINE)
        self.line(MARGIN, self.get_y() - 2, 210 - MARGIN, self.get_y() - 2)
        self.set_font("Vazir", "", 7.5)
        self.set_text_color(*MUTED)
        digits = str(self.page_no()).translate(str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹"))
        self.cell(0, 6, f"صفحه {digits}", align="R")
        self.set_xy(MARGIN, self.get_y())
        self.cell(0, 6, "مهر ۱۴۰۵", align="L")

    # --- building blocks ------------------------------------------------
    def h1(self, text):
        self.ln(3)
        self.set_font("Vazir", "B", 15)
        self.set_text_color(*BRAND)
        self.multi_cell(0, 9, text, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        y = self.get_y() + 1
        self.set_draw_color(*ACCENT)
        self.set_line_width(0.7)
        self.line(210 - MARGIN, y, 210 - MARGIN - 26, y)
        self.ln(4)

    def h2(self, text):
        self.ln(1.5)
        self.set_font("Vazir", "B", 11.5)
        self.set_text_color(*INK)
        self.multi_cell(0, 7, text, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(0.5)

    def body(self, text, size=10.5, colour=INK):
        self.set_font("Vazir", "", size)
        self.set_text_color(*colour)
        self.multi_cell(0, 6.6, text, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1.5)

    def bullets(self, items, size=10.5):
        self.set_font("Vazir", "", size)
        self.set_text_color(*INK)
        for item in items:
            self.set_x(MARGIN)
            self.multi_cell(210 - 2 * MARGIN - 6, 6.4, "\u2022  " + item, align="R",
                            new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.ln(0.8)
        self.ln(1.2)

    def callout(self, text, colour=SOFT, bar=ACCENT, size=10.5):
        self.set_font("Vazir", "", size)
        width = 210 - 2 * MARGIN
        lines = self.multi_cell(width - 10, 6.4, text, align="R", dry_run=True, output="LINES")
        height = 6.4 * len(lines) + 7
        if self.get_y() + height > self.h - 22:
            self.add_page()
        y0 = self.get_y()
        self.set_fill_color(*colour)
        self.rect(MARGIN, y0, width, height, style="F")
        self.set_fill_color(*bar)
        self.rect(210 - MARGIN - 1.8, y0, 1.8, height, style="F")
        self.set_xy(MARGIN + 5, y0 + 3.5)
        self.set_text_color(*INK)
        self.multi_cell(width - 10, 6.4, text, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_y(y0 + height + 4)

    def table(self, headers, rows, widths, show_header=True, keep=False):
        total = 210 - 2 * MARGIN
        widths = [w / sum(widths) * total for w in widths]
        if keep:
            self.set_font("Vazir", "", 9.5)
            need = 9 if show_header else 0
            for row in rows:
                need += max(len(self.multi_cell(w - 5, 5.6, c, align="R", dry_run=True,
                                                output="LINES"))
                            for c, w in zip(row, widths)) * 5.6 + 4
            if self.get_y() + need > self.h - 22:
                self.add_page()
        if show_header:
            self.set_font("Vazir", "B", 9.5)
            self.set_fill_color(*BRAND)
            self.set_text_color(255, 255, 255)
            self.set_draw_color(*LINE)
            self.set_line_width(0.2)
            x = 210 - MARGIN
            y = self.get_y()
            for head, w in zip(headers, widths):
                x -= w
                self.set_xy(x, y)
                self.cell(w, 9, head, border=0, align="C", fill=True)
            self.set_y(y + 9)
        self.set_font("Vazir", "", 9.5)
        self.set_text_color(*INK)
        for i, row in enumerate(rows):
            heights = []
            for cell, w in zip(row, widths):
                heights.append(len(self.multi_cell(w - 5, 5.6, cell, align="R",
                                                   dry_run=True, output="LINES")))
            height = max(heights) * 5.6 + 4
            if self.get_y() + height > self.h - 22:
                self.add_page()
            y = self.get_y()
            x = 210 - MARGIN
            if i % 2 == 0:
                self.set_fill_color(*SOFT)
                self.rect(MARGIN, y, total, height, style="F")
            for cell, w in zip(row, widths):
                x -= w
                self.set_xy(x + 2.5, y + 2)
                self.multi_cell(w - 5, 5.6, cell, align="R")
            self.set_draw_color(*LINE)
            self.line(MARGIN, y + height, 210 - MARGIN, y + height)
            self.set_y(y + height)
        self.ln(4)

    def phase(self, title, work, deliver):
        block = f"{work}\nتحویل‌دادنی: {deliver}"
        self.set_font("Vazir", "B", 10.5)
        lines = self.multi_cell(210 - 2 * MARGIN - 12, 6.2, block, align="R",
                                dry_run=True, output="LINES")
        height = 6.2 * len(lines) + 13
        if self.get_y() + height > self.h - 22:
            self.add_page()
        y0 = self.get_y()
        self.set_draw_color(*BRAND)
        self.set_line_width(1.1)
        self.line(210 - MARGIN - 0.5, y0 + 1, 210 - MARGIN - 0.5, y0 + height - 3)
        self.set_xy(MARGIN, y0)
        self.set_font("Vazir", "B", 11)
        self.set_text_color(*BRAND)
        self.multi_cell(210 - 2 * MARGIN - 6, 7, title, align="R",
                        new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_font("Vazir", "", 10)
        self.set_text_color(*INK)
        self.set_x(MARGIN)
        self.multi_cell(210 - 2 * MARGIN - 6, 6.2, block, align="R",
                        new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_y(y0 + height)


def build():
    pdf = Proposal()

    # ---------------- cover ----------------
    pdf.add_page()
    pdf.set_fill_color(*BRAND)
    pdf.rect(0, 0, 210, 104, style="F")
    pdf.set_fill_color(*ACCENT)
    pdf.rect(0, 104, 210, 2.5, style="F")

    pdf.set_xy(MARGIN, 30)
    pdf.set_font("Vazir", "", 12)
    pdf.set_text_color(214, 232, 240)
    pdf.cell(210 - 2 * MARGIN, 8, "پیشنهاد همکاری آموزشی", align="R",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(MARGIN)
    pdf.set_font("Vazir", "B", 30)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(210 - 2 * MARGIN, 18, "نسل آماده", align="R",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(MARGIN)
    pdf.set_font("Vazir", "", 13.5)
    pdf.set_text_color(226, 238, 244)
    pdf.multi_cell(210 - 2 * MARGIN, 8.5,
                   "برنامه سواد هوش مصنوعی برای دانش‌آموزان دوره اول متوسطه",
                   align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)
    pdf.set_x(MARGIN)
    pdf.set_font("Vazir", "", 10.5)
    pdf.set_text_color(198, 222, 232)
    pdf.multi_cell(210 - 2 * MARGIN, 6.5,
                   "بر پایه چارچوب شایستگی هوش مصنوعی دانش‌آموزان، یونسکو ۲۰۲۴",
                   align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_y(120)
    pdf.table(
        ["", ""],
        [
            ["دبیرستان غیردولتی افق نوین، کرج — مدیریت محترم", "تقدیم به"],
            ["مهدی رابطی، ولیّ دانش‌آموز پایه هفتم", "پیشنهاددهنده"],
            ["مهر ۱۴۰۵", "تاریخ"],
            ["۳۰ آبان ۱۴۰۵", "اعتبار پیشنهاد تا"],
            ["بدون هزینه برای مدرسه در مرحله پایلوت", "هزینه"],
        ],
        [72, 28],
        show_header=False,
    )

    pdf.set_y(196)
    pdf.callout(
        "این پیشنهاد از سوی یک ولیّ دانش‌آموز ارائه می‌شود، نه یک آموزشگاه یا فروشنده دوره. "
        "هدف، آماده‌کردن دانش‌آموزان برای دنیایی است که در آن کار کردن «با» هوش مصنوعی یک مهارت پایه است، "
        "و خروجی کار نزد خود مدرسه می‌ماند."
    )

    pdf.set_y(248)
    pdf.set_font("Vazir", "", 8.5)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(210 - 2 * MARGIN, 5.2,
                   "سند داخلی و محرمانه. تهیه‌شده برای بررسی مدیریت دبیرستان افق نوین.",
                   align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.cover = False

    # ---------------- page: outcome + evidence ----------------
    pdf.add_page()
    pdf.h1("نتیجه‌ای که دنبال آن هستیم")
    pdf.body(
        "تا پایان سال تحصیلی، هر دانش‌آموز دوره اول افق نوین بتواند با هوش مصنوعی کار کند، "
        "نه اینکه هوش مصنوعی به‌جای او کار کند: خروجی آن را نقد کند، خطا و منبع آن را تشخیص دهد، "
        "حریم خصوصی‌اش را حفظ کند، و دست‌کم یک پروژه واقعی با کمک آن ساخته باشد."
    )

    pdf.h1("آنچه امروز می‌بینیم")
    pdf.bullets([
        "درس «کار و فناوری» در پایه هفتم عملاً روی مهارت‌های پایه رایانه و نرم‌افزار اداری متمرکز است؛ "
        "تفکر محاسباتی و مبانی هوش مصنوعی جای مشخصی در آن ندارد.",
        "دانش‌آموزان همین امروز و بدون هیچ آموزشی، از ابزارهای مولد برای انجام تکالیف استفاده می‌کنند. "
        "نتیجه: تکلیفی که یاد نمی‌دهد، و برخورد سلیقه‌ای و متفاوت هر دبیر با یک رفتار مشترک.",
        "بیشتر مدارس هنوز «آیین‌نامه مکتوب استفاده از هوش مصنوعی» ندارند. یعنی هنگام بروز اولین پرونده "
        "تقلب یا انتشار اطلاعات شخصی، مبنایی برای تصمیم‌گیری وجود ندارد.",
        "این موضوع دیگر اختیاری نیست. طرح ملی آموزش هوش مصنوعی، پایه‌های هفتم تا دهم را هدف گرفته و "
        "دوره آموزشی معلمان، مدارس غیردولتی را نیز دربر می‌گیرد.",
    ])
    pdf.callout(
        "جمع‌بندی ساده: این قطار حرکت کرده است. مدرسه یا امسال با برنامه خودش سوار می‌شود، "
        "یا سال آینده با بخشنامه و با عجله.",
        colour=(253, 246, 236), bar=ACCENT,
    )

    pdf.h1("مبنای پیشنهاد: شواهد، نه حدس")
    pdf.table(
        ["یافته", "منبع و زمان"],
        [
            ["طرح ملی آموزش هوش مصنوعی برای معلمان و دانش‌آموزان پایه هفتم تا دهم؛ اعلام شده که "
             "تمامی مدارس دارای این پایه‌ها مشمول خواهند شد.", "معاون وزیر آموزش و پرورش، بهمن ۱۴۰۴"],
            ["دوره ۳۲ ساعته آموزش هوش مصنوعی برای معلمان، شامل مدارس غیردولتی، با سرفصل‌های مبانی، "
             "هوش مصنوعی مولد، مهندسی پرامپت، اخلاق و حریم خصوصی.", "معاون آموزش متوسطه وزارت، شهریور ۱۴۰۵"],
            ["تمرکز اصلی آموزش‌های ملی هوش مصنوعی بر دوره متوسطه اول است، با سطح‌بندی هفت‌گانه.",
             "مجری طرح ملی، شهریور ۱۴۰۵"],
            ["محتوای درس کار و فناوری عمدتاً به مهارت‌های پایه رایانه محدود است و تفکر محاسباتی و "
             "مبانی هوش مصنوعی را پوشش نمی‌دهد.", "گزارش تحلیلی نظام آموزشی، ۱۴۰۴"],
            ["چارچوب شایستگی هوش مصنوعی دانش‌آموزان: ۱۲ شایستگی در ۴ بُعد و ۳ سطح «فهم، کاربرد، خلق».",
             "یونسکو، ۲۰۲۴"],
        ],
        [64, 36],
        keep=True,
    )

    pdf.h1("چرا این برای افق نوین ارزش دارد")
    pdf.body(
        "مدرسه غیردولتی با تمایزش ثبت‌نام می‌گیرد. «اولین مدرسه کرج با برنامه مدون سواد هوش مصنوعی، "
        "آیین‌نامه داخلی و نمایشگاه پروژه دانش‌آموزی» حرفی است که هم در جلسه اولیا و هم در معرفی مدرسه "
        "قابل دفاع است. هزینه ورود به آن در مرحله اول، برای مدرسه صفر است."
    )

    # ---------------- page: framework + phases ----------------
    pdf.add_page()
    pdf.h1("چارچوب علمی برنامه")
    pdf.body(
        "ستون فقرات برنامه، چارچوب شایستگی هوش مصنوعی دانش‌آموزان یونسکو (۲۰۲۴) است: چهار بُعد "
        "«ذهنیت انسان‌محور»، «اخلاق هوش مصنوعی»، «فنون و کاربردها» و «طراحی سامانه»، در سه سطح "
        "فهم، کاربرد و خلق. سرفصل‌ها با محورهای اعلام‌شده وزارت هم‌راستاست، بنابراین این برنامه "
        "موازی‌کاری یا معارض با طرح ملی نیست، بلکه مکمل آن است."
    )
    pdf.table(
        ["بُعد", "تمرکز برنامه در دوره اول"],
        [
            ["ذهنیت انسان‌محور", "اینکه قضاوت نهایی با انسان است و مسئولیت خروجی با استفاده‌کننده"],
            ["اخلاق هوش مصنوعی", "حریم خصوصی، سوگیری، صداقت علمی و مرز تقلب"],
            ["فنون و کاربردها", "پرامپت‌نویسی، ارزیابی پاسخ، تشخیص محتوای ساختگی"],
            ["طراحی سامانه", "تعریف مسئله و ساخت یک راه‌حل ساده گروهی"],
        ],
        [30, 70],
        keep=True,
    )

    pdf.h1("برنامه اجرا")
    pdf.phase(
        "فاز صفر — سنجش و توافق (۲ هفته)",
        "نظرسنجی کوتاه از دانش‌آموزان پایه‌های هفتم تا نهم درباره نحوه استفاده امروزشان از این ابزارها، "
        "به‌همراه یک نشست هماهنگی با دبیران کار و فناوری.",
        "گزارش سه‌صفحه‌ای «وضعیت موجود افق نوین» و طرح درس نهایی‌شده.",
    )
    pdf.phase(
        "فاز یک — پایلوت یک کلاس (۶ جلسه، هر جلسه ۹۰ دقیقه)",
        "اجرای شش جلسه با یک کلاس پایه هفتم در ساعت فوق‌برنامه یا در بستر درس کار و فناوری:\n"
        "۱. هوش مصنوعی چیست و چه چیزی نیست؛ چرا اشتباه می‌کند\n"
        "۲. مهارت پرسیدن: پرامپت‌نویسی و بازبینی پاسخ\n"
        "۳. تشخیص جعل: تصویر، صدا و متن ساختگی\n"
        "۴. اخلاق و حریم خصوصی: چه چیزی را هرگز به یک ابزار ندهیم\n"
        "۵. یادگیری بدون تقلب: مرز کمک گرفتن و جای‌گزین شدن\n"
        "۶. پروژه گروهی: حل یک مسئله واقعی مدرسه با کمک ابزارها",
        "گزارش نتایج پایلوت با سنجش پیش و پس از دوره.",
    )
    pdf.phase(
        "فاز دو — آیین‌نامه و توانمندسازی دبیران (۳ هفته)",
        "تدوین «آیین‌نامه استفاده مسئولانه از هوش مصنوعی» مخصوص افق نوین و برگزاری یک کارگاه سه‌ساعته "
        "برای دبیران.",
        "سند آیین‌نامه در سه نسخه دانش‌آموز، دبیر و ولیّ، به‌همراه بسته طرح درس برای ادامه کار توسط خود دبیران.",
    )
    pdf.phase(
        "فاز سه — تعمیم و نمایشگاه (تا پایان سال)",
        "اجرای دوره برای سایر کلاس‌ها توسط دبیران آموزش‌دیده، با پشتیبانی و همراهی من.",
        "«نمایشگاه پروژه‌های هوش مصنوعی افق نوین» با حضور اولیا و یک گزارش قابل انتشار برای معرفی مدرسه.",
    )

    # ---------------- page: scope, timeline, cost ----------------
    pdf.add_page()
    pdf.h1("دامنه کار")
    pdf.h2("آنچه شامل می‌شود")
    pdf.bullets([
        "طراحی کامل طرح درس و محتوای شش جلسه، متناسب با گروه سنی ۱۲ تا ۱۵ سال",
        "اجرای رایگان جلسات پایلوت",
        "کارگاه دبیران و بسته انتقال دانش",
        "سند آیین‌نامه اختصاصی مدرسه",
        "گزارش سنجش پیش و پس از دوره",
    ])
    pdf.h2("آنچه شامل نمی‌شود")
    pdf.bullets([
        "خرید سخت‌افزار، تجهیز کارگاه رایانه یا تأمین اینترنت",
        "خرید اشتراک ابزارهای پولی؛ برنامه طوری طراحی می‌شود که با ابزارهای در دسترس اجرا شود",
        "آموزش برنامه‌نویسی حرفه‌ای یا آماده‌سازی مسابقه‌ای؛ این برنامه سواد و قضاوت می‌سازد، نه مهندس",
        "ورود به محتوای درسی ارزشیابی‌شده و نمره رسمی",
    ])
    pdf.body(
        "هر موردی خارج از این فهرست، پیش از شروع به‌صورت جداگانه توافق و هزینه‌گذاری می‌شود.",
        size=10, colour=MUTED,
    )

    pdf.h1("زمان‌بندی")
    pdf.table(
        ["زمان", "مرحله"],
        [
            ["تا ۳۰ آبان ۱۴۰۵", "تأیید مدیریت"],
            ["آذر", "فاز صفر: سنجش و توافق"],
            ["آذر و دی", "فاز یک: اجرای پایلوت"],
            ["بهمن", "فاز دو: آیین‌نامه و کارگاه دبیران"],
            ["اسفند و فروردین", "فاز سه: تعمیم و نمایشگاه"],
        ],
        [30, 70],
        keep=True,
    )

    if pdf.get_y() > pdf.h - 110:
        pdf.add_page()
    pdf.h1("هزینه")
    pdf.table(
        ["گزینه", "شرح", "هزینه برای مدرسه"],
        [
            ["الف. پایلوت (پیشنهاد من برای شروع)",
             "فاز صفر و یک، با اجرای شخصی من به‌عنوان ولیّ دانش‌آموز", "بدون هزینه"],
            ["ب. برنامه کامل داخلی",
             "فازهای صفر تا سه، با تدریس دبیران خود مدرسه پس از کارگاه",
             "بدون هزینه مستقیم؛ فقط زمان دبیران"],
            ["ج. اجرای کامل با مدرس بیرونی",
             "اجرای همه جلسات برای همه کلاس‌ها توسط مدرس بیرونی",
             "بر اساس استعلام روز، پس از تأیید مدیریت"],
        ],
        [30, 42, 28],
        keep=True,
    )
    pdf.callout(
        "من از این پیشنهاد درآمدی ندارم و قصد فروش دوره به اولیا را هم ندارم. انگیزه‌ام روشن است: "
        "فرزند خودم در همین مدرسه درس می‌خواند.",
        colour=(238, 246, 243), bar=(46, 139, 116),
    )

    # ---------------- page: risk, assumptions, next step ----------------
    pdf.add_page()
    pdf.h1("ریسک شما و تضمین من")
    pdf.body(
        "فاز صفر و نخستین جلسه به‌صورت آزمایشی اجرا می‌شود. اگر پس از آن جلسه، شما یا دبیر ناظر نتیجه را "
        "مناسب ندانید، کار همان‌جا متوقف می‌شود و هیچ تعهدی برای مدرسه باقی نمی‌ماند. تمام محتوا پیش از "
        "اجرا در اختیار مدیریت قرار می‌گیرد و هر جلسه با حضور یک دبیر ناظر برگزار خواهد شد."
    )

    pdf.h1("مفروضات")
    pdf.bullets([
        "دسترسی به یک کلاس مجهز به ویدئوپروژکتور. کارگاه رایانه با اینترنت مطلوب است اما الزامی نیست؛ "
        "نسخه «بدون رایانه» جلسات نیز طراحی شده است.",
        "اختصاص ۹۰ دقیقه در هفته در برنامه فوق‌برنامه یا در بستر درس کار و فناوری.",
        "همراهی یک دبیر ناظر در تمام جلسات.",
        "اگر مدرسه امسال در طرح ملی وزارت ثبت‌نام کرده باشد، برنامه به‌جای اجرای موازی، "
        "مکمل و منطبق بر آن بازطراحی می‌شود.",
    ])

    pdf.h1("قدم بعدی")
    pdf.body(
        "یک جلسه بیست‌دقیقه‌ای حضوری در هفته آینده، در ساعتی که شما تعیین کنید. در آن جلسه طرح درس شش "
        "جلسه و نمونه فعالیت کلاسی را ارائه می‌کنم. اگر مناسب بود، فاز صفر از آذر آغاز می‌شود؛ اگر نبود، "
        "پرونده همان‌جا بسته می‌شود و وقت کسی گرفته نمی‌شود."
    )
    pdf.callout(
        "برای هماهنگی جلسه:\nمهدی رابطی — ولیّ دانش‌آموز پایه هفتم\nشماره تماس: ....................",
        colour=SOFT, bar=BRAND,
    )

    pdf.ln(6)
    pdf.set_font("Vazir", "", 7.5)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(
        210 - 2 * MARGIN, 4.8,
        "قلم متن: وزیرمتن، طراحی صابر راستی‌کردار، منتشرشده تحت پروانه SIL Open Font License 1.1 "
        "و با رعایت شرایط آن استفاده شده است. متن پروانه همراه فایل‌های قلم در پوشه پروژه موجود است. "
        "محتوای این سند تألیف مهدی رابطی است.",
        align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT,
    )

    pdf.set_title("پیشنهاد نسل آماده — برنامه سواد هوش مصنوعی، دبیرستان افق نوین کرج")
    pdf.set_author("مهدی رابطی")
    pdf.set_subject("پیشنهاد آموزشی سواد هوش مصنوعی برای دوره اول متوسطه")
    pdf.set_lang("fa-IR")
    pdf.output(str(OUT))
    print(f"written: {OUT}")


if __name__ == "__main__":
    build()
