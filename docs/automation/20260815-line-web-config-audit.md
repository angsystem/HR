ANG HR Web／Mobile Web automation audit

Finding: config.js still pointed the shared Web runtime at an older published LIFF ID and omitted the email scope, while index.html loaded web-login-config.js that overrode those values only on the login entry page. This created a configuration split between the entry page and other Web pages opened inside LINE/LIFF.

Fix: align the shared config.js published LIFF ID with 2010402308-aEXeFYXe, add email to lineMiniAppScopes, and bump the shared Web build version. No authentication bypass, permission change, data-path change, or Flutter change was made.
