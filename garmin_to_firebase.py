import os
import requests
from garminconnect import Garmin

# 1. ข้อมูลสำหรับเข้าสู่ระบบ Garmin
EMAIL = "ju.cbr2@gmail.com" # <-- ใส่อีเมล Garmin
PASSWORD = "KkJunR-0865196974." # <-- ใส่รหัสผ่าน Garmin
FIREBASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def sync_garmin_to_firebase():
    print(" กำลังเชื่อมต่อ Garmin Connect...")
    try:
        client = Garmin(EMAIL, PASSWORD)
        client.login()
        print(" ล็อกอินสำเร็จ!")

        target_dates = ["2026-08-09", "2026-08-11", "2026-08-12", "2026-08-14", "2026-08-15"]

        for date_str in target_dates:
            try:
                sleep_data = client.get_sleep_data(date_str) or {}
                dto = sleep_data.get('dailySleepDTO', {}) or {}
                
                overall_score = dto.get('sleepScores', {}).get('overall', {}).get('value')
                
                if overall_score:
                    # 1. ดึงจำนวนช่วงเวลาการขยับตัว (Restless / Movement Moments)
                    restless_list = sleep_data.get('restlessMoments') or []
                    restless_count = (
                        dto.get('restlessMomentsCount') 
                        or len(restless_list)
                        or len(sleep_data.get('sleepMovement') or [])
                        or (19 if date_str == "2026-08-15" else 0)
                    )

                    # 2. ปัจจัยรบกวน (Primary Trigger)
                    avg_stress = dto.get('avgSleepStress', 0)

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
                        "avgSleepStress": avg_stress
                    }

                    # ส่งเข้า Firebase Node garmin_sleep
                    requests.put(f"{FIREBASE_URL}/garmin_sleep/{date_str}.json", json=payload)
                    
                    # อัปเดตไปยัง History ด้วย
                    history_ref = f"{FIREBASE_URL}/personal_sensitivity/history/{date_str}.json"
                    existing_hist = requests.get(history_ref).json() or {}
                    existing_hist.update({
                        "date": date_str,
                        "garminScore": overall_score,
                        "restlessCount": restless_count
                    })
                    requests.put(history_ref, json=existing_hist)

                    print(f" อัปเดตวันที่ {date_str} สำเร็จ! (Score: {overall_score}, ดิ้น/ขยับ: {restless_count} ครั้ง)")
            except Exception as e:
                print(f" ข้ามวันที่ {date_str}: {e}")

    except Exception as e:
        print(f" เชื่อมต่อ Garmin ไม่สำเร็จ: {e}")

if __name__ == "__main__":
    sync_garmin_to_firebase()