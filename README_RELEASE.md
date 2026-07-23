# ANG HR Android v0.6.0 — clean project

- Package: `com.angsystem.hr`
- Version name: `0.6.0`
- Version code: `60`
- Entry: `file:///android_asset/HR/index.html`
- Minimum Android: 7.0 (API 24)
- Target/compile SDK: 35

## Included fixes

1. Synced the newest root `index.html`, hashed assets, `config.js`, `ang-frontend-api.js`, and manager welcome files into `app/src/main/assets/HR`.
2. Fixed the native-ready payload to call `getAngDeviceId()` after the earlier method rename.
3. Debug builds now use `com.angsystem.hr.debug`, preventing accidental replacement of the formal package.
4. Release builds explicitly disable debugging and support a private signing configuration.
5. Removed machine-specific caches, build output, `.idea`, `.gradle`, and `local.properties`.

## Build a signed release in Android Studio

1. Put the release keystore in the project root.
2. Copy `keystore.properties.example` to `keystore.properties` and fill in the real values.
3. Open the project in Android Studio and let Gradle sync.
4. Choose **Build → Generate Signed App Bundle or APK → APK → release**.

Keep the keystore and passwords private. Losing them means future APKs cannot update the installed formal app.
