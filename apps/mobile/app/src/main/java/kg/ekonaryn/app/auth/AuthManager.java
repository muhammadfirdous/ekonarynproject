package kg.ekonaryn.app.auth;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.google.gson.Gson;

import kg.ekonaryn.app.api.models.User;

public class AuthManager {

    private static final String TAG = "AuthManager";
    private static final String FILE = "eko_secure_prefs";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_USER = "user_json";

    private final SharedPreferences prefs;
    private final Gson gson = new Gson();

    public AuthManager(Context ctx) {
        SharedPreferences p;
        try {
            MasterKey master = new MasterKey.Builder(ctx)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            p = EncryptedSharedPreferences.create(
                    ctx,
                    FILE,
                    master,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception e) {
            // Fall back to plain prefs only if EncryptedSharedPreferences blows up
            // (e.g. device with broken keystore). This keeps the app usable.
            Log.w(TAG, "EncryptedSharedPreferences unavailable, falling back to plain prefs", e);
            p = ctx.getSharedPreferences(FILE + "_plain", Context.MODE_PRIVATE);
        }
        prefs = p;
    }

    public synchronized void save(String token, User user) {
        prefs.edit()
                .putString(KEY_TOKEN, token)
                .putString(KEY_USER, gson.toJson(user))
                .apply();
    }

    public synchronized String getToken() {
        return prefs.getString(KEY_TOKEN, null);
    }

    public synchronized User getUser() {
        String json = prefs.getString(KEY_USER, null);
        if (json == null) return null;
        try {
            return gson.fromJson(json, User.class);
        } catch (Exception e) {
            return null;
        }
    }

    public synchronized void clear() {
        prefs.edit().remove(KEY_TOKEN).remove(KEY_USER).apply();
    }

    public boolean isLoggedIn() {
        return getToken() != null;
    }
}
