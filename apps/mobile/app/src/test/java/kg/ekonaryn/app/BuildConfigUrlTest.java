package kg.ekonaryn.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pin the API_BASE_URL config exposed by BuildConfig per build variant.
 *
 * <p>The release variant must NOT match the Android emulator's host loopback
 * (10.0.2.2) — that hostname only resolves on the emulator. A release APK
 * pointing at it cannot reach the API on a real device.
 *
 * <p>build.gradle now reads URL strings from gradle properties:
 *   def apiBaseUrlDebug   = project.findProperty('API_BASE_URL_DEBUG')   ?: '<default>'
 *   def apiBaseUrlRelease = project.findProperty('API_BASE_URL_RELEASE') ?: '<default>'
 * The parser below extracts those defaults so the test still reads the
 * effective baked-in URL when no gradle property is set.
 */
public class BuildConfigUrlTest {

    private static final String EMULATOR_URL = "http://10.0.2.2:4000/api/v1";

    // Match a buildType block and capture its body. The closing `}` must sit on
    // a line by itself (possibly with whitespace) — that's the convention in
    // app/build.gradle and keeps us from greedy-matching over the whole file.
    private static final Pattern BLOCK_PATTERN = Pattern.compile(
            "(?s)\\b(debug|release)\\s*\\{(.*?)^\\s*\\}",
            Pattern.MULTILINE);

    // Match either a literal URL or a "${var}" reference in the buildConfigField line.
    private static final Pattern URL_PATTERN = Pattern.compile(
            "buildConfigField\\s+\"String\",\\s*\"API_BASE_URL\",\\s*\"\\\\\"(\\$\\{[^}]+\\}|[^\"\\\\]+)\\\\\"\"");

    // Match `def varName = project.findProperty('X') ?: 'default-string'` — we
    // grab the default literal so the test can resolve "${varName}" references.
    private static final Pattern DEF_DEFAULT_PATTERN = Pattern.compile(
            "def\\s+(\\w+)\\s*=\\s*project\\.findProperty\\([^)]+\\)\\s*\\?:\\s*'([^']+)'");

    private static String readBuildGradle() throws IOException {
        // Tests run from app/ directory under gradle's standard layout.
        Path p = Paths.get("build.gradle");
        if (!Files.exists(p)) p = Paths.get("apps/mobile/app/build.gradle");
        return new String(Files.readAllBytes(p), StandardCharsets.UTF_8);
    }

    private static Map<String, String> defaultsTable(String gradle) {
        Map<String, String> defaults = new HashMap<>();
        Matcher m = DEF_DEFAULT_PATTERN.matcher(gradle);
        while (m.find()) {
            defaults.put(m.group(1), m.group(2));
        }
        return defaults;
    }

    private static String urlForVariant(String gradle, String variant) {
        Map<String, String> defaults = defaultsTable(gradle);
        Matcher m = BLOCK_PATTERN.matcher(gradle);
        while (m.find()) {
            if (variant.equals(m.group(1))) {
                Matcher u = URL_PATTERN.matcher(m.group(2));
                if (u.find()) {
                    String captured = u.group(1);
                    if (captured.startsWith("${") && captured.endsWith("}")) {
                        String varName = captured.substring(2, captured.length() - 1);
                        return defaults.get(varName);
                    }
                    return captured;
                }
            }
        }
        return null;
    }

    @Test
    public void debugVariant_defaultsToTheAndroidEmulatorHostLoopback() throws Exception {
        String gradle = readBuildGradle();
        String debugUrl = urlForVariant(gradle, "debug");
        assertNotNull("Could not resolve buildConfigField default for the debug block", debugUrl);
        assertEquals(EMULATOR_URL, debugUrl);
    }

    @Test
    public void buildConfig_atRuntime_matchesTheDebugBuildVariantUrl() {
        // BuildConfig is generated against whichever variant ran the tests; for
        // unit tests under `testDebugUnitTest`, that's debug. With no gradle
        // property override, the baked-in value is the debug default.
        assertNotNull(BuildConfig.API_BASE_URL);
        assertEquals(EMULATOR_URL, BuildConfig.API_BASE_URL);
    }

    @Test
    public void releaseVariant_doesNotPointAtTheEmulatorLoopback() throws Exception {
        String gradle = readBuildGradle();
        String releaseUrl = urlForVariant(gradle, "release");
        assertNotNull("Could not resolve buildConfigField default for the release block", releaseUrl);
        assertNotEquals(
                "Release APK would be unreachable on a real device — set API_BASE_URL_RELEASE",
                EMULATOR_URL, releaseUrl);
    }

    @Test
    public void releaseVariant_defaultIsHttps() throws Exception {
        // Release should use HTTPS by default. usesCleartextTraffic in the
        // manifest is "true" for emulator dev convenience, but the release
        // variant should never need cleartext to reach a properly-deployed API.
        String gradle = readBuildGradle();
        String releaseUrl = urlForVariant(gradle, "release");
        assertNotNull(releaseUrl);
        assertTrue("Release URL must be https://, was: " + releaseUrl,
                releaseUrl.startsWith("https://"));
    }
}
