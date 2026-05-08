package kg.ekonaryn.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import android.content.Context;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Phase 1 instrumented-test smoke. Runs on a real device or emulator.
 * Real Espresso flows (login, register, role nav) land in Phase 7.
 */
@RunWith(AndroidJUnit4.class)
public class SmokeInstrumentedTest {

    @Test
    public void appPackageIsCorrect() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("kg.ekonaryn.app", appContext.getPackageName());
    }

    @Test
    public void appNameStringResourceIsPresent() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String appName = appContext.getString(R.string.app_name);
        assertNotNull(appName);
        assertEquals(true, appName.length() > 0);
    }
}
