import json
import requests
from datetime import datetime

DATABASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def parse_iso_to_ms(iso_str):
    if not iso_str: 
        return 0
    dt = datetime.strptime(iso_str.split('.')[0], "%Y-%m-%dT%H:%M:%S")
    return int(dt.timestamp() * 1000)

def calculate_room_score(avg_temp, avg_sound, avg_hum):
    """คำนวณคะแนนสภาพแวดล้อมห้อง (0-100)"""
    score = 100
    # 1. เช็คอุณหภูมิห้อง (เหมาะสมที่สุด 23-25°C)
    if avg_temp > 25:
        score -= (avg_temp - 25) * 5
    elif avg_temp < 23:
        score -= (23 - avg_temp) * 5

    # 2. เช็คเสียงรบกวน (เหมาะสมที่สุด <= 45 dB)
    if avg_sound > 45:
        score -= (avg_sound - 45) * 2

    # 3. เช็คความชื้น (เหมาะสมที่สุด 45-60%)
    if avg_hum > 60:
        score -= (avg_hum - 60) * 2
    elif avg_hum < 45:
        score -= (45 - avg_hum) * 2

    return max(0, min(100, round(score, 1)))

def main():
    try:
        # 1. โหลดข้อมูล Garmin
        with open("garmin_friend_data.json", "r", encoding="utf-8") as f:
            records = json.load(f)

        records.sort(key=lambda x: x.get("dailySleepDTO", {}).get("calendarDate", ""))

        print("🔄 ดึงข้อมูลเซ็นเซอร์ทั้งหมดจาก Firebase...")
        sensor_res = requests.get(f"{DATABASE_URL}/sensors.json")
        sensors_data = sensor_res.json() if sensor_res.status_code == 200 and sensor_res.json() else {}

        accumulated_history = []

        for garmin_record in records:
            daily_dto = garmin_record.get("dailySleepDTO", {})
            calendar_date = daily_dto.get("calendarDate")
            
            # ดึงข้อมูลการดิ้น
            restless_data = garmin_record.get("sleepRestlessMoments", [])
            if isinstance(restless_data, dict):
                restless_moments = list(restless_data.values())
            elif isinstance(restless_data, list):
                restless_moments = restless_data
            else:
                restless_moments = []

            total_restless_count = len(restless_moments) or garmin_record.get("restlessMomentsCount", 0) or daily_dto.get("restlessMomentsCount", 0)
            awake_count = daily_dto.get("awakeCount", 0)
            avg_stress = daily_dto.get("avgSleepStress", 0)
            garmin_sleep_score = daily_dto.get("sleepScores", {}).get("overall", {}).get("value", 0)

            # ดึงข้อมูลเซ็นเซอร์ช่วงเวลานอน
            matched_temp, matched_sound, matched_hum = [], [], []
            if isinstance(sensors_data, dict):
                for sensor in sensors_data.values():
                    if isinstance(sensor, dict):
                        if "temperature" in sensor: matched_temp.append(sensor["temperature"])
                        if "sound_db" in sensor: matched_sound.append(sensor["sound_db"])
                        if "humidity" in sensor: matched_hum.append(sensor["humidity"])

            avg_temp = round(sum(matched_temp)/len(matched_temp), 1) if matched_temp else 25.0
            avg_sound = round(sum(matched_sound)/len(matched_sound), 1) if matched_sound else 40.0
            avg_hum = round(sum(matched_hum)/len(matched_hum), 1) if matched_hum else 50.0

            # 2. คำนวณคะแนนห้อง และ Combined Sleep Score (Garmin 50% + Room 50%)
            room_env_score = calculate_room_score(avg_temp, avg_sound, avg_hum)
            combined_sleep_score = round((garmin_sleep_score + room_env_score) / 2, 1)

            # 3. คำนวณ Daily Sensitivity
            daily_sensitivity = round(((total_restless_count * 0.5) + (awake_count * 5) + (avg_stress * 0.3)) / (combined_sleep_score / 100 if combined_sleep_score > 0 else 1), 2)

            accumulated_history.append({
                "date": calendar_date,
                "sensitivity": daily_sensitivity,
                "avgTemp": avg_temp,
                "restless": total_restless_count
            })

            # 4. คำนวณสถิติสะสม
            total_days = len(accumulated_history)
            cum_sensitivity = round(sum(item["sensitivity"] for item in accumulated_history) / total_days, 2)
            cum_avg_temp = round(sum(item["avgTemp"] for item in accumulated_history) / total_days, 2)

            primary_factor = "อุณหภูมิห้อง (Temperature)" if cum_avg_temp > 24 else "เสียงรบกวน (Noise)"

            payload_summary = {
                "evaluatedDate": calendar_date,
                "totalAccumulatedDays": total_days,
                "dailyMetrics": {
                    "garminSleepScore": garmin_sleep_score,
                    "roomEnvironmentScore": room_env_score,
                    "combinedSleepScore": combined_sleep_score,
                    "restlessMoments": total_restless_count,
                    "todaySensitivity": daily_sensitivity,
                    "avgSleepStress": avg_stress
                },
                "cumulativeSummary": {
                    "overallSensitivityScore": cum_sensitivity,
                    "avgRoomTemp": cum_avg_temp,
                    "primarySensitivityFactor": primary_factor,
                    "statusMessage": f"วิเคราะห์จากข้อมูลสะสม {total_days} วัน: สภาพแวดล้อมที่มีผลต่อร่างกายมากที่สุดคือ {primary_factor}"
                }
            }

            # บันทึกขึ้น Firebase Node หลัก
            requests.put(f"{DATABASE_URL}/personal_sensitivity/summary.json", json=payload_summary)

            # บันทึกรายละเอียดการกระตุ้นรายเซ็นเซอร์ (Sensor Breakdown Event)
            trigger_counts = {
                "sound_db": int(total_restless_count * 0.4) if avg_sound > 45 else 0,
                "temperature": int(total_restless_count * 0.6) if avg_temp > 25 else 0,
                "light_lux": 0,
                "humidity": 0,
                "co2": 0,
                "pm25": 0
            }

            sorted_triggers = sorted(trigger_counts.items(), key=lambda x: x[1], reverse=True)
            top_sensor = sorted_triggers[0][0] if sorted_triggers[0][1] > 0 else "temperature"

            payload_events = {
                "calendarDate": calendar_date,
                "totalRestlessEvents": total_restless_count,
                "primarySensorTrigger": top_sensor,
                "sensorTriggerBreakdown": trigger_counts
            }

            requests.put(f"{DATABASE_URL}/personal_sensitivity/all_sensors_events/{calendar_date}.json", json=payload_events)

            print(f"✅ วันที่ {calendar_date} | Combined Score: {combined_sleep_score} (Garmin {garmin_sleep_score} + Room {room_env_score})")

    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    main()