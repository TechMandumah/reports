from langdetect import detect, DetectorFactory
import pandas as pd
import os   # ✅ استيراد مكتبة os

DetectorFactory.seed = 0  # لتثبيت النتيجة

# ملف الإدخال
input_file = r"D:\Drives\catalogersmandumah\Eldowy-Work\Titil_Lang\Titil_excell\Titles.xlsx"

# ملف الإخراج الأساسي
base_output_file = r"D:\Drives\catalogersmandumah\Eldowy-Work\Titil_Lang\Titil_excell\Titles_with_lang.xlsx"
output_file = base_output_file  # هنا بناخد نسخة منه كبداية

# لو الملف موجود، نسلسل اسمه
counter = 2
while os.path.exists(output_file):
    file_root, file_ext = os.path.splitext(base_output_file)
    output_file = f"{file_root}_{counter}{file_ext}"
    counter += 1

# قراءة الملف
df = pd.read_excel(input_file)

# الأعمدة اللي عايز أجيب لغتها
target_columns = ["Title 245 (1)(a)", "Title 246 (1)(a)"]

# دالة لتحديد اللغة
def get_lang(text):
    if pd.isna(text) or not str(text).strip():
        return "Unknown"
    try:
        lang_code = detect(str(text))
        lang_map = {
            "ar": "Arabic",
            "en": "English",
            "fr": "French",
            "de": "German"
        }
        return lang_map.get(lang_code, lang_code)  # يطلع الاسم أو الكود
    except:
        return "Unknown"

# إضافة الأعمدة الجديدة جنب كل عمود
for col in target_columns:
    new_col = col + " - Language"
    df[new_col] = df[col].apply(get_lang)

# حفظ النتيجة في ملف جديد
df.to_excel(output_file, index=False)

print(f"✅ النتيجة اتخزنت في: {output_file}")
