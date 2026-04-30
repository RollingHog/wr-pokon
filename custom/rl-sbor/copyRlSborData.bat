@echo off
echo %CD%
:loop  
timeout -t 1 >nul
if EXIST "%UserProfile%\Downloads\data.json.js" (
  move /y "%UserProfile%\Downloads\data.json.js" "." || pause
  time /t
)
goto :loop