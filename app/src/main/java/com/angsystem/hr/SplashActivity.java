package com.angsystem.hr;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

/**
 * SplashActivity handles the initial app loading screen and transitions
 * when the appearance mode (day/night) is changed.
 */
public class SplashActivity extends Activity {

    public static final String EXTRA_FORCE_TRANSITION = "extra_force_transition";
    public static final String EXTRA_TARGET_MODE = "extra_target_mode";
    public static final String EXTRA_TRANSITION_VIDEO = "extra_transition_video";
    public static final String EXTRA_SOURCE = "extra_source";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Theme.ANGHR uses @drawable/splash_screen as windowBackground,
        // so we don't necessarily need a layout file here.

        boolean forceTransition = getIntent().getBooleanExtra(EXTRA_FORCE_TRANSITION, false);
        
        if (forceTransition) {
            // If triggered by a theme change, show the splash briefly for a smooth transition.
            new Handler(Looper.getMainLooper()).postDelayed(this::startMainActivity, 800);
        } else {
            // Regular startup, proceed to MainActivity immediately.
            startMainActivity();
        }
    }

    private void startMainActivity() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION);
        startActivity(intent);
        finish();
        overridePendingTransition(0, 0);
    }
}
