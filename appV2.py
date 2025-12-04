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
category = [event["Category"] for event in events]
gender = [event["Girls/Boys"] for event in events]
houses = [event["House"] for event in events]
points = [event["Points"] for event in events]
places = [event["Place"] for event in events]
ev_type = [event["Type"] for event in events]
event_data = {
    "dates": dates,
    "events": names,
    "category": category,
    "gender": gender,
    "houses": houses,
    "points": points,
    "places": places,
    "types": ev_type
}
with open("events.js", "w", encoding="utf-8") as file:
    file.write("window.EVENTS = ")
    json.dump(event_data, file, indent=4)
    file.write(";\n")

joy_info = [[] for _ in range(6)]

hope_info = [[] for _ in range(6)]

faith_info = [[] for _ in range(6)]

peace_info = [[] for _ in range(6)]

counter = 0
info = [[[] for _ in range(7)] for h in range(4)]
for house in houses:
    h = house.upper()
    match h:
        case "JOY": idx = 0
        case "HOPE": idx = 1
        case "FAITH": idx = 2
        case "PEACE": idx = 3

    house_info = info[idx]
    house_info[0].append(dates[counter])
    house_info[1].append(names[counter])
    house_info[2].append(category[counter])
    house_info[3].append(gender[counter])
    house_info[4].append(points[counter])
    house_info[5].append(places[counter])
    house_info[6].append(ev_type[counter])
    counter += 1

joy_data = {
    "dates": info[0][0],
    "events": info[0][1],
    "category": info[0][2],
    "gender": info[0][3],
    "points": info[0][4],
    "places": info[0][5],
    "types": info[0][6]
}

hope_data = {
    "dates": info[1][0],
    "events": info[1][1],
    "category": info[1][2],
    "gender": info[1][3],
    "points": info[1][4],
    "places": info[1][5],
    "types": info[1][6]
}

faith_data = {
    "dates": info[2][0],
    "events": info[2][1],
    "category": info[2][2],
    "gender": info[2][3],
    "points": info[2][4],
    "places": info[2][5],
    "types": info[2][6]
}

peace_data = {
    "dates": info[3][0],
    "events": info[3][1],
    "category": info[3][2],
    "gender": info[3][3],
    "points": info[3][4],
    "places": info[3][5],
    "types": info[3][6]
}

with open("joy.js", "w", encoding="utf-8") as file:
    file.write("window.EVENTS =")
    json.dump(joy_data, file, indent=4)
    file.write(";\n")

with open("hope.js", "w", encoding="utf-8") as file:
    file.write("window.EVENTS =")
    json.dump(hope_data, file, indent=4)
    file.write(";\n")

with open("faith.js", "w", encoding="utf-8") as file:
    file.write("window.EVENTS =")
    json.dump(faith_data, file, indent=4)
    file.write(";\n")

with open("peace.js", "w", encoding="utf-8") as file:
    file.write("window.EVENTS =")
    json.dump(peace_data, file, indent=4)
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
