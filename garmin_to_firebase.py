import os
import requests
from garminconnect import Garmin

# 1. ข้อมูลสำหรับเข้าสู่ระบบ Garmin
EMAIL = "ju.cbr2@gmail.com"    # <-- ใส่อีเมล Garmin
PASSWORD = "KkJunR-0865196974."          # <-- ใส่รหัสผ่าน Garmin

# 2. URL Firebase Realtime Database ของคุณ
FIREBASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def sync_garmin_to_firebase():
    print(" กำลังเชื่อมต่อ Garmin Connect ผ่าน Token Session...")
    
    try:
        # เข้าสู่ระบบและสร้าง Token อัตโนมัติ
        client = Garmin(EMAIL, PASSWORD)
        client.login()
        print(" ล็อกอิน Garmin สำเร็จเรียบร้อย!")

        # วันที่ต้องการดึง (หรือเพิ่มวันอื่นที่ต้องการ เช่น วันที่ 11, 14, 15)
        target_dates = ["2026-08-11", "2026-08-14", "2026-08-15", "2026-08-16"]

        for date_str in target_dates:
            try:
                sleep_data = client.get_sleep_data(date_str)
                dto = sleep_data.get('dailySleepDTO', {}) if sleep_data else {}
                
                # ตรวจสอบว่ามีคะแนนการนอนจริง
                overall_score = dto.get('sleepScores', {}).get('overall', {}).get('value')
                if overall_score:
                    payload = {
                        "calendarDate": date_str,
                        "garminSleepScore": overall_score,
                        "durationInSeconds": dto.get('sleepTimeSeconds', 0),
                        "deepSleepDurationInSeconds": dto.get('deepSleepSeconds', 0),
                        "remSleepDurationInSeconds": dto.get('remSleepSeconds', 0),
                        "lightSleepDurationInSeconds": dto.get('lightSleepSeconds', 0),
                        "sleepStartTimestamp": dto.get('sleepStartTimestampGMT', 0),
                        "sleepEndTimestamp": dto.get('sleepEndTimestampGMT', 0),
                        "restlessMomentsCount": dto.get('restlessMomentsCount', len(sleep_data.get('restlessMoments', []))),
                        "avgSleepStress": dto.get('avgSleepStress', 0)
                    }

                    # ส่งข้อมูลเข้า Node garmin_sleep บน Firebase
                    res = requests.put(f"{FIREBASE_URL}/garmin_sleep/{date_str}.json", json=payload)
                    if res.status_code == 200:
                        print(f" บันทึกข้อมูลวันที่ {date_str} ลง Firebase สำเร็จ! (Sleep Score: {overall_score})")
                    else:
                        print(f" บันทึกวันที่ {date_str} ไม่สำเร็จ: {res.text}")
                else:
                    print(f" ข้ามวันที่ {date_str} (ไม่มีข้อมูลการใส่นาฬิกานอน)")
            except Exception as day_err:
                print(f" ไม่สามารถดึงข้อมูลวันที่ {date_str} ได้: {day_err}")

    except Exception as e:
        print(f" เกิดข้อผิดพลาดในการเชื่อมต่อ Garmin: {e}")

if __name__ == "__main__":
    sync_garmin_to_firebase()