package com.angsystem.hr;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.ClipData;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Build;
import android.provider.Settings;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.LinkedHashMap;
import java.util.Map;

import org.json.JSONObject;

public class MainActivity extends Activity {

    private static final int REQ_FILE_CHOOSER = 7001;
    private static final int REQ_PERMISSIONS = 7002;

    private static final String APPEARANCE_PREFS = "ang_hr_appearance";
    private static final String PREF_MODE = "appearance_mode";
    private static final String PREF_TRANSITION = "opening_transition";
    private static final String MODE_DAY = "day";
    private static final String MODE_NIGHT = "night";
    private static final String TRANSITION_NIGHT_TO_DAY = "night_to_day";
    private static final String TRANSITION_DAY_TO_NIGHT = "day_to_night";

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private String pendingOAuthUri = "";
    private boolean backupPageLoaded = false;

    private static final String PRIMARY_WEB_URL = "https://angsystem.github.io/HR/";
    private static final String BACKUP_ASSET_URL = "file:///android_asset/HR/index.html";

    /*
     * ANG HR App 入口規則：
     * 1. 一律優先載入正式 GitHub Pages。
     * 2. 只有主頁確定無法載入時，才切換至 APK 內建備援頁。
     * 3. extra_start_url 僅供明確測試或 Deep Link 使用。
     */
    private String getStartUrl() {
        try {
            Intent intent = getIntent();
            if (intent != null) {
                String extra = intent.getStringExtra("extra_start_url");
                if (extra != null && (extra.startsWith("http://") || extra.startsWith("https://") || extra.startsWith("file://"))) {
                    return extra.trim();
                }
            }
        } catch (Exception ignored) {}

        return PRIMARY_WEB_URL;
    }

    private String getOptionalStringResource(String name) {
        try {
            int id = getResources().getIdentifier(name, "string", getPackageName());
            if (id != 0) return getString(id);
        } catch (Exception ignored) {}
        return "";
    }

    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        setContentView(webView);

        setupWebView();
        requestRuntimePermissionsIfNeeded();

        Intent launchIntent = getIntent();
        Uri launchUri = launchIntent == null ? null : launchIntent.getData();
        handleIntent(launchIntent);

        // 一般啟動一律載入目前打包的最新入口，避免 restoreState 帶回舊頁面。
        // OAuth / Email 驗證 Deep Link 則由 handleIntent 保留指定頁面，不再被首頁覆蓋。
        if (launchUri == null) {
            webView.loadUrl(getStartUrl());
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        Uri uri = intent.getData();
        if (uri == null) return;

        String raw = uri.toString();
        if (raw.startsWith("anghr://oauth-success")) {
            Map<String, String> map = parseQuery(raw);
            String provider = map.containsKey("provider") ? map.get("provider") : "";
            if ("platform_creator_email".equals(provider)) {
                openPlatformCreatorFromDeepLink(map);
                return;
            }
            pendingOAuthUri = raw;
            dispatchOAuthToWeb(raw);
        } else if (raw.startsWith("http://") || raw.startsWith("https://")) {
            if (webView != null) webView.loadUrl(convertKnownGithubUrlToLocalAsset(raw));
        }
    }

    private void setupWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " ANG-HR-Android/0603 com.angsystem.hr");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        ANGNativeBridge nativeBridge = new ANGNativeBridge(this);
        webView.addJavascriptInterface(nativeBridge, "ANGNative");
        // 舊版首頁使用 ANGHRApp；同時保留兩個名稱，避免不同頁面找不到原生橋接。
        webView.addJavascriptInterface(nativeBridge, "ANGHRApp");
        webView.setWebViewClient(new ANGWebViewClient());
        webView.setWebChromeClient(new ANGChromeClient());
    }

    private class ANGWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request == null || request.getUrl() == null) return false;
            return handleUrl(view, request.getUrl().toString());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleUrl(view, url);
        }

        private boolean handleUrl(WebView view, String url) {
            if (url == null) return false;
            String lower = url.toLowerCase();

            if (lower.startsWith("anghr://oauth-success")) {
                Map<String, String> map = parseQuery(url);
                String provider = map.containsKey("provider") ? map.get("provider") : "";
                if ("platform_creator_email".equals(provider)) {
                    openPlatformCreatorFromDeepLink(map);
                    return true;
                }
                pendingOAuthUri = url;
                dispatchOAuthToWeb(url);
                return true;
            }

            /*
             * Google / LINE OAuth must never render inside WebView.
             * Intercept both the initial GAS request and every LINE auth URL.
             */
            if (isGoogleOAuthUrl(lower) || isLineOAuthUrl(lower) || isLineAuthStartRequest(lower)) {
                openExternal(url);
                return true;
            }

            if (lower.startsWith("mailto:") || lower.startsWith("tel:") || lower.startsWith("sms:")) {
                openExternal(url);
                return true;
            }

            if (!lower.startsWith("http://") && !lower.startsWith("https://") && !lower.startsWith("file://")) {
                openExternal(url);
                return true;
            }

            String local = convertKnownGithubUrlToLocalAsset(url);
            if (!local.equals(url)) {
                view.loadUrl(local);
                return true;
            }

            return false;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            injectNativeInfo();
            if (pendingOAuthUri != null && !pendingOAuthUri.isEmpty()) {
                dispatchOAuthToWeb(pendingOAuthUri);
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request != null && request.isForMainFrame()) {
                loadBackupPage(view);
            }
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            super.onReceivedError(view, errorCode, description, failingUrl);
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                loadBackupPage(view);
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            super.onReceivedHttpError(view, request, errorResponse);
            if (request != null && request.isForMainFrame() && errorResponse != null
                    && errorResponse.getStatusCode() >= 400) {
                loadBackupPage(view);
            }
        }

        private void loadBackupPage(WebView view) {
            if (view == null || backupPageLoaded) return;
            String current = view.getUrl() == null ? "" : view.getUrl();
            if (current.startsWith("file:///android_asset/")) return;
            backupPageLoaded = true;
            Toast.makeText(MainActivity.this, "網路頁面暫時無法使用，已切換離線備援", Toast.LENGTH_LONG).show();
            view.loadUrl(BACKUP_ASSET_URL);
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            if (handler != null) handler.cancel();
            Toast.makeText(MainActivity.this, "SSL 憑證錯誤，已停止載入", Toast.LENGTH_LONG).show();
        }
    }



    private String convertKnownGithubUrlToLocalAsset(String rawUrl) {
        if (rawUrl == null) return "";
        return rawUrl.trim();
    }

    private boolean isGoogleOAuthUrl(String lowerUrl) {
        return lowerUrl.contains("accounts.google.com")
                || lowerUrl.contains("oauth2.googleapis.com")
                || lowerUrl.contains("/o/oauth2/")
                || lowerUrl.contains("/gsi/")
                || lowerUrl.contains("googleusercontent.com");
    }

    private boolean isLineOAuthUrl(String lowerUrl) {
        if (lowerUrl == null) return false;
        return lowerUrl.startsWith("line://")
                || lowerUrl.contains("access.line.me/")
                || lowerUrl.contains("liff.line.me/")
                || lowerUrl.contains("api.line.me/oauth")
                || lowerUrl.contains("line.me/oauth");
    }

    private boolean isLineAuthStartRequest(String lowerUrl) {
        if (lowerUrl == null) return false;

        boolean isAngGasEndpoint =
                lowerUrl.contains("script.google.com/macros/s/")
                || lowerUrl.contains("script.googleusercontent.com/macros/");

        if (!isAngGasEndpoint) return false;

        return lowerUrl.contains("action=requestlineauth")
                || lowerUrl.contains("action%3drequestlineauth")
                || lowerUrl.contains("action%253drequestlineauth");
    }

    private class ANGChromeClient extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView webView,
                                         ValueCallback<Uri[]> filePathCallback,
                                         FileChooserParams fileChooserParams) {
            if (MainActivity.this.filePathCallback != null) {
                MainActivity.this.filePathCallback.onReceiveValue(null);
            }
            MainActivity.this.filePathCallback = filePathCallback;
            Intent intent;
            try {
                intent = fileChooserParams.createIntent();
            } catch (Exception e) {
                intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "video/*", "application/pdf"});
            }
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            try {
                startActivityForResult(Intent.createChooser(intent, "選擇上傳檔案"), REQ_FILE_CHOOSER);
            } catch (ActivityNotFoundException e) {
                MainActivity.this.filePathCallback = null;
                Toast.makeText(MainActivity.this, "找不到可選擇檔案的 App", Toast.LENGTH_LONG).show();
                return false;
            }
            return true;
        }

        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
            if (callback != null) callback.invoke(origin, true, false);
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        request.grant(request.getResources());
                    } catch (Exception ignored) {}
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE_CHOOSER) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                ClipData clipData = data.getClipData();
                if (clipData != null && clipData.getItemCount() > 0) {
                    results = new Uri[clipData.getItemCount()];
                    for (int i = 0; i < clipData.getItemCount(); i++) {
                        results[i] = clipData.getItemAt(i).getUri();
                    }
                } else if (data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    private void requestRuntimePermissionsIfNeeded() {
        if (android.os.Build.VERSION.SDK_INT < 23) return;
        String[] permissions = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.POST_NOTIFICATIONS
        };
        requestPermissions(permissions, REQ_PERMISSIONS);
    }

    private void openPlatformCreatorFromDeepLink(final Map<String, String> map) {
        if (webView == null || map == null) return;
        final String companyId = map.containsKey("company_id") && map.get("company_id") != null && !map.get("company_id").isEmpty() ? map.get("company_id") : "PLATFORM";
        final String employeeId = map.containsKey("employee_id") && map.get("employee_id") != null && !map.get("employee_id").isEmpty() ? map.get("employee_id") : (map.containsKey("id") ? map.get("id") : "ANG8963");
        final String role = map.containsKey("role") && map.get("role") != null && !map.get("role").isEmpty() ? map.get("role") : "Creator";
        final String token = map.containsKey("session_token") && map.get("session_token") != null && !map.get("session_token").isEmpty() ? map.get("session_token") : (map.containsKey("token") ? map.get("token") : "");
        final String url = "https://angsystem.github.io/HR/app.html"
                + "?view=employee"
                + "&company_id=" + Uri.encode(companyId)
                + "&id=" + Uri.encode(employeeId)
                + "&employee_id=" + Uri.encode(employeeId)
                + "&role=" + Uri.encode(role)
                + "&session_token=" + Uri.encode(token)
                + "&token=" + Uri.encode(token)
                + "&source=platform_creator_email_app_employee_bridge"
                + "&auto_admin=1"
                + "&_ts=" + System.currentTimeMillis();
        pendingOAuthUri = "";
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                webView.loadUrl(url);
            }
        });
    }

    private void openExternal(final String url) {
        if (url == null || url.trim().isEmpty()) return;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    Uri uri = Uri.parse(url.trim());
                    Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                    intent.addCategory(Intent.CATEGORY_BROWSABLE);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(
                            MainActivity.this,
                            "無法開啟外部驗證頁，請確認裝置有可用的瀏覽器",
                            Toast.LENGTH_LONG
                    ).show();
                }
            }
        });
    }

    private void injectNativeInfo() {
        if (webView == null) return;
        SharedPreferences prefs = getSharedPreferences(APPEARANCE_PREFS, MODE_PRIVATE);
        String mode = normalizeAppearanceMode(prefs.getString(PREF_MODE, MODE_DAY));
        String transition = normalizeTransitionName(prefs.getString(PREF_TRANSITION, ""), mode);

        String js = "(function(){"
                + "window.ANG_NATIVE_APP={platform:'android',packageName:'com.angsystem.hr',version:'0603',scheme:'anghr',appearanceMode:" + jsString(mode) + ",transitionVideo:" + jsString(transition) + "};"
                + "try{"
                + "localStorage.setItem('ang_native_app','android');"
                + "localStorage.setItem('ang_native_package','com.angsystem.hr');"
                + "localStorage.setItem('ang_native_appearance_mode'," + jsString(mode) + ");"
                + "localStorage.setItem('ang_native_transition_video'," + jsString(transition) + ");"
                + "}catch(e){}"
                + "})();";
        webView.evaluateJavascript(js, null);
    }

    private String normalizeAppearanceMode(String value) {
        String mode = value == null ? "" : value.trim().toLowerCase();
        if ("dark".equals(mode) || "night".equals(mode) || "暗夜".equals(mode)) return MODE_NIGHT;
        if ("light".equals(mode) || "day".equals(mode) || "日光".equals(mode)) return MODE_DAY;
        return MODE_DAY;
    }

    private String normalizeTransitionName(String requested, String targetMode) {
        String transition = requested == null ? "" : requested.trim().toLowerCase();
        if (TRANSITION_NIGHT_TO_DAY.equals(transition) || TRANSITION_DAY_TO_NIGHT.equals(transition)) {
            return transition;
        }
        return MODE_NIGHT.equals(normalizeAppearanceMode(targetMode))
                ? TRANSITION_DAY_TO_NIGHT
                : TRANSITION_NIGHT_TO_DAY;
    }

    private void applyAppearanceModeInternal(String requestedMode, boolean fullReplace, String requestedTransition) {
        final String targetMode = normalizeAppearanceMode(requestedMode);
        final String transition = normalizeTransitionName(requestedTransition, targetMode);

        getSharedPreferences(APPEARANCE_PREFS, MODE_PRIVATE)
                .edit()
                .putString(PREF_MODE, targetMode)
                .putString(PREF_TRANSITION, transition)
                .apply();

        switchLauncherAlias(targetMode);
        injectNativeInfo();

        if (fullReplace) {
            restartThroughSplash(targetMode, transition);
        }
    }

    private void switchLauncherAlias(String targetMode) {
        try {
            PackageManager pm = getPackageManager();
            ComponentName dayAlias = new ComponentName(this, getPackageName() + ".LauncherDay");
            ComponentName nightAlias = new ComponentName(this, getPackageName() + ".LauncherNight");
            boolean night = MODE_NIGHT.equals(normalizeAppearanceMode(targetMode));

            pm.setComponentEnabledSetting(
                    dayAlias,
                    night ? PackageManager.COMPONENT_ENABLED_STATE_DISABLED : PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                    PackageManager.DONT_KILL_APP
            );
            pm.setComponentEnabledSetting(
                    nightAlias,
                    night ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                    PackageManager.DONT_KILL_APP
            );
        } catch (Exception ignored) {}
    }

    private void restartThroughSplash(String targetMode, String transition) {
        Intent intent = new Intent(this, SplashActivity.class);
        intent.putExtra(SplashActivity.EXTRA_FORCE_TRANSITION, true);
        intent.putExtra(SplashActivity.EXTRA_TARGET_MODE, normalizeAppearanceMode(targetMode));
        intent.putExtra(SplashActivity.EXTRA_TRANSITION_VIDEO, normalizeTransitionName(transition, targetMode));
        intent.putExtra(SplashActivity.EXTRA_SOURCE, "appearance_full_replace");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        overridePendingTransition(0, 0);
        finishAffinity();
    }

    private void dispatchOAuthToWeb(String rawUri) {
        if (webView == null || rawUri == null || rawUri.trim().isEmpty()) return;
        Map<String, String> map = parseQuery(rawUri);
        String provider = map.containsKey("provider") ? map.get("provider") : "google";
        String code = map.containsKey("code") ? map.get("code") : "";
        String credential = map.containsKey("credential") ? map.get("credential") : "";
        String token = map.containsKey("token") ? map.get("token") : "";
        String state = map.containsKey("state") ? map.get("state") : "";
        String status = map.containsKey("status") ? map.get("status") : "success";
        String error = map.containsKey("error") ? map.get("error") : "";

        final String js = "(function(){"
                + "var detail={"
                + "provider:" + jsString(provider) + ","
                + "code:" + jsString(code) + ","
                + "credential:" + jsString(credential) + ","
                + "token:" + jsString(token) + ","
                + "state:" + jsString(state) + ","
                + "status:" + jsString(status) + ","
                + "error:" + jsString(error) + ","
                + "raw:" + jsString(rawUri) + "};"
                + "try{localStorage.setItem('ang_native_oauth_result',JSON.stringify(detail));}catch(e){}"
                + "try{window.dispatchEvent(new CustomEvent('ANG_NATIVE_OAUTH',{detail:detail}));}catch(e){}"
                + "try{if(typeof window.onNativeOAuthResult==='function')window.onNativeOAuthResult(detail);}catch(e){}"
                + "try{if(typeof window.handleNativeOAuthResult==='function')window.handleNativeOAuthResult(detail);}catch(e){}"
                + "})();";

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                webView.evaluateJavascript(js, null);
            }
        });
    }

    private Map<String, String> parseQuery(String rawUri) {
        Map<String, String> out = new LinkedHashMap<>();
        try {
            Uri uri = Uri.parse(rawUri);
            for (String name : uri.getQueryParameterNames()) {
                String val = uri.getQueryParameter(name);
                out.put(name, val == null ? "" : val);
            }
        } catch (Exception ignored) {}
        return out;
    }

    private String jsString(String value) {
        String s = value == null ? "" : value;
        s = s.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("</", "<\\/");
        return "'" + s + "'";
    }

    public class ANGNativeBridge {
        private final Context context;

        ANGNativeBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public String getPlatform() {
            return "android";
        }

        @JavascriptInterface
        public String getPackageNameValue() {
            return "com.angsystem.hr";
        }

        @JavascriptInterface
        public String getAppearanceMode() {
            SharedPreferences prefs = getSharedPreferences(APPEARANCE_PREFS, MODE_PRIVATE);
            return normalizeAppearanceMode(prefs.getString(PREF_MODE, MODE_DAY));
        }

        @JavascriptInterface
        public String getOpeningTransition() {
            SharedPreferences prefs = getSharedPreferences(APPEARANCE_PREFS, MODE_PRIVATE);
            String mode = normalizeAppearanceMode(prefs.getString(PREF_MODE, MODE_DAY));
            return normalizeTransitionName(prefs.getString(PREF_TRANSITION, ""), mode);
        }

        @JavascriptInterface
        public void applyAppearanceMode(final String mode, final boolean fullReplace) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    applyAppearanceModeInternal(mode, fullReplace, "");
                }
            });
        }

        @JavascriptInterface
        public void applyDayNightMode(final String payloadJson) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    String mode = MODE_DAY;
                    String transition = "";
                    boolean fullReplace = false;
                    try {
                        JSONObject payload = new JSONObject(payloadJson == null ? "{}" : payloadJson);
                        mode = payload.optString("mode", payload.optString("theme", MODE_DAY));
                        transition = payload.optString("transitionVideo", "");
                        fullReplace = payload.optBoolean("fullReplace", false);
                    } catch (Exception ignored) {}
                    applyAppearanceModeInternal(mode, fullReplace, transition);
                }
            });
        }

        @JavascriptInterface
        public void openExternal(String url) {
            MainActivity.this.openExternal(url);
        }

        @JavascriptInterface
        public void googleSignIn(String url) {
            MainActivity.this.openExternal(url);
        }

        @JavascriptInterface
        public void lineSignIn(String url) {
            MainActivity.this.openExternal(url);
        }

        @JavascriptInterface
        public void startLineLogin(String url) {
            MainActivity.this.openExternal(url);
        }

        @JavascriptInterface
        public void reload() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (webView != null) webView.reload();
                }
            });
        }

        @JavascriptInterface
        public void openAppSettings() {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void toast(final String message) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast.makeText(context, message == null ? "" : message, Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                    .setTitle("離開 ANG HR")
                    .setMessage("確定要關閉 App 嗎？")
                    .setPositiveButton("關閉", (dialog, which) -> finish())
                    .setNegativeButton("取消", null)
                    .show();
        }
    }

    @Override
    protected void onDestroy() {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
