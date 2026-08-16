import requests
from datetime import datetime

FIREBASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

# เกณฑ์มาตรฐานของห้องนอนที่หากเกินจะถือเป็นสิ่งรบกวน (Triggers)
THRESHOLDS = {
    'co2': 1000,          # ppm
    'temperature_high': 26.5, # °C
    'temperature_low': 22.0,  # °C
    'humidity_high': 65.0,    # %
    'humidity_low': 45.0,     # %
    'sound': 45.0,            # dB
    'pm25': 35.0,             # µg/m³
    'light_lux': 5.0          # lux
}

def process_matching():
    print("🔄 กำลังประมวลผลการจับคู่สิ่งรบกวนระหว่าง Garmin และ Sensor ทุกตัว...")
    
    # 1. ดึงข้อมูล Garmin และ Logs จาก Firebase
    garmin_data = requests.get(f"{FIREBASE_URL}/garmin_sleep.json").json() or {}
    logs_data = requests.get(f"{FIREBASE_URL}/logs.json").json() or {}
    
    logs_list = list(logs_data.values()) if isinstance(logs_data, dict) else logs_data

    for date_str, g_data in garmin_data.items():
        if not g_data or not g_data.get('garminSleepScore'):
            continue
            
        restless_total = g_data.get('restlessMomentsCount', 0)
        
        # กรอง Logs เฉพาะของวันนั้นๆ
        day_logs = []
        for log in logs_list:
            if not isinstance(log, dict): continue
            t = log.get('timestamp', 0)
            if t < 1000000000000: t *= 1000
            d_str = datetime.fromtimestamp(t / 1000).strftime('%Y-%m-%d')
            if d_str == date_str:
                day_logs.append(log)

        # 2. ตรวจสอบสัดส่วนความผิดปกติของเซนเซอร์แต่ละประเภท
        trigger_counts = {
            'co2': 0,
            'temperature': 0,
            'sound_db': 0,
            'humidity': 0,
            'pm25': 0,
            'light_lux': 0
        }

        if day_logs and restless_total > 0:
            for log in day_logs:
                if float(log.get('co2', 0)) > THRESHOLDS['co2']:
                    trigger_counts['co2'] += 1
                if float(log.get('temperature', 24)) > THRESHOLDS['temperature_high'] or float(log.get('temperature', 24)) < THRESHOLDS['temperature_low']:
                    trigger_counts['temperature'] += 1
                if float(log.get('sound', 0)) > THRESHOLDS['sound']:
                    trigger_counts['sound_db'] += 1
                if float(log.get('humidity', 55)) > THRESHOLDS['humidity_high'] or float(log.get('humidity', 55)) < THRESHOLDS['humidity_low']:
                    trigger_counts['humidity'] += 1
                if float(log.get('pm25', 0)) > THRESHOLDS['pm25']:
                    trigger_counts['pm25'] += 1
                if float(log.get('light_lux', 0)) > THRESHOLDS['light_lux']:
                    trigger_counts['light_lux'] += 1

            # ปรับสัดส่วนตามสัดส่วนการดิ้นจริง
            total_abnormal = sum(trigger_counts.values())
            if total_abnormal > 0:
                for k in trigger_counts:
                    trigger_counts[k] = round((trigger_counts[k] / total_abnormal) * restless_total)

        # 3. บันทึกผลลง Firebase Node all_sensors_events
        event_payload = {
            "calendarDate": date_str,
            "totalRestlessMoments": restless_total,
            "sensorTriggerBreakdown": trigger_counts,
            "overallSensitivityScore": round(min((restless_total / 40) * 100, 100), 1)
        }
        
        requests.put(f"{FIREBASE_URL}/personal_sensitivity/all_sensors_events/{date_str}.json", json=event_payload)
        print(f"✅ ประมวลผล {date_str} เรียบร้อย: {trigger_counts}")

if __name__ == "__main__":
    process_matching()