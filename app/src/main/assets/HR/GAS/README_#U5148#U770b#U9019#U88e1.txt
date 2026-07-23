ANG HR｜平台人員中心＋方案更新包
版本日期：2026-07-22

【這次已完成】
1. 新增平台永久 PersonID（格式：ANGP-00000001）。
2. 新增「平台人員」「登入身分」「公司隸屬」「方案目錄」「方案訂閱」「裝置綁定」「流水號」。
3. 同一個人可以隸屬多間公司，但只會有一個 PersonID。
4. 所有公司代號都會強制以 ANG 開頭。
5. 每間公司的建立者固定：
   - 公司員編：0603
   - 登入員編：ANG0603
6. 平台最高管理 ANG8963 保留，只屬於平台，不會寫進各公司的 0603。
7. 一般員工自動編號會跳過 0603，避免撞到公司建立者。
8. 建立公司及新增員工時，會同步寫入公司隸屬。
9. Google／LINE／Email 驗證成功後，會建立或找到同一個 PersonID。
10. 建立公司時會建立該公司的 Business 方案訂閱。

【方案目錄】
- personal_lite
- personal_solo
- personal_performance
- business_lite
- business_basic
- business_pro
- business_premium

舊代碼相容：
- basic → business_basic
- plus / pro → business_pro
- premium → business_premium
- free / lite → business_lite（公司流程）

【這次沒有做】
- 不建立自訂員工編號模組。
- 不建立任何模組購買、授權或到期邏輯。
- Performance Lifetime 尚未加入方案目錄。
- 不會自動清除你目前的假資料。

【要覆蓋／新增的檔案】
覆蓋：
- 程式碼.js
- SheetSetup.js
- Company.js
- Auth.js
- CreatorPlatform.js

新增：
- PeopleCenter.js

本包也附上目前既有的：
- V060_Backend.js
- Code_gs_deep_link_auth_patch.js
- SetupProperties_deep_link.js
- appsscript.json
- .clasp.json

【部署步驟】
1. 先備份目前 Apps Script 專案。
2. 將本包檔案放進原本 clasp 專案資料夾，同名檔案選擇覆蓋。
3. PowerShell 在該資料夾執行：

   npx @google/clasp push

4. 到 Apps Script 編輯器，手動執行一次：

   initANGHRPeoplePlans

5. 執行完成後，總表應新增：
   平台人員、登入身分、公司隸屬、方案目錄、方案訂閱、裝置綁定、流水號。
6. 部署 → 管理部署作業 → 編輯 → 版本選「新版本」→ 部署。
7. 只儲存程式碼不會更新線上的 /exec。

【測試重點】
A. 建立第一間公司：公司代號應為 ANG 開頭，建立者為 ANG0603。
B. 建立第二間公司：建立者也應為 ANG0603，但兩者以公司代號區分，不衝突。
C. 新增一般員工：自動編號不可產生 ANG0603。
D. 用同一個 Email 加入第二間公司：平台人員表仍是同一個 PersonID，公司隸屬增加一筆。
E. Business Lite：付款狀態為 free，沒有首月試用到期日。
F. Business Basic／Pro／Premium：建立方案訂閱並保留開始日、到期日與來源。

【重要】
Apps Script 內檔名請維持乾淨名稱，不要建立「程式碼(31).js」「Auth(3).js」這類上傳後綴名稱。
