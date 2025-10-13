from flask import Flask, render_template, request, jsonify
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

app = Flask(__name__)

# Connect to Google Sheets
scope = ["https://spreadsheets.google.com/feeds",
         "https://www.googleapis.com/auth/drive"]
client = gspread.service_account(filename="house-points-dashboard-fd15008cbc63.json")

SHEET = client.open("House Dashboard Test Data")
houses_sheet = SHEET.worksheet("Houses")
events_sheet = SHEET.worksheet("Events")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/flag")
def flag():
    return render_template("index2.html")

@app.route("/points", methods=["GET"])
def get_points():
    data = houses_sheet.get_all_records()
    return jsonify({"houses": data})

@app.route("/events", methods=["GET"])
def get_events():
    data = events_sheet.get_all_records()
    return jsonify({"events": data})

@app.route("/add_event", methods=["POST"])
def add_event():
    payload = request.json
    event = payload["event"]
    house = payload["house"]
    points = int(payload["points"])
    notes = payload.get("notes", "")

    # Add to events sheet
    events_sheet.append_row([datetime.now().isoformat(), event, house, points, notes])

    # Update house points
    values = houses_sheet.get_all_records()
    for i, row in enumerate(values, start=2):  # row 2 is first house
        if row["House"] == house:
            new_total = int(row["Points"]) + points
            houses_sheet.update_cell(i, 2, new_total)  # col 2 = Points
            break

    return jsonify({"ok": True})

@app.get("/api/house-points")
def house_points():
    rows = houses_sheet.get_all_records()
    houses = [row["House"] for row in rows]
    totalPoints = [row["Points"] for row in rows]
    links = {row["House"]: row.get("Link", "#") for row in rows}
    lostPoints = [row["Lost"] for row in rows]
    return jsonify({
        "houses": houses,
        "totalPoints": totalPoints,
        "lostPoints": lostPoints,
        "links": links
    })

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
