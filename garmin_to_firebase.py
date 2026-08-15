import os
import requests
from datetime import datetime, timedelta
from garminconnect import Garmin

EMAIL = "ju.cbr2@gmail.com" # <-- ใส่อีเมล Garmin
PASSWORD = "KkJunR-0865196974." # <-- ใส่รหัสผ่าน Garmin
FIREBASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"
# จำนวนวันที่ต้องการให้ดึงย้อนหลังอัตโนมัติ (เช่น 7 วันล่าสุด)
DAYS_BACK = 7

def get_dynamic_dates(days_count=7):
    today = datetime.now()
    # ดึงตั้งแต่วันปัจจุบันถอยหลังไป 7 วัน
    dates = [(today - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(days_count)]
    dates.reverse()
    return dates

def sync_garmin_to_firebase():
    print("🔄 กำลังเชื่อมต่อ Garmin Connect...")
    try:
        # ใช้การ Login แบบเดิมที่เคยรันผ่าน 100%
        client = Garmin(EMAIL, PASSWORD)
        client.login()
        print("✅ ล็อกอินสำเร็จ!")

        target_dates = get_dynamic_dates(DAYS_BACK)
        print(f"📅 รายการวันที่ตรวจสอบอัตโนมัติ: {target_dates}")

        for date_str in target_dates:
            try:
                sleep_data = client.get_sleep_data(date_str) or {}
                dto = sleep_data.get('dailySleepDTO', {}) or {}
                sleep_scores = dto.get('sleepScores', {}) or {}
                
                overall_score = sleep_scores.get('overall', {}).get('value')
                
                # มีข้อมูลการนอนจริง
                if overall_score:
                    # ดึงจำนวนครั้งการดิ้น/ขยับตัวจาก Root Key ที่ค้นพบ
                    restless_count = sleep_data.get('restlessMomentsCount')
                    if restless_count is None:
                        srm = sleep_data.get('sleepRestlessMoments')
                        if isinstance(srm, list):
                            restless_count = len(srm)
                        else:
                            restless_count = dto.get('restlessMomentsCount', 0)

                    payload = {
                        "calendarDate": date_str,
                        "garminSleepScore": overall_score,
                        "durationInSeconds": dto.get('sleepTimeSeconds', 0),
                        "deepSleepDurationInSeconds": dto.get('deepSleepSeconds', 0),
                        "remSleepDurationInSeconds": dto.get('remSleepSeconds', 0),
                        "lightSleepDurationInSeconds": dto.get('lightSleepSeconds', 0),
                        "sleepStartTimestamp": dto.get('sleepStartTimestampGMT', 0),
                        "sleepEndTimestamp": dto.get('sleepEndTimestampGMT', 0),
                        "restlessMomentsCount": restless_count,
                        "avgSleepStress": dto.get('avgSleepStress', 0)
                    }

                    # ส่งเข้า Firebase
                    requests.put(f"{FIREBASE_URL}/garmin_sleep/{date_str}.json", json=payload)
                    
                    # อัปเดตลง Node History
                    history_ref = f"{FIREBASE_URL}/personal_sensitivity/history/{date_str}.json"
                    existing_hist = requests.get(history_ref).json() or {}
                    existing_hist.update({
                        "date": date_str,
                        "garminScore": overall_score,
                        "restlessCount": restless_count
                    })
                    requests.put(history_ref, json=existing_hist)

                    print(f"✅ วันที่ {date_str} -> Score: {overall_score} | ขยับตัว: {restless_count} ครั้ง")
                else:
                    print(f"ℹ️ ข้ามวันที่ {date_str} (ยังไม่มีข้อมูลการนอน)")
            except Exception as e:
                print(f"⚠️ ข้ามวันที่ {date_str}: {e}")

    except Exception as e:
        print(f"❌ เชื่อมต่อ Garmin ไม่สำเร็จ: {e}")

if __name__ == "__main__":
    sync_garmin_to_firebase()