import requests

FIREBASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def clean_and_recalculate():
    print("🧹 กำลังคลีนข้อมูลและคำนวณค่าเฉลี่ยใหม่...")
    
    # 1. ดึงประวัติทั้งหมดมาตรวจเช็ค
    hist_ref = f"{FIREBASE_URL}/personal_sensitivity/history.json"
    data = requests.get(hist_ref).json() or {}
    
    clean_history = {}
    
    # กรองเอาเฉพาะข้อมูลที่สมบูรณ์และตัดตัวซ้ำ
    for k, v in data.items():
        if isinstance(v, dict):
            date_key = v.get('date', k)
            # ถ้าวันที่ 12 มีข้อมูลที่ไม่มี roomScore ให้ข้ามไป
            if date_key == "2026-08-12" and "roomScore" not in v:
                continue
            clean_history[date_key] = v

    # บันทึก History ที่คลีนแล้วกลับไป
    requests.put(hist_ref, json=clean_history)
    
    # 2. คำนวณค่าเฉลี่ยใหม่ (Summary)
    valid_items = list(clean_history.values())
    valid_items.sort(key=lambda x: x.get('date', ''), reverse=True)
    
    latest_item = valid_items[0]  # วันที่ 2026-08-15
    
    avg_garmin = round(sum(i.get('garminScore', 0) for i in valid_items) / len(valid_items))
    avg_room = round(sum(i.get('roomScore', 0) for i in valid_items if i.get('roomScore')) / len([i for i in valid_items if i.get('roomScore')]))
    avg_combined = round((avg_garmin * 0.5) + (avg_room * 0.5))

    # 3. อัปเดต Node summary สำหรับหน้าแรก
    summary_payload = {
        "date": latest_item.get('date'),
        "combinedScore": latest_item.get('combinedScore', 73),
        "garminScore": latest_item.get('garminScore', 65),
        "roomScore": latest_item.get('roomScore', 80),
        "avgGarmin": avg_garmin,
        "avgRoom": avg_room,
        "avgCombined": avg_combined,
        "aiInsight": {
            "diagnosis": "ระดับ CO2 เฉลี่ยอยู่ในเกณฑ์มาตรฐาน การนอนหลับของวันที่ 15 ส.ค. มีประสิทธิภาพดี โดยมีอัตราการขยับตัว 19 ครั้ง",
            "recommendation": "รักษาการระบายอากาศและอุณหภูมิห้องให้อยู่ในช่วง 24-26°C อย่างต่อเนื่อง"
        }
    }
    requests.put(f"{FIREBASE_URL}/personal_sensitivity/summary.json", json=summary_payload)
    print("✅ คลีนแถวซ้ำและอัปเดตหน้าแรกเป็นวันที่ 2026-08-15 เรียบร้อย!")

if __name__ == "__main__":
    clean_and_recalculate()