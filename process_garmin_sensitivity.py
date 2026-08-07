import json
import requests
from datetime import datetime

# 🔗 URL ของ Firebase Realtime Database
DATABASE_URL = "https://room-envi-test-default-rtdb.asia-southeast1.firebasedatabase.app"

def convert_ms_to_datetime(ms):
    if not ms:
        return None
    return datetime.fromtimestamp(ms / 1000.0).strftime('%Y-%m-%d %H:%M:%S')

def main():
    try:
        # 1. โหลดข้อมูล JSON จากเพื่อน/นาฬิกา
        with open("garmin_friend_data.json", "r", encoding="utf-8") as f:
            records = json.load(f)

        # เรียงลำดับข้อมูลจากวันเก่าไปวันใหม่
        records.sort(key=lambda x: x.get("dailySleepDTO", {}).get("calendarDate", ""))

        print("🔄 ดึงข้อมูลเซ็นเซอร์จาก Firebase...")
        sensor_res = requests.get(f"{DATABASE_URL}/sensors.json")
        sensors_data = sensor_res.json() if sensor_res.status_code == 200 and sensor_res.json() else {}

        accumulated_history = []

        # 2. วนลูปสะสมข้อมูลทีละวัน
        for index, garmin_record in enumerate(records, start=1):
            daily_dto = garmin_record.get("dailySleepDTO", {})
            calendar_date = daily_dto.get("calendarDate")
            sleep_start_ms = daily_dto.get("sleepStartTimestampGMT")
            sleep_end_ms = daily_dto.get("sleepEndTimestampGMT")

            # Match ข้อมูลเซ็นเซอร์เฉพาะช่วงเวลานอนของวันนั้น
            matched_temp = []
            if isinstance(sensors_data, dict):
                for ts, sensor_val in sensors_data.items():
                    if isinstance(sensor_val, dict) and "timestamp_ms" in sensor_val:
                        s_ms = sensor_val["timestamp_ms"]
                        if sleep_start_ms <= s_ms <= sleep_end_ms:
                            if "temperature" in sensor_val:
                                matched_temp.append(sensor_val["temperature"])

            avg_temp = round(sum(matched_temp) / len(matched_temp), 2) if matched_temp else 25.0
            sleep_score = daily_dto.get("sleepScores", {}).get("overall", {}).get("value", 0)
            awake_count = daily_dto.get("awakeCount", 0)
            restless_count = garmin_record.get("restlessMomentsCount", 0)
            avg_stress = daily_dto.get("avgSleepStress", 0)

            # ดึงเวลา Stage การนอน (นาที)
            deep_mins = round(daily_dto.get("deepSleepSeconds", 0) / 60, 1)
            rem_mins = round(daily_dto.get("remSleepSeconds", 0) / 60, 1)
            light_mins = round(daily_dto.get("lightSleepSeconds", 0) / 60, 1)

            # คำนวณ Sensitivity ของวันนั้นๆ
            daily_sensitivity = round(((restless_count * 0.5) + (awake_count * 5) + (avg_stress * 0.3)) / (sleep_score / 100 if sleep_score > 0 else 1), 2)

            # บันทึกเข้าประวัติสะสม
            accumulated_history.append({
                "date": calendar_date,
                "sensitivity": daily_sensitivity,
                "avgTemp": avg_temp,
                "restless": restless_count
            })

            # 3. คำนวณค่าเฉลี่ยสะสมจนถึงวันปัจจุบัน (Cumulative Calculation)
            total_days = len(accumulated_history)
            cum_sensitivity = round(sum(item["sensitivity"] for item in accumulated_history) / total_days, 2)
            cum_avg_temp = round(sum(item["avgTemp"] for item in accumulated_history) / total_days, 2)

            primary_factor = "อุณหภูมิห้อง (High Temp Sensitivity)" if cum_avg_temp > 24 else "สภาวะความเครียด (Stress Sensitivity)"
            
            payload = {
                "evaluatedDate": calendar_date,
                "totalAccumulatedDays": total_days,
                "dailyMetrics": {
                    "sleepScore": sleep_score,
                    "restlessMoments": restless_count,
                    "todaySensitivity": daily_sensitivity,
                    "avgSleepStress": avg_stress,
                    "deepSleepMinutes": deep_mins,
                    "remSleepMinutes": rem_mins,
                    "lightSleepMinutes": light_mins
                },
                "cumulativeSummary": {
                    "overallSensitivityScore": cum_sensitivity,
                    "avgRoomTemp": cum_avg_temp,
                    "primarySensitivityFactor": primary_factor,
                    "statusMessage": f"วิเคราะห์จากข้อมูลสะสม {total_days} วัน: ร่างกายมีความไวต่อ{primary_factor}"
                }
            }

            # 4. ยิงข้อมูลขึ้น Firebase Node หลัก (summary)
            target_url = f"{DATABASE_URL}/personal_sensitivity/summary.json"
            requests.put(target_url, json=payload)

            # บันทึกประวัติแยกตามวันไว้ด้วย
            daily_target_url = f"{DATABASE_URL}/personal_sensitivity/history/{calendar_date}.json"
            requests.put(daily_target_url, json=payload)

            print(f"✅ วันที่ {calendar_date} (สะสม {total_days} วัน) -> สรุปความไวสะสม: {cum_sensitivity} | ตัวการหลัก: {primary_factor}")

    except FileNotFoundError:
        print("❌ ไม่พบไฟล์ garmin_friend_data.json")
    except Exception as e:
        print(f"❌ เกิดข้อผิดพลาด: {e}")

if __name__ == "__main__":
    main()