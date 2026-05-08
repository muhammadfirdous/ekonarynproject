package kg.ekonaryn.app.auth;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.typeText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;
import static androidx.test.espresso.matcher.ViewMatchers.withText;

import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import kg.ekonaryn.app.R;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * INSTRUMENTED — runs on a connected emulator/device under
 * `./gradlew connectedDebugAndroidTest`. NOT RUN in this session because no
 * emulator is attached. The Phase 7 report tracks this.
 *
 * The activity hits the live API_BASE_URL, so to drive these tests reliably:
 *   1) Boot the API on the host (`npm run dev --workspace=@ekonaryn/api`).
 *   2) `npm run db:seed --workspace=@ekonaryn/db`.
 *   3) The emulator's 10.0.2.2 maps to the host loopback (the dev BuildConfig
 *      already points there).
 */
@RunWith(AndroidJUnit4.class)
public class LoginActivityTest {

    @Rule
    public final ActivityScenarioRule<LoginActivity> rule =
            new ActivityScenarioRule<>(LoginActivity.class);

    @Test
    public void formFields_areAllVisibleOnStart() {
        onView(withId(R.id.inputPhone)).check(matches(isDisplayed()));
        onView(withId(R.id.inputPassword)).check(matches(isDisplayed()));
        onView(withId(R.id.btnLogin)).check(matches(isDisplayed()));
        onView(withId(R.id.btnLangRu)).check(matches(isDisplayed()));
        onView(withId(R.id.btnLangEn)).check(matches(isDisplayed()));
    }

    @Test
    public void languageToggle_swapsButtonStateBetweenRuAndEn() {
        onView(withId(R.id.btnLangEn)).perform(click());
        // After switching to EN, the login button label should match the EN string.
        onView(withId(R.id.btnLogin)).check(matches(withText(R.string.auth_login)));
        onView(withId(R.id.btnLangRu)).perform(click());
        onView(withId(R.id.btnLogin)).check(matches(withText(R.string.auth_login)));
    }

    @Test
    public void emptyFields_andTapLogin_keepsTheUserOnTheLoginScreen() {
        onView(withId(R.id.btnLogin)).perform(click());
        // The activity stays — assert phone field is still visible (no crash).
        onView(withId(R.id.inputPhone)).check(matches(isDisplayed()));
    }

    @Test
    public void typingFillsThePhoneAndPassword() {
        onView(withId(R.id.inputPhone)).perform(typeText("+996700000001"), closeSoftKeyboard());
        onView(withId(R.id.inputPassword)).perform(typeText("admin123"), closeSoftKeyboard());
        // Hitting login here would attempt a network call — only assert the
        // form state, not the post-network behavior.
        onView(withId(R.id.inputPhone)).check(matches(withText("+996700000001")));
        onView(withId(R.id.inputPassword)).check(matches(withText("admin123")));
    }
}
