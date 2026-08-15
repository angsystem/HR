# ANG HR Web Service Worker cache audit — 2026-08-16

## Finding
The shared Web configuration was updated and cache-busted in HTML, but `sw.js` and the registration URL in `index.html` were still versioned as the 2026-08-11 LINE Mini App build. This could leave old shell/runtime caches installed longer than intended after the newer LINE Web configuration rollout.

## Action
- Bump Service Worker cache version to `20260816-unified-web-config-v1`.
- Update the `index.html` Service Worker registration query to the same version so browsers detect the new worker immediately.
- Do not change authentication, permissions, data flow, Desktop/Mobile breakpoints, or Flutter code.

## Result
Existing `ang-hr-*` caches from older versions will be removed during Service Worker activation, while current shell assets are re-cached under the new version.
