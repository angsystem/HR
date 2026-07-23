ANG HR Android v0.6.0 正式基準專案

套件名稱：com.angsystem.hr
版本：0.6.0 (versionCode 60)
最低 Android：7.0 (API 24)
目標 Android：API 35

內建模組：
- WebView／localStorage／GAS 網路存取
- 日光／暗夜模式
- 標準／Lite 輕量模式
- Android NFC 前景掃描（事件 ANG_HR_NFC_SCAN）
- Android QR 相機掃描（ZXing，事件 ANG_HR_QR_SCAN）
- GPS 定位（事件 ANG_HR_LOCATION）
- 相機與檔案選擇
- Android 通知
- Google／LINE 外部瀏覽器驗證與 anghr://auth 深層連結
- device_id：Android Secure ID
- 網路型態偵測
- 預設入口 index.html（ANG HR 正式入口；不再繞至 index_connected.html）

建置：
1. 使用 Android Studio 開啟此資料夾。
2. 等待 Gradle Sync 完成（會下載 ZXing QR 掃描依賴）。
3. Build > Build APK(s)。
4. Debug APK：app/build/outputs/apk/debug/app-debug.apk

正式簽章 APK/AAB 必須在 Android Studio 建立自己的 keystore，不要公開 keystore。


2026-07-21 入口修正版：
- MainActivity 啟動位置固定為 file:///android_asset/www/index.html
- 未展開的 Free／Personal／Business 方案卡，點卡片本體會自動選取、置中並展開
- 點 Solo／Performance／Basic／Pro／Premium 選項仍會保留原本方案選擇行為
- 方案卡展開時改為完整向下延伸，由頁面捲動，不使用卡片內部捲動
