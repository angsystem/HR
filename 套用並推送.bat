@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo [ANG HR] 檢查 Git 儲存庫...
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  echo 請先把本包內全部檔案複製到 angsystem/HR 儲存庫根目錄，再執行本檔。
  pause
  exit /b 1
)

echo [ANG HR] 加入 Index 卡片規則修正...
git add index.html sw.js index-card-rules.js index-card-rules.css
if errorlevel 1 goto :error

git commit -m "feat(index): finalize card gestures and plan signup flow"
if errorlevel 1 (
  echo 沒有新的變更可提交，或提交失敗。
)

git push origin main
if errorlevel 1 goto :error

echo.
echo 完成：已推送到 main。
pause
exit /b 0

:error
echo.
echo 執行失敗，請查看上方 Git 訊息。
pause
exit /b 1
