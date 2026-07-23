@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo =========================
echo    GAS CLASP PUSH
echo =========================
echo.

call clasp push
if errorlevel 1 (
  echo.
  echo ❌ clasp push 失敗
  pause
  exit /b 1
)

call clasp deploy -i AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH
if errorlevel 1 (
  echo.
  echo ❌ clasp deploy 失敗
  pause
  exit /b 1
)

echo.
echo ✅ 完成！已 push 並 deploy
pause