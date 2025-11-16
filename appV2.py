import gspread
import json

# Connect to Google Sheets
scope = ["https://spreadsheets.google.com/feeds",
         "https://www.googleapis.com/auth/drive"]
client = gspread.service_account(filename="service_account_key.json")

SHEET = client.open("House Dashboard Test Data")
houses_sheet = SHEET.worksheet("Houses")
events_sheet = SHEET.worksheet("Events")


rows = houses_sheet.get_all_records()
houses = [row["House"] for row in rows]
totalPoints = [row["Points"] for row in rows]
links = {row["House"]: row.get("Link", "#") for row in rows}
lostPoints = [row["Lost"] for row in rows]
data = {
    "houses": houses,
    "totalPoints": totalPoints,
    "lostPoints": lostPoints,
    "links": links
}

with open("data.js", "w", encoding="utf-8") as file:
    file.write("window.DATA = ")
    json.dump(data, file, indent=4)
    file.write(";\n")


events = events_sheet.get_all_records()
dates = [event["Date"] for event in events]
names = [event["Event"] for event in events]
houses = [event["House"] for event in events]
points = [event["Points"] for event in events]
event_data = {
    "dates": dates,
    "events": names,
    "houses": houses,
    "points": points
}
with open("events.js", "w", encoding="utf-8") as file:
    file.write("window.EVENTS = ")
    json.dump(event_data, file, indent=4)
    file.write(";\n")

"""
@app.get("/api/points/flag")
def house_points_flag():
    rows = houses_sheet.get_all_records()
    houses = []
    for row in rows:
        houses.append({
            "house": row["House"],
            "points": int(row["Points"]),
            "lost": int(row["Lost"]),
            "total": int(row["Points"]) + int(row["Lost"]),
            "color": row.get("Color", "gray"),
            "link": row.get("Link", "#")
        })
    return jsonify(houses)
    
if __name__ == "__main__":
    app.run(debug=True)

"""
