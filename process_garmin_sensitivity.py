import json
import requests
from datetime import datetime

DATABASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def convert_ms_to_datetime(ms):
    if not ms:
        return None
    return datetime.fromtimestamp(ms / 1000.0).strftime('%Y-%m-%d %H:%M:%S')

def main():
    try:
        with open("garmin_friend_data.json", "r", encoding="utf-8") as f:
            records = json.load(f)

        print("🔄 ดึงข้อมูลเซ็นเซอร์จาก Firebase...")
        sensor_res = requests.get(f"{DATABASE_URL}/sensors.json")
        sensors_data = sensor_res.json() if sensor_res.status_code == 200 and sensor_res.json() else {}

        # วนลูปประมวลผลทีละวัน
        for garmin_record in records:
            daily_dto = garmin_record.get("dailySleepDTO", {})
            calendar_date = daily_dto.get("calendarDate")
            sleep_start_ms = daily_dto.get("sleepStartTimestampGMT")
            sleep_end_ms = daily_dto.get("sleepEndTimestampGMT")

            matched_temp = []
            matched_hum = []

            if isinstance(sensors_data, dict):
                for ts, sensor_val in sensors_data.items():
                    if isinstance(sensor_val, dict) and "timestamp_ms" in sensor_val:
                        s_ms = sensor_val["timestamp_ms"]
                        if sleep_start_ms <= s_ms <= sleep_end_ms:
                            if "temperature" in sensor_val: matched_temp.append(sensor_val["temperature"])
                            if "humidity" in sensor_val: matched_hum.append(sensor_val["humidity"])

            avg_temp = round(sum(matched_temp) / len(matched_temp), 2) if matched_temp else 25.0
            avg_hum = round(sum(matched_hum) / len(matched_hum), 2) if matched_hum else 50.0

            sleep_score = daily_dto.get("sleepScores", {}).get("overall", {}).get("value", 0)
            awake_count = daily_dto.get("awakeCount", 0)
            restless_count = garmin_record.get("restlessMomentsCount", 0)
            avg_stress = daily_dto.get("avgSleepStress", 0)

            sensitivity_score = round(((restless_count * 0.5) + (awake_count * 5) + (avg_stress * 0.3)) / (sleep_score / 100 if sleep_score > 0 else 1), 2)

            payload = {
                "calendarDate": calendar_date,
                "timestamps": {
                    "sleepStartGMT": convert_ms_to_datetime(sleep_start_ms),
                    "sleepEndGMT": convert_ms_to_datetime(sleep_end_ms),
                    "sleepStartMs": sleep_start_ms,
                    "sleepEndMs": sleep_end_ms
                },
                "garminHealth": {
                    "sleepScore": sleep_score,
                    "deepSleepMinutes": round(daily_dto.get("deepSleepSeconds", 0) / 60, 1),
                    "lightSleepMinutes": round(daily_dto.get("lightSleepSeconds", 0) / 60, 1),
                    "remSleepMinutes": round(daily_dto.get("remSleepSeconds", 0) / 60, 1),
                    "awakeMinutes": round(daily_dto.get("awakeSleepSeconds", 0) / 60, 1),
                    "restlessMomentsCount": restless_count,
                    "avgSleepStress": avg_stress
                },
                "matchedEnvironment": {
                    "avgRoomTemperature": avg_temp,
                    "avgRoomHumidity": avg_hum,
                    "matchedDataPoints": len(matched_temp)
                },
                "personalSensitivity": {
                    "score": sensitivity_score,
                    "level": "High Sensitivity" if sensitivity_score > 40 else "Moderate Sensitivity" if sensitivity_score > 20 else "Low Sensitivity"
                }
            }

            # ยิงขึ้น Firebase แยกกิ่งตามวันที่
            target_url = f"{DATABASE_URL}/personal_sensitivity/{calendar_date}.json"
            res = requests.put(target_url, json=payload)
            if res.status_code == 200:
                print(f"✅ ทำ Timestamp Match วันที่ {calendar_date} สำเร็จ! (Sensitivity: {sensitivity_score})")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    main()