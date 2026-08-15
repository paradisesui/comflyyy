import os
import requests
from garminconnect import Garmin

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
                sleep_scores = dto.get('sleepScores', {}) or {}
                
                overall_score = sleep_scores.get('overall', {}).get('value')
                
                if overall_score:
                    # 1. ดึงจาก Root Keys ตรงๆ ตามที่ Garmin ส่งมา
                    restless_count = sleep_data.get('restlessMomentsCount')
                    
                    # 2. ถ้าระดับ Root ไม่มีตัวเลข ให้นับความยาว Array ของ sleepRestlessMoments
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

                    # ส่งเข้า Node garmin_sleep
                    requests.put(f"{FIREBASE_URL}/garmin_sleep/{date_str}.json", json=payload)
                    
                    # อัปเดตลง Node personal_sensitivity/history
                    history_ref = f"{FIREBASE_URL}/personal_sensitivity/history/{date_str}.json"
                    existing_hist = requests.get(history_ref).json() or {}
                    existing_hist.update({
                        "date": date_str,
                        "garminScore": overall_score,
                        "restlessCount": restless_count
                    })
                    requests.put(history_ref, json=existing_hist)

                    print(f" วันที่ {date_str} -> Sleep Score: {overall_score} | ขยับตัว/ดิ้นจริง: {restless_count} ครั้ง")
            except Exception as e:
                print(f" ข้ามวันที่ {date_str}: {e}")

    except Exception as e:
        print(f" เชื่อมต่อ Garmin ไม่สำเร็จ: {e}")

if __name__ == "__main__":
    sync_garmin_to_firebase()