package kg.ekonaryn.app.auth;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;

import androidx.test.core.app.ApplicationProvider;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import kg.ekonaryn.app.api.models.User;

/**
 * AuthManager exercise:
 *   - Round-trip token + user JSON (Gson).
 *   - clear() wipes both fields.
 *   - getUser() returns null when nothing was saved (no key).
 *   - getUser() returns null when the saved blob is malformed (Gson catch).
 *   - isLoggedIn() reflects token presence.
 *
 * Robolectric is used so the EncryptedSharedPreferences fallback in the
 * production constructor (catch-all → plain SharedPreferences) is exercised
 * against a real Android Context. We rely on the catch path because the
 * Robolectric SDK doesn't ship a working AndroidKeyStore.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33)
public class AuthManagerTest {

    private Context ctx;

    @Before
    public void setUp() {
        ctx = ApplicationProvider.getApplicationContext();
        // Wipe both possible backing files so each test runs fresh.
        ctx.getSharedPreferences("eko_secure_prefs", Context.MODE_PRIVATE).edit().clear().commit();
        ctx.getSharedPreferences("eko_secure_prefs_plain", Context.MODE_PRIVATE).edit().clear().commit();
    }

    private User sampleUser() {
        User u = new User();
        u.id = "u-1";
        u.name = "Test Resident";
        u.phone = "+996700000010";
        u.role = "RESIDENT";
        u.points = 42;
        return u;
    }

    @Test
    public void freshInstance_isNotLoggedIn() {
        AuthManager auth = new AuthManager(ctx);
        assertFalse(auth.isLoggedIn());
        assertNull(auth.getToken());
        assertNull(auth.getUser());
    }

    @Test
    public void save_thenGetToken_andGetUser_roundTrip() {
        AuthManager auth = new AuthManager(ctx);
        User u = sampleUser();
        auth.save("AT-token-123", u);

        assertTrue(auth.isLoggedIn());
        assertEquals("AT-token-123", auth.getToken());
        User loaded = auth.getUser();
        assertNotNull(loaded);
        assertEquals(u.id, loaded.id);
        assertEquals(u.name, loaded.name);
        assertEquals(u.phone, loaded.phone);
        assertEquals(u.role, loaded.role);
        assertEquals(u.points, loaded.points);
    }

    @Test
    public void clear_wipesTokenAndUser() {
        AuthManager auth = new AuthManager(ctx);
        auth.save("AT", sampleUser());
        auth.clear();

        assertFalse(auth.isLoggedIn());
        assertNull(auth.getToken());
        assertNull(auth.getUser());
    }

    @Test
    public void getUser_returnsNull_whenStoredJsonIsCorrupt() {
        // Write garbage directly to the same backing file the AuthManager uses
        // after the EncryptedSharedPreferences fallback catches.
        ctx.getSharedPreferences("eko_secure_prefs_plain", Context.MODE_PRIVATE)
                .edit()
                .putString("user_json", "this is not json {{{")
                .putString("token", "AT")
                .commit();

        AuthManager auth = new AuthManager(ctx);
        // Token comes back fine; getUser swallows the JsonSyntaxException → null.
        assertEquals("AT", auth.getToken());
        assertNull(auth.getUser());
    }

    @Test
    public void multipleInstances_seeTheSamePersistedState() {
        new AuthManager(ctx).save("AT-shared", sampleUser());

        AuthManager other = new AuthManager(ctx);
        assertEquals("AT-shared", other.getToken());
        assertNotNull(other.getUser());
    }
}
