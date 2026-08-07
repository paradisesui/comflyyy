import json
import requests
from datetime import datetime

DATABASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def parse_iso_to_ms(iso_str):
    if not iso_str: 
        return 0
    dt = datetime.strptime(iso_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")
    return int(dt.timestamp() * 1000)

def main():
    try:
        # 1. โหลดข้อมูล Garmin
        with open("garmin_friend_data.json", "r", encoding="utf-8") as f:
            records = json.load(f)

        print("🔄 ดึงข้อมูลเซ็นเซอร์ทั้งหมดจาก Firebase...")
        sensor_res = requests.get(f"{DATABASE_URL}/sensors.json")
        sensors_data = sensor_res.json() if sensor_res.status_code == 200 and sensor_res.json() else {}

        # 2. คำนวณค่าเฉลี่ยเซ็นเซอร์ระบบ
        overall_avg = {}
        if isinstance(sensors_data, dict) and sensors_data:
            for k in ["temperature", "humidity", "sound_db", "light_lux", "co2", "pm25"]:
                vals = [v[k] for v in sensors_data.values() if isinstance(v, dict) and k in v]
                if vals: 
                    overall_avg[k] = sum(vals) / len(vals)

        # 3. วนลูปตามวันใน Garmin
        for garmin_record in records:
            daily_dto = garmin_record.get("dailySleepDTO", {})
            calendar_date = daily_dto.get("calendarDate")
            
            # ดึงข้อมูลการดิ้น (รองรับทั้ง Array และ Object)
            restless_data = garmin_record.get("sleepRestlessMoments", [])
            if isinstance(restless_data, dict):
                restless_moments = list(restless_data.values())
            elif isinstance(restless_data, list):
                restless_moments = restless_data
            else:
                restless_moments = []

            # จำนวนครั้งการดิ้นรวม
            total_restless_count = len(restless_moments) or garmin_record.get("restlessMomentsCount", 0) or daily_dto.get("restlessMomentsCount", 0)
            sleep_levels = garmin_record.get("sleepLevels", [])

            trigger_counts = {
                "sound_db": 0,
                "temperature": 0,
                "light_lux": 0,
                "humidity": 0,
                "co2": 0,
                "pm25": 0
            }

            # กรณีดึง Restless Timestamp รายนาทีได้
            if restless_moments:
                for restless in restless_moments:
                    restless_ms = restless.get("startGMT") if isinstance(restless, dict) else 0
                    
                    # หา Sleep Stage ณ นาทีนั้น
                    current_stage = "Light Sleep"
                    for level in sleep_levels:
                        s_ms = parse_iso_to_ms(level.get("startGMT", ""))
                        e_ms = parse_iso_to_ms(level.get("endGMT", ""))
                        if s_ms <= restless_ms <= e_ms:
                            act = level.get("activityLevel")
                            if act == 0.0: current_stage = "Deep Sleep"
                            elif act == 1.0: current_stage = "Light Sleep"
                            elif act == 2.0: current_stage = "REM Sleep"
                            break

                    # Match ค่าเซ็นเซอร์ ณ นาทีนั้น (ระยะ ±5 นาที)
                    matched = dict(overall_avg)
                    if isinstance(sensors_data, dict):
                        for ts, sensor in sensors_data.items():
                            if isinstance(sensor, dict) and "timestamp_ms" in sensor:
                                if abs(sensor["timestamp_ms"] - restless_ms) <= 300000:
                                    for k, v in sensor.items():
                                        if k != "timestamp_ms": 
                                            matched[k] = v

                    # ตรวจสอบเงื่อนไข Threshold
                    if matched.get("sound_db", 0) > 45: trigger_counts["sound_db"] += 1
                    if matched.get("temperature", 0) > 25: trigger_counts["temperature"] += 1
                    if matched.get("light_lux", 0) > 5: trigger_counts["light_lux"] += 1
                    if matched.get("humidity", 0) > 60: trigger_counts["humidity"] += 1
                    if matched.get("co2", 0) > 800: trigger_counts["co2"] += 1
                    if matched.get("pm25", 0) > 25: trigger_counts["pm25"] += 1
            else:
                # กรณี Garmin ไม่มี Timestamp ดิ้นแยก ให้กระจายตามสัดส่วน
                temp_v = overall_avg.get("temperature", 26)
                sound_v = overall_avg.get("sound_db", 50)
                
                if temp_v > 25: trigger_counts["temperature"] = int(total_restless_count * 0.6)
                if sound_v > 45: trigger_counts["sound_db"] = int(total_restless_count * 0.4)

            # หาเซ็นเซอร์ตัวการหลักที่มีผลมากที่สุด
            sorted_triggers = sorted(trigger_counts.items(), key=lambda x: x[1], reverse=True)
            top_sensor = sorted_triggers[0][0] if sorted_triggers[0][1] > 0 else "temperature"

            payload = {
                "calendarDate": calendar_date,
                "totalRestlessEvents": total_restless_count,
                "primarySensorTrigger": top_sensor,
                "sensorTriggerBreakdown": trigger_counts
            }

            # บันทึกข้อมูลเข้า Firebase
            target_url = f"{DATABASE_URL}/personal_sensitivity/all_sensors_events/{calendar_date}.json"
            requests.put(target_url, json=payload)
            print(f"✅ วันที่ {calendar_date} (ดิ้นรวม {total_restless_count} ครั้ง) -> ตัวการหลัก: {top_sensor}")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    main()