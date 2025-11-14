@echo off
:: Update data.js
python appV2.py
:: Prepares commit
git add data.js
:: Get date for commit 
for /f "tokens=2-3 delims=/ " %%a in ("%date%") do (set datestr=%%a/%%b)
:: Commit + push data.js
git commit -m "Update data %datestr%"
git push
