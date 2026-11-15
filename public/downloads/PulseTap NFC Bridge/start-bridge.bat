@echo off
title PulseTap NFC Manufacturing Bridge
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 bridge.py
) else (
  python bridge.py
)
if errorlevel 1 (
  echo.
  echo The bridge could not start. Check README.txt and confirm Python 3 is installed.
  pause
)
