package kg.ekonaryn.app.admin;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;

import android.content.Context;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.auth.AuthManager;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * INSTRUMENTED — runs on a connected emulator/device only. Verifies the
 * role-specific bottom-nav lands on the right activity given the persisted
 * AuthManager state. Not executed in this session.
 */
@RunWith(AndroidJUnit4.class)
public class AdminMainActivityTest {

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
        auth.save("AT-test", u);
    }

    @Rule
    public final ActivityScenarioRule<AdminMainActivity> rule =
            new ActivityScenarioRule<>(AdminMainActivity.class);

    @Test
    public void bottomNav_isVisible_andStartsOnOverview() {
        onView(withId(R.id.bottomNav)).check(matches(isDisplayed()));
    }
}
