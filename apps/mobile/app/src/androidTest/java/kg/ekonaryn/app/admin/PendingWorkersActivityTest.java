package kg.ekonaryn.app.admin;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;

import android.content.Context;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.auth.AuthManager;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * INSTRUMENTED — runs on a connected emulator/device only. Drives the admin's
 * approve/reject flow against the live API. Requires a seeded backend with a
 * PENDING_APPROVAL worker (e.g. the seed phone +996700000005). Not executed
 * in this session.
 */
@RunWith(AndroidJUnit4.class)
public class PendingWorkersActivityTest {

    @Before
    public void seedAdminAuth() {
        Context ctx = ApplicationProvider.getApplicationContext();
        AuthManager auth = new AuthManager(ctx);
        User u = new User();
        u.id = "admin-1";
        u.name = "Admin";
        u.role = "ADMIN";
        u.phone = "+996700000001";
        u.accountStatus = "ACTIVE";
        // The token is dummy at this layer — to actually round-trip approve/reject
        // against the live API, swap in a real token obtained via /auth/login.
        auth.save("AT-test", u);
    }

    @Rule
    public final ActivityScenarioRule<PendingWorkersActivity> rule =
            new ActivityScenarioRule<>(PendingWorkersActivity.class);

    @Test
    public void activity_launches_andRendersTopLevelLayout() {
        // Without a valid token + live API, the list won't populate; we just
        // assert the activity hosts its root view without crashing.
        onView(androidx.test.espresso.matcher.ViewMatchers.withId(android.R.id.content))
                .check(matches(isDisplayed()));
    }
}
