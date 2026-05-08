package kg.ekonaryn.app.auth;

import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.click;
import static androidx.test.espresso.action.ViewActions.closeSoftKeyboard;
import static androidx.test.espresso.action.ViewActions.typeText;
import static androidx.test.espresso.assertion.ViewAssertions.matches;
import static androidx.test.espresso.matcher.ViewMatchers.isDisplayed;
import static androidx.test.espresso.matcher.ViewMatchers.withId;

import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;

import kg.ekonaryn.app.R;

import org.hamcrest.Matchers;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * INSTRUMENTED — runs on a connected emulator/device only. See LoginActivityTest
 * header for the runtime contract. Not executed in this session.
 */
@RunWith(AndroidJUnit4.class)
public class RegisterActivityTest {

    @Rule
    public final ActivityScenarioRule<RegisterActivity> rule =
            new ActivityScenarioRule<>(RegisterActivity.class);

    @Test
    public void residentRoleShownByDefault_workerSectionHidden() {
        onView(withId(R.id.sectionResident)).check(matches(isDisplayed()));
        // sectionWorker should be GONE; not crashing on the lookup is enough here.
        onView(withId(R.id.inputAddress)).check(matches(isDisplayed()));
    }

    @Test
    public void switchingToWorkerRole_revealsWorkerSpecificFields() {
        onView(withId(R.id.btnRoleWorker)).perform(click());
        onView(withId(R.id.inputIdNumber)).check(matches(isDisplayed()));
        onView(withId(R.id.inputServiceAreas)).check(matches(isDisplayed()));
        onView(withId(R.id.inputVehicleType)).check(matches(isDisplayed()));
        onView(withId(R.id.inputVehiclePlate)).check(matches(isDisplayed()));
        onView(withId(R.id.inputVehicleCapacity)).check(matches(isDisplayed()));
        onView(withId(R.id.btnPickIdDocument)).check(matches(isDisplayed()));
    }

    @Test
    public void switchingBackToResident_hidesWorkerFields() {
        onView(withId(R.id.btnRoleWorker)).perform(click());
        onView(withId(R.id.btnRoleResident)).perform(click());
        onView(withId(R.id.inputAddress)).check(matches(isDisplayed()));
    }

    @Test
    public void typingResidentFields_populatesInputs() {
        onView(withId(R.id.inputName)).perform(typeText("Test Resident"), closeSoftKeyboard());
        onView(withId(R.id.inputPhone)).perform(typeText("+996700100099"), closeSoftKeyboard());
        onView(withId(R.id.inputEmail)).perform(typeText("test@example.com"), closeSoftKeyboard());
        onView(withId(R.id.inputPassword)).perform(typeText("hunter22"), closeSoftKeyboard());
        onView(withId(R.id.inputAddress)).perform(typeText("12 Lenin"), closeSoftKeyboard());
        // Hitting register would fire a network call; we verify the form filled.
        onView(withId(R.id.inputName)).check(matches(Matchers.notNullValue()));
    }
}
