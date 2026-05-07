package kg.ekonaryn.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.os.Build;

import java.util.Locale;

/**
 * Lightweight wrapper for runtime language switching backed by SharedPreferences.
 * Prefer overriding the activity context configuration over the deprecated
 * Resources.updateConfiguration on API 25+.
 */
public final class LocaleHelper {

    private static final String PREFS = "eko_locale_prefs";
    private static final String KEY_LANG = "lang";
    private static final String DEFAULT_LANG = "ru";

    private LocaleHelper() {}

    public static String getStoredLang(Context ctx) {
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        return prefs.getString(KEY_LANG, DEFAULT_LANG);
    }

    public static void setStoredLang(Context ctx, String lang) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_LANG, lang)
                .apply();
    }

    public static Context wrap(Context ctx) {
        return updateResources(ctx, getStoredLang(ctx));
    }

    public static void applyStoredLocale(Context ctx) {
        updateResources(ctx, getStoredLang(ctx));
    }

    @SuppressWarnings("deprecation")
    public static Context updateResources(Context ctx, String lang) {
        Locale locale = new Locale(lang);
        Locale.setDefault(locale);

        Resources res = ctx.getResources();
        Configuration cfg = new Configuration(res.getConfiguration());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            cfg.setLocale(locale);
            return ctx.createConfigurationContext(cfg);
        }
        cfg.locale = locale;
        res.updateConfiguration(cfg, res.getDisplayMetrics());
        return ctx;
    }
}
