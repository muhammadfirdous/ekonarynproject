package kg.ekonaryn.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Phase 1 unit-test smoke. Plain JUnit only — no Robolectric, no Android-resource
 * loading — so it runs on any JDK without ASM-classfile-version friction.
 *
 * Robolectric-based tests for AuthManager / ApiClient / Async / models / LocaleHelper
 * land in Phase 7 once the Robolectric/JDK matrix is locked in CI.
 */
public class SmokeTest {

    @Test
    public void arithmeticStillWorks() {
        assertEquals(4, 2 + 2);
    }

    @Test
    public void buildConfigIsReadable() {
        assertNotNull(BuildConfig.API_BASE_URL);
        assertTrue(BuildConfig.API_BASE_URL.length() > 0);
    }
}
