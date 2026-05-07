package kg.ekonaryn.app;

import android.app.Application;
import android.content.Context;

import kg.ekonaryn.app.auth.AuthManager;

public class EkoApp extends Application {

    private static EkoApp instance;
    private AuthManager authManager;

    @Override
    public void onCreate() {
        super.onCreate();
        instance = this;
        authManager = new AuthManager(this);
        LocaleHelper.applyStoredLocale(this);
    }

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(LocaleHelper.wrap(base));
    }

    public static EkoApp get() {
        return instance;
    }

    public AuthManager auth() {
        return authManager;
    }
}
