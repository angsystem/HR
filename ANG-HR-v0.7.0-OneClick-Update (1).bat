@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title ANG HR v0.7.0 一鍵更新

set "ROOT=%~dp0"
cd /d "%ROOT%"
set "VER=0.7.0"
set "VCODE=70"
set "WWW=%ROOT%app\src\main\assets\www"
set "TMP=%ROOT%_anghr_update_tmp"
set "BACKUP=%ROOT%_anghr_www_backup"
set "OUTAPK=%ROOT%ANG-HR-v0.7.0-debug.apk"

echo ==========================================
echo ANG HR v0.7.0 一鍵更新 App
echo ==========================================

if not exist "%ROOT%gradlew.bat" (
  echo [錯誤] 請把本 BAT 放在 Android 專案根目錄。
  pause
  exit /b 1
)

set "ZIP="
for %%F in ("%ROOT%ANG-HR-v0.7.0-App-WebAssets*.zip") do if exist "%%~fF" if not defined ZIP set "ZIP=%%~fF"
if not defined ZIP for %%F in ("%ROOT%*App-WebAssets*.zip") do if exist "%%~fF" if not defined ZIP set "ZIP=%%~fF"

if not defined ZIP (
  echo [錯誤] 找不到 App-WebAssets ZIP。
  echo 請把 ANG-HR-v0.7.0-App-WebAssets.zip 放在本 BAT 同一層。
  pause
  exit /b 1
)

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%I"

echo [1/6] 備份舊版 www...
if not exist "%BACKUP%" mkdir "%BACKUP%"
if exist "%WWW%" (
  set "BKP=%BACKUP%\www_!STAMP!"
  mkdir "!BKP!"
  robocopy "%WWW%" "!BKP!" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
)
if not exist "%WWW%" mkdir "%WWW%"

echo [2/6] 解壓更新包...
if exist "%TMP%" rmdir /s /q "%TMP%"
mkdir "%TMP%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%ZIP%' -DestinationPath '%TMP%' -Force"
if errorlevel 1 goto :error

for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "$x=Get-ChildItem -LiteralPath '%TMP%' -Recurse -File -Filter index.html ^| Where-Object {Test-Path (Join-Path $_.Directory.FullName 'manager-welcome.js')} ^| Sort-Object {$_.FullName.Length} ^| Select-Object -First 1; if(-not $x){$x=Get-ChildItem -LiteralPath '%TMP%' -Recurse -File -Filter index.html ^| Select-Object -First 1}; if($x){$x.Directory.FullName}"`) do set "SRC=%%S"

if not defined SRC (
  echo [錯誤] ZIP 裡找不到 index.html。
  goto :error
)

echo [3/6] 更新 app\src\main\assets\www...
robocopy "%SRC%" "%WWW%" /MIR /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
if errorlevel 8 goto :error
if not exist "%WWW%\index.html" goto :error

echo [4/6] 更新版本號...
if exist "%ROOT%app\build.gradle" (
  set "GF=%ROOT%app\build.gradle"
) else (
  set "GF=%ROOT%app\build.gradle.kts"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$p='%GF%';$t=Get-Content -LiteralPath $p -Raw;" ^
"$t=[regex]::Replace($t,'versionCode\s*=?\s*\d+','versionCode %VCODE%');" ^
"$t=[regex]::Replace($t,'versionName\s*=?\s*[\"''][^\"'']+[\"'']','versionName \"%VER%\"');" ^
"Set-Content -LiteralPath $p -Value $t -Encoding UTF8"

echo [5/6] 清理並編譯...
call "%ROOT%gradlew.bat" --stop >nul 2>&1
if exist "%ROOT%app\build" rmdir /s /q "%ROOT%app\build"
if exist "%ROOT%build" rmdir /s /q "%ROOT%build"

call "%ROOT%gradlew.bat" clean assembleDebug --no-configuration-cache
if errorlevel 1 goto :error

set "APK=%ROOT%app\build\outputs\apk\debug\app-debug.apk"
if not exist "%APK%" goto :error
copy /y "%APK%" "%OUTAPK%" >nul

echo [6/6] 嘗試安裝到手機...
where adb >nul 2>&1
if errorlevel 1 goto :done

set "COUNT=0"
for /f "skip=1 tokens=1,2" %%A in ('adb devices') do if "%%B"=="device" set /a COUNT+=1
if "!COUNT!"=="1" adb install -r "%OUTAPK%"

:done
if exist "%TMP%" rmdir /s /q "%TMP%"
echo.
echo ==========================================
echo 更新完成
echo APK：%OUTAPK%
echo 備份：%BACKUP%
echo ==========================================
pause
exit /b 0

:error
echo.
echo [失敗] 更新或編譯失敗。
echo 舊版備份仍在：%BACKUP%
echo 請把錯誤畫面截圖給我。
pause
exit /b 1
