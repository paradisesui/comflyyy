import time
import subprocess
import requests
import sys
from datetime import datetime

FIREBASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def is_today_synced(today_str):
    try:
        res = requests.get(f"{FIREBASE_URL}/garmin_sleep/{today_str}.json", timeout=10).json()
        return bool(res and res.get('garminSleepScore'))
    except Exception:
        return False

def run_sync_scripts():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 🔄 เริ่มตรวจสอบและดึงข้อมูล...")
    python_exec = sys.executable
    subprocess.run([python_exec, "garmin_to_firebase.py"], check=False)
    subprocess.run([python_exec, "process_all_sensors_dynamic.py"], check=False)

def start_smart_poller():
    print("🚀 ระบบ Smart Wake-up Sync เริ่มทำงานแล้ว...")
    while True:
        now = datetime.now()
        today_str = now.strftime('%Y-%m-%d')
        hour = now.hour

        if is_today_synced(today_str):
            print(f"[{now.strftime('%H:%M:%S')}] ✅ วันนี้ ({today_str}) มีข้อมูลครบแล้ว พักรอตรวจเช็กวันถัดไป...")
            time.sleep(3600)
            continue

        if 5 <= hour < 12:
            print(f"[{now.strftime('%H:%M:%S')}] ⏰ ช่วงเช้า: กำลังค้นหาข้อมูลการตื่นนอนจาก Garmin...")
            run_sync_scripts()
            time.sleep(900)  # วนเช็กทุก 15 นาที
        else:
            print(f"[{now.strftime('%H:%M:%S')}] ⏳ นอกช่วงเช้า: ค้นหาข้อมูลแบบประหยัดพลังงาน...")
            run_sync_scripts()
            time.sleep(3600) # วนเช็กทุก 1 ชั่วโมง

if __name__ == "__main__":
    start_smart_poller()