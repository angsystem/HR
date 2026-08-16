# ANG HR Web Tablet Workspace RWD Audit — 2026-08-16

- Employee workspace still contains a legacy `@media(min-width:768px)` two-column rule.
- This can classify touch-first tablets as desktop after login even though the entry page now reserves Desktop Web for wide fine-pointer devices.
- Shared fix: keep `.desktop-grid` / `.desktop-grid-2` stacked on tablet/touch-first devices, and only enable the two-column workspace at >=1100px with hover/fine pointer.
- No authentication, permission, data, or Flutter behavior is changed.
