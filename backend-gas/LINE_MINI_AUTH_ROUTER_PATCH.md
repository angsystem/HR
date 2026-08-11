# ANG HR｜LINE MINI App 後端路由補丁

這個 repo 的前端已呼叫兩個 GAS action：

- `getEmployeeCompaniesByVerifiedAuth`
- `employeeLoginByVerifiedAuth`

`backend-gas/line-mini-verified-employee-login.gs` 已提供 `apiEmployeeLoginByVerifiedAuth_()`。

## 現行 V35 `handleApi_` 必須保留的路由

在最新 `handleApi_(action, payload, callback)` 的 `switch (action)` 中，`adminLoginByVerifiedAuth` 後加入：

```javascript
case 'employeeLoginByVerifiedAuth':
case 'loginEmployeeByVerifiedAuth':
  result = apiEmployeeLoginByVerifiedAuth_(payload);
  break;
case 'getEmployeeCompaniesByVerifiedAuth':
  result = apiGetEmployeeCompaniesByVerifiedAuth_(payload);
  break;
```

目前舊版 Code.gs 前面的 router 曾有 `getEmployeeCompaniesByVerifiedAuth`，但最新 V35 `handleApi_` 版本沒有，因此必須在**最後一個／目前實際生效的 `handleApi_`** 補回，不能只改前面的舊 router。

## Fast login actions

LINE MINI App 登入不需要每次重跑 `initializeSystem_()`；在 `fastLoginActionsV35` 加入：

```javascript
verifyNativeLineIdToken: true,
getEmployeeCompaniesByVerifiedAuth: true,
employeeLoginByVerifiedAuth: true,
loginEmployeeByVerifiedAuth: true
```

## 正確登入鏈

1. LIFF `getIDToken()`
2. `verifyNativeLineIdToken` → 僅取得 `verify_token`
3. `getEmployeeCompaniesByVerifiedAuth` → 找已綁定公司／員工
4. `employeeLoginByVerifiedAuth` → 比對 LINE `line_sub`、帳號狀態、首次開通、裝置綁定
5. `createSessionForEmployee_()` → 產生正式 `session_token`
6. 前端才進 `employee.html` / `admin.html`

**禁止直接把 `verify_token` 當成 `session_token`。**

## 發布後最小驗證

未帶參數呼叫：

`?action=employeeLoginByVerifiedAuth&payload={}`

應回傳「缺少公司代碼」，而不是「未知 action」。

未帶 verify token 呼叫：

`?action=employeeLoginByVerifiedAuth&payload={"company_id":"...","employee_id":"...","device_id":"..."}`

應回傳「缺少第三方驗證 token」。

正式 LINE 測試則應在成功後取得新的 `session_token`，並由該 token 通過 `angGetPermissionSnapshot` / `verifyEmployeeSession`。
