# Mobile Tests

Native Android Java tests, two flavours:

| Layer        | Path                           | Runner                                        | Run                                                              |
| ------------ | ------------------------------ | --------------------------------------------- | ---------------------------------------------------------------- |
| Unit (JVM)   | `app/src/test/java/...`        | JUnit 4 + Mockito + Robolectric               | `./gradlew testDebugUnitTest`                                    |
| Instrumented | `app/src/androidTest/java/...` | AndroidJUnitRunner + Espresso + MockWebServer | `./gradlew connectedDebugAndroidTest` (needs an emulator/device) |

## JDK / Gradle compatibility

- Gradle wrapper is pinned to **8.14.3** (required for JDK 24).
- `local.properties` (gitignored) must point at the Android SDK:
  `sdk.dir=…\\Android\\Sdk`
- Robolectric **4.15.1+** is required for JDK 24 class files. Older versions
  fail with `IllegalArgumentException at ClassReader.java:200`.

## Conventions

- Mocks for HTTP go through OkHttp's `MockWebServer` so we exercise the real
  `ApiClient` plumbing.
- For tests that touch `EncryptedSharedPreferences`, mock the `MasterKey` /
  factory rather than relying on the keystore.
- Espresso assertions should poll (`Espresso.onView(…).check(matches(…))`),
  not sleep.

## Build configuration

`API_BASE_URL` is read from gradle properties so the release APK doesn't bake
in the emulator loopback. The defaults are:

| Variant   | Default URL                      | Purpose                                                                                                           |
| --------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `debug`   | `http://10.0.2.2:4000/api/v1`    | Android emulator's hostname for the host's loopback. Lets the dev API on the laptop be reached from the emulator. |
| `release` | `https://api.ekonaryn.kg/api/v1` | Production placeholder. Override before publishing.                                                               |

Override per-build:

- **Local release builds** — drop into `~/.gradle/gradle.properties` (NOT into the repo):
  ```properties
  API_BASE_URL_RELEASE=https://api.your-host.example/api/v1
  ```
- **Command line** — `./gradlew assembleRelease -PAPI_BASE_URL_RELEASE=https://api.your-host.example/api/v1`
- **CI** — set the gradle property via `ORG_GRADLE_PROJECT_API_BASE_URL_RELEASE=...` in the workflow env, or via `gradle.properties` written by the job step.

`BuildConfigUrlTest.releaseVariant_doesNotPointAtTheEmulatorLoopback` asserts
that the release default never matches `http://10.0.2.2:4000/api/v1`, and
`releaseVariant_defaultIsHttps` pins HTTPS for the release variant.

## Phase status

- **Phase 1**: smoke tests only (`SmokeTest`, `SmokeInstrumentedTest`). They
  confirm the test pipeline runs.
- **Phase 7**: real coverage of `AuthManager`, `ApiClient`, `Async`, Gson
  models, `LocaleHelper`, and Espresso flows for every Activity.
