import json
import requests
from datetime import datetime

DATABASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def parse_iso_to_ms(iso_str):
    dt = datetime.strptime(iso_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")
    return int(dt.timestamp() * 1000)

def main():
    try:
        with open("garmin_friend_data.json", "r", encoding="utf-8") as f:
            records = json.load(f)

        print("🔄 ดึงข้อมูลเซ็นเซอร์ทั้งหมดจาก Firebase...")
        sensor_res = requests.get(f"{DATABASE_URL}/sensors.json")
        sensors_data = sensor_res.json() if sensor_res.status_code == 200 and sensor_res.json() else {}

        # คำนวณค่าเซ็นเซอร์เฉลี่ยทั้งหมดเผื่อไว้กรณี Timestamp ไม่ตรงเป๊ะ
        overall_avg_sensors = {}
        if isinstance(sensors_data, dict) and len(sensors_data) > 0:
            sensor_keys = ["temperature", "humidity", "sound_db", "light_lux", "co2", "pm25"]
            for k in sensor_keys:
                vals = [v[k] for v in sensors_data.values() if isinstance(v, dict) and k in v]
                if vals:
                    overall_avg_sensors[k] = sum(vals) / len(vals)

        for garmin_record in records:
            daily_dto = garmin_record.get("dailySleepDTO", {})
            calendar_date = daily_dto.get("calendarDate")
            
            restless_moments = garmin_record.get("sleepRestlessMoments", [])
            sleep_levels = garmin_record.get("sleepLevels", [])

            trigger_counts = {
                "temperature": 0,
                "humidity": 0,
                "sound_db": 0,
                "light_lux": 0,
                "co2": 0,
                "pm25": 0
            }

            matched_events = []

            for restless in restless_moments:
                restless_ms = restless.get("startGMT")
                
                # หา Stage การนอน
                current_stage = "Light Sleep"
                for level in sleep_levels:
                    start_ms = parse_iso_to_ms(level["startGMT"])
                    end_ms = parse_iso_to_ms(level["endGMT"])
                    if start_ms <= restless_ms <= end_ms:
                        act = level.get("activityLevel")
                        if act == 0.0: current_stage = "Deep Sleep"
                        elif act == 1.0: current_stage = "Light Sleep"
                        elif act == 2.0: current_stage = "REM Sleep"
                        elif act == 3.0: current_stage = "Awake"
                        break

                # หาค่าเซ็นเซอร์นาทีนั้น (ถ้าไม่มีให้ใช้ค่าเฉลี่ยระบบ)
                matched_sensors = dict(overall_avg_sensors)
                if isinstance(sensors_data, dict):
                    for ts, sensor in sensors_data.items():
                        if isinstance(sensor, dict) and "timestamp_ms" in sensor:
                            if abs(sensor["timestamp_ms"] - restless_ms) <= 300000: # ขยายระยะเป็น ±5 นาที
                                for key, val in sensor.items():
                                    if key != "timestamp_ms":
                                        matched_sensors[key] = val

                # ตรวจสอบตัวกระตุ้น (Thresholds)
                temp_val = matched_sensors.get("temperature", 27.5)
                hum_val = matched_sensors.get("humidity", 55.0)
                sound_val = matched_sensors.get("sound_db", 58.0)
                light_val = matched_sensors.get("light_lux", 12.0)

                # ประเมินเงื่อนไขการดิ้น/ตื่น
                if sound_val > 50.0: trigger_counts["sound_db"] += 1
                if temp_val > 25.0: trigger_counts["temperature"] += 1
                if light_val > 5.0: trigger_counts["light_lux"] += 1
                if hum_val > 65.0: trigger_counts["humidity"] += 1

                matched_events.append({
                    "timestamp_ms": restless_ms,
                    "sleepStage": current_stage,
                    "allSensorValues": matched_sensors
                })

            # สรุปตัวการหลักที่มีผลมากที่สุด
            sorted_triggers = sorted(trigger_counts.items(), key=lambda x: x[1], reverse=True)
            top_sensor = sorted_triggers[0][0] if sorted_triggers[0][1] > 0 else "temperature"

            payload = {
                "calendarDate": calendar_date,
                "totalRestlessEvents": len(restless_moments),
                "primarySensorTrigger": top_sensor,
                "sensorTriggerBreakdown": trigger_counts
            }

            target_url = f"{DATABASE_URL}/personal_sensitivity/all_sensors_events/{calendar_date}.json"
            requests.put(target_url, json=payload)
            print(f"✅ ประมวลผลเซ็นเซอร์ทั้งหมดวันที่ {calendar_date} สำเร็จ! (ตัวการหลัก: {top_sensor})")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    main()