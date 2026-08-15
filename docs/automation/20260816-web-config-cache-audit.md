ANG HR Web／Mobile Web automation audit

Finding: config.js was updated to the unified LINE Web/LIFF configuration, but several live HTML entry points still referenced config.js with old cache-busting query strings. Browsers or WebViews could therefore continue using the pre-fix shared configuration after deployment.

Fix: update the config.js cache key on index.html, app.html, organization.html, and facebook-callback.html. No authentication, permission, data-path, Flutter, or layout logic was changed.
