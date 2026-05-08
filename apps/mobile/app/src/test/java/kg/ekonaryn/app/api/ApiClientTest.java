package kg.ekonaryn.app.api;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.util.Arrays;
import java.util.List;

import kg.ekonaryn.app.api.models.Material;
import kg.ekonaryn.app.api.models.PickupRequest;

/**
 * MockWebServer-driven contract tests for ApiClient. We bypass the static
 * INSTANCE singleton and construct a fresh ApiClient via reflection, then
 * overwrite its private baseUrl with the MockWebServer URL — that way no
 * production code change is needed for testability and the singleton behavior
 * stays exactly as it is at runtime.
 */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33)
public class ApiClientTest {

    private MockWebServer server;
    private ApiClient client;
    private final Gson gson = new Gson();

    @Before
    public void setUp() throws Exception {
        server = new MockWebServer();
        server.start();

        // Build a fresh ApiClient via the private constructor.
        Constructor<ApiClient> ctor = ApiClient.class.getDeclaredConstructor();
        ctor.setAccessible(true);
        client = ctor.newInstance();

        // Overwrite the private final baseUrl with the MockWebServer URL.
        Field f = ApiClient.class.getDeclaredField("baseUrl");
        f.setAccessible(true);
        // MockWebServer's url() returns http://host:port/, but ApiClient appends
        // each path with a leading slash, so we strip the trailing slash.
        String base = server.url("/").toString();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        f.set(client, base);
    }

    @After
    public void tearDown() throws Exception {
        server.shutdown();
    }

    private MockResponse jsonOk(JsonObject data) {
        JsonObject env = new JsonObject();
        env.addProperty("success", true);
        env.add("data", data);
        return new MockResponse().setBody(env.toString()).setHeader("Content-Type", "application/json");
    }

    @Test
    public void login_postsCredentialsAndUnwrapsTheDataEnvelope() throws Exception {
        JsonObject data = new JsonObject();
        JsonObject user = new JsonObject();
        user.addProperty("id", "u1");
        user.addProperty("name", "Admin");
        user.addProperty("phone", "+996700000001");
        user.addProperty("role", "ADMIN");
        data.add("user", user);
        data.addProperty("accessToken", "AT-1");
        data.addProperty("refreshToken", "RT-1");
        server.enqueue(jsonOk(data));

        ApiClient.AuthResponse r = client.login("+996700000001", "admin123");
        assertEquals("AT-1", r.accessToken);
        assertEquals("RT-1", r.refreshToken);
        assertNotNull(r.user);
        assertEquals("Admin", r.user.name);

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/auth/login", req.getPath());
        JsonObject body = gson.fromJson(req.getBody().readUtf8(), JsonObject.class);
        assertEquals("+996700000001", body.get("phone").getAsString());
        assertEquals("admin123", body.get("password").getAsString());
    }

    @Test
    public void me_attachesBearerTokenAndUnwrapsUser() throws Exception {
        JsonObject user = new JsonObject();
        user.addProperty("id", "u9");
        user.addProperty("name", "Resident");
        user.addProperty("phone", "+996700100001");
        user.addProperty("role", "RESIDENT");
        server.enqueue(jsonOk(user));

        kg.ekonaryn.app.api.models.User u = client.me("AT-9");
        assertEquals("u9", u.id);
        assertEquals("RESIDENT", u.role);

        RecordedRequest req = server.takeRequest();
        assertEquals("GET", req.getMethod());
        assertEquals("/auth/me", req.getPath());
        assertEquals("Bearer AT-9", req.getHeader("Authorization"));
    }

    @Test
    public void getMaterials_returnsListAndIsUnauthenticated() throws Exception {
        // The wire format is { success, data: [...] }. Build it directly.
        String body = "{\"success\":true,\"data\":["
                + "{\"id\":\"m1\",\"name\":\"PET\",\"nameRu\":\"ПЭТ\",\"buyingPrice\":5,\"unit\":\"kg\"},"
                + "{\"id\":\"m2\",\"name\":\"Cardboard\",\"nameRu\":\"Картон\",\"buyingPrice\":3,\"unit\":\"kg\"}"
                + "]}";
        server.enqueue(new MockResponse().setBody(body).setHeader("Content-Type", "application/json"));

        List<Material> mats = client.getMaterials();
        assertEquals(2, mats.size());
        assertEquals("PET", mats.get(0).name);
        assertEquals(5, mats.get(0).buyingPrice, 0.0001);

        RecordedRequest req = server.takeRequest();
        assertEquals("GET", req.getMethod());
        assertEquals("/materials", req.getPath());
        // Materials is public — no Authorization header should be set.
        assertNull(req.getHeader("Authorization"));
    }

    @Test
    public void createRequest_postsBodyAndAttachesToken() throws Exception {
        JsonObject pr = new JsonObject();
        pr.addProperty("id", "r1");
        pr.addProperty("status", "pending");
        pr.addProperty("address", "12 Lenin");
        pr.addProperty("estimatedQty", 5.0);
        server.enqueue(jsonOk(pr));

        PickupRequest out = client.createRequest("AT", "mat-1", "12 Lenin", 5.0, "Call first");
        assertEquals("r1", out.id);
        assertEquals("pending", out.status);

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/requests", req.getPath());
        assertEquals("Bearer AT", req.getHeader("Authorization"));
        JsonObject body = gson.fromJson(req.getBody().readUtf8(), JsonObject.class);
        assertEquals("mat-1", body.get("materialId").getAsString());
        assertEquals(5.0, body.get("estimatedQty").getAsDouble(), 0.0001);
        assertEquals("Call first", body.get("notes").getAsString());
    }

    @Test
    public void createRequest_omitsNotes_whenBlank() throws Exception {
        JsonObject pr = new JsonObject();
        pr.addProperty("id", "r2");
        server.enqueue(jsonOk(pr));

        client.createRequest("AT", "mat-1", "12 Lenin", 5.0, "   ");

        RecordedRequest req = server.takeRequest();
        JsonObject body = gson.fromJson(req.getBody().readUtf8(), JsonObject.class);
        assertFalse("notes should be omitted when blank", body.has("notes"));
    }

    @Test
    public void getRequests_appendsStatusFilter_whenProvided() throws Exception {
        server.enqueue(new MockResponse().setBody("{\"success\":true,\"data\":[]}")
                .setHeader("Content-Type", "application/json"));

        client.getRequests("AT", "pending", 25);

        RecordedRequest req = server.takeRequest();
        assertEquals("/requests?limit=25&status=pending", req.getPath());
    }

    @Test
    public void getRequests_omitsStatus_whenNullOrEmpty() throws Exception {
        server.enqueue(new MockResponse().setBody("{\"success\":true,\"data\":[]}")
                .setHeader("Content-Type", "application/json"));
        server.enqueue(new MockResponse().setBody("{\"success\":true,\"data\":[]}")
                .setHeader("Content-Type", "application/json"));

        client.getRequests("AT", null, 10);
        client.getRequests("AT", "", 10);

        assertEquals("/requests?limit=10", server.takeRequest().getPath());
        assertEquals("/requests?limit=10", server.takeRequest().getPath());
    }

    @Test
    public void exec_translatesNonOk_intoApiException_withServerErrorMessage() {
        server.enqueue(new MockResponse()
                .setResponseCode(409)
                .setBody("{\"success\":false,\"error\":\"Phone already in use\"}")
                .setHeader("Content-Type", "application/json"));

        try {
            client.login("+996700000001", "anything");
            fail("expected ApiException");
        } catch (ApiException e) {
            assertEquals(409, e.code);
            assertEquals("Phone already in use", e.getMessage());
        }
    }

    @Test
    public void exec_translatesNonOkWithoutErrorField_intoHttpStatusMessage() {
        server.enqueue(new MockResponse().setResponseCode(500).setBody("internal boom"));

        try {
            client.login("+996700000001", "x");
            fail("expected ApiException");
        } catch (ApiException e) {
            assertEquals(500, e.code);
            assertEquals("HTTP 500", e.getMessage());
        }
    }

    @Test
    public void exec_translatesNetworkError_intoApiException_withCodeZero() throws Exception {
        // Force an immediate disconnect by shutting the server before the call.
        server.shutdown();
        try {
            client.getMaterials();
            fail("expected ApiException");
        } catch (ApiException e) {
            assertEquals(0, e.code);
            assertNotNull(e.getMessage());
        }
    }

    @Test
    public void approveWorker_postsToCorrectUrlAndUnwraps() throws Exception {
        JsonObject u = new JsonObject();
        u.addProperty("id", "u-w");
        u.addProperty("accountStatus", "ACTIVE");
        server.enqueue(jsonOk(u));

        kg.ekonaryn.app.api.models.User out = client.approveWorker("AT-admin", "u-w");
        assertEquals("ACTIVE", out.accountStatus);

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/users/u-w/approve", req.getPath());
        assertEquals("Bearer AT-admin", req.getHeader("Authorization"));
    }

    @Test
    public void registerWorker_postsMultipart_withIdDocumentAndServiceAreasArray() throws Exception {
        JsonObject data = new JsonObject();
        data.addProperty("message", "Pending approval");
        server.enqueue(jsonOk(data));

        client.registerWorker(
                "Test Worker",
                "+996700099999",
                "wrk@example.com",
                "secret-pw",
                "AN1234",
                Arrays.asList("Center", "North"),
                "motorcycle",
                "01KG999",
                150.5,
                "id.jpg",
                new byte[]{1, 2, 3, 4},
                "image/jpeg"
        );

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/auth/register/worker", req.getPath());
        String contentType = req.getHeader("Content-Type");
        assertTrue("Content-Type should be multipart/form-data, was " + contentType,
                contentType != null && contentType.startsWith("multipart/form-data"));
        // Body contains both the JSON-serialized service-areas array and the file part marker.
        String body = req.getBody().readUtf8();
        assertTrue(body.contains("name=\"serviceAreas\""));
        assertTrue(body.contains("[\"Center\",\"North\"]"));
        assertTrue(body.contains("name=\"idDocument\""));
        assertTrue(body.contains("filename=\"id.jpg\""));
    }

    @Test
    public void exec_handlesNullDataField_byReturningNull() throws Exception {
        // Server says success, but data is missing — exec returns null when dataType is null.
        // For the verifyCode endpoint, dataType IS null in production.
        server.enqueue(new MockResponse().setBody("{\"success\":true,\"data\":null}")
                .setHeader("Content-Type", "application/json"));

        // verifyCode is the public method that passes null dataType.
        client.verifyCode("+996700000001", "123456");

        RecordedRequest req = server.takeRequest();
        assertEquals("/auth/verify", req.getPath());
    }
}
