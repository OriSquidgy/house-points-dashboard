python appV2.py
git add data.js
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do (set datestr=%%a-%%b-%%c)
git commit -m "Update data %datestr%"
git push
