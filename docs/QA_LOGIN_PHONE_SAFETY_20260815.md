# ANG HR Web QA — Phone login safety (2026-08-15)

Observed in the formal Web entry after Web login v2:

- `web-login-entry-fix.js` exposes an Account/Email vs Phone mode.
- The main formal handler in `manager-welcome.js` still performs Email-link verification through `requestEmailCode`.
- `manager-welcome.js` also resolves the login input using selectors that do not include the temporary `aria-label="手機號碼"` state.

Impact: the Phone mode can appear available even though the formal verification path is not wired to a dedicated backend phone-login action. This risks a broken or misleading login path.

Minimal safety fix:

- Keep all existing Account/Email, Google, LINE and Apple behavior unchanged.
- Hide the Phone mode and its provider button only in Web via `web-login-safety-20260815.css`.
- Do not modify Flutter/App baseline, backend verification, account data, or HR modules.
- Phone login can be re-enabled once a real backend phone verification/login action is confirmed and connected end-to-end.
