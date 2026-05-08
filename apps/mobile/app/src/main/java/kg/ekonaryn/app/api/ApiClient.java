package kg.ekonaryn.app.api;

import android.os.Handler;
import android.os.Looper;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.TimeUnit;

import kg.ekonaryn.app.BuildConfig;
import kg.ekonaryn.app.api.models.Material;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.api.models.Schedule;
import kg.ekonaryn.app.api.models.User;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

/**
 * Thin wrapper around OkHttp + Gson. Each public method returns synchronously and
 * throws {@link ApiException}; callers run them on a worker thread and post back
 * with {@link #postMain(Runnable)}.
 */
public class ApiClient {

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    private static final MediaType OCTET = MediaType.parse("application/octet-stream");
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private static volatile ApiClient INSTANCE;

    private final OkHttpClient http;
    private final Gson gson = new Gson();
    private final String baseUrl;

    private ApiClient() {
        this.baseUrl = BuildConfig.API_BASE_URL;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    public static ApiClient get() {
        if (INSTANCE == null) {
            synchronized (ApiClient.class) {
                if (INSTANCE == null) INSTANCE = new ApiClient();
            }
        }
        return INSTANCE;
    }

    public static void postMain(Runnable r) { MAIN.post(r); }

    // ---------- HTTP helpers ----------

    private Request.Builder req(String path, String token) {
        Request.Builder b = new Request.Builder().url(baseUrl + path);
        if (token != null) b.addHeader("Authorization", "Bearer " + token);
        return b;
    }

    private <T> T exec(Request request, Type dataType) throws ApiException {
        try (Response res = http.newCall(request).execute()) {
            ResponseBody body = res.body();
            String text = body != null ? body.string() : "";
            if (!res.isSuccessful()) {
                String msg = "HTTP " + res.code();
                try {
                    JsonObject err = gson.fromJson(text, JsonObject.class);
                    if (err != null && err.has("error")) msg = err.get("error").getAsString();
                } catch (Exception ignored) {}
                throw new ApiException(res.code(), msg);
            }
            if (dataType == null) return null;
            JsonObject env = gson.fromJson(text, JsonObject.class);
            JsonElement data = env != null ? env.get("data") : null;
            if (data == null || data.isJsonNull()) return null;
            return gson.fromJson(data, dataType);
        } catch (IOException e) {
            throw new ApiException(0, e.getMessage() != null ? e.getMessage() : "Network error");
        }
    }

    private RequestBody jsonBody(Object obj) {
        return RequestBody.create(gson.toJson(obj), JSON);
    }

    // ---------- Auth ----------

    public static class AuthResponse {
        public User user;
        public String accessToken;
        public String refreshToken;
        // Set when the server returns a registration response with no tokens
        // (e.g. worker registration that needs admin approval).
        public String message;
        // Dev-only: server echoes back the verification code so QA can complete the flow.
        public String verificationCode;
    }

    public AuthResponse login(String phone, String password) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("phone", phone);
        body.addProperty("password", password);
        Request r = req("/auth/login", null).post(jsonBody(body)).build();
        return exec(r, AuthResponse.class);
    }

    /**
     * Legacy resident registration (kept for compatibility with the previous
     * single-form RegisterActivity flow). Prefer {@link #registerResident}.
     */
    public AuthResponse register(String name, String phone, String password, String address) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("name", name);
        body.addProperty("phone", phone);
        body.addProperty("password", password);
        if (address != null && !address.trim().isEmpty()) body.addProperty("address", address);
        Request r = req("/auth/register", null).post(jsonBody(body)).build();
        return exec(r, AuthResponse.class);
    }

    public AuthResponse registerResident(String name, String phone, String email, String password, String address) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("name", name);
        body.addProperty("phone", phone);
        if (email != null && !email.trim().isEmpty()) body.addProperty("email", email);
        body.addProperty("password", password);
        if (address != null && !address.trim().isEmpty()) body.addProperty("address", address);
        Request r = req("/auth/register/resident", null).post(jsonBody(body)).build();
        return exec(r, AuthResponse.class);
    }

    public AuthResponse registerWorker(
            String name,
            String phone,
            String email,
            String password,
            String idNumber,
            List<String> serviceAreas,
            String vehicleType,
            String vehiclePlate,
            double vehicleCapacityKg,
            String idDocumentFilename,
            byte[] idDocumentBytes,
            String idDocumentMimeType
    ) throws ApiException {
        MultipartBody.Builder mb = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("name", name)
                .addFormDataPart("phone", phone)
                .addFormDataPart("password", password)
                .addFormDataPart("idNumber", idNumber)
                .addFormDataPart("vehicleType", vehicleType)
                .addFormDataPart("vehiclePlate", vehiclePlate)
                .addFormDataPart("vehicleCapacityKg", String.valueOf(vehicleCapacityKg))
                .addFormDataPart("serviceAreas", gson.toJson(serviceAreas));
        if (email != null && !email.trim().isEmpty()) mb.addFormDataPart("email", email);
        MediaType mt = idDocumentMimeType != null ? MediaType.parse(idDocumentMimeType) : OCTET;
        mb.addFormDataPart("idDocument", idDocumentFilename, RequestBody.create(idDocumentBytes, mt));
        Request r = req("/auth/register/worker", null).post(mb.build()).build();
        return exec(r, AuthResponse.class);
    }

    public void verifyCode(String phone, String code) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("phone", phone);
        body.addProperty("code", code);
        Request r = req("/auth/verify", null).post(jsonBody(body)).build();
        exec(r, null);
    }

    public User me(String token) throws ApiException {
        Request r = req("/auth/me", token).get().build();
        return exec(r, User.class);
    }

    // ---------- Public ----------

    public java.util.List<Material> getMaterials() throws ApiException {
        Request r = req("/materials", null).get().build();
        Type t = new TypeToken<java.util.List<Material>>(){}.getType();
        java.util.List<Material> list = exec(r, t);
        return list != null ? list : new java.util.ArrayList<>();
    }

    public java.util.List<Schedule> getSchedule() throws ApiException {
        Request r = req("/schedule", null).get().build();
        Type t = new TypeToken<java.util.List<Schedule>>(){}.getType();
        java.util.List<Schedule> list = exec(r, t);
        return list != null ? list : new java.util.ArrayList<>();
    }

    // ---------- Authenticated ----------

    public java.util.List<PickupRequest> getRequests(String token, String statusFilter, int limit) throws ApiException {
        StringBuilder url = new StringBuilder("/requests?limit=").append(limit);
        if (statusFilter != null && !statusFilter.isEmpty()) {
            url.append("&status=").append(statusFilter);
        }
        Request r = req(url.toString(), token).get().build();
        Type t = new TypeToken<java.util.List<PickupRequest>>(){}.getType();
        java.util.List<PickupRequest> list = exec(r, t);
        return list != null ? list : new java.util.ArrayList<>();
    }

    public PickupRequest createRequest(String token, String materialId, String address, double estimatedQty, String notes) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("materialId", materialId);
        body.addProperty("address", address);
        body.addProperty("estimatedQty", estimatedQty);
        if (notes != null && !notes.trim().isEmpty()) body.addProperty("notes", notes);
        Request r = req("/requests", token).post(jsonBody(body)).build();
        return exec(r, PickupRequest.class);
    }

    public java.util.List<kg.ekonaryn.app.api.models.Collection> getCollections(String token, int limit) throws ApiException {
        Request r = req("/collections?limit=" + limit, token).get().build();
        Type t = new TypeToken<java.util.List<kg.ekonaryn.app.api.models.Collection>>(){}.getType();
        java.util.List<kg.ekonaryn.app.api.models.Collection> list = exec(r, t);
        return list != null ? list : new java.util.ArrayList<>();
    }

    public kg.ekonaryn.app.api.models.Collection createCollection(String token, String requestId, String materialId, double weight, String notes) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("requestId", requestId);
        body.addProperty("materialId", materialId);
        body.addProperty("actualWeightKg", weight);
        if (notes != null && !notes.trim().isEmpty()) body.addProperty("notes", notes);
        Request r = req("/collections", token).post(jsonBody(body)).build();
        return exec(r, kg.ekonaryn.app.api.models.Collection.class);
    }

    // ---------- Admin ----------

    public kg.ekonaryn.app.api.models.Overview getOverview(String token) throws ApiException {
        Request r = req("/analytics/overview", token).get().build();
        return exec(r, kg.ekonaryn.app.api.models.Overview.class);
    }

    public java.util.List<kg.ekonaryn.app.api.models.WorkerStats> getWorkerStats(String token) throws ApiException {
        Request r = req("/analytics/workers", token).get().build();
        Type t = new TypeToken<java.util.List<kg.ekonaryn.app.api.models.WorkerStats>>(){}.getType();
        java.util.List<kg.ekonaryn.app.api.models.WorkerStats> list = exec(r, t);
        return list != null ? list : new java.util.ArrayList<>();
    }

    public java.util.List<User> getPendingWorkers(String token) throws ApiException {
        Request r = req("/users/workers/pending", token).get().build();
        Type t = new TypeToken<java.util.List<User>>(){}.getType();
        java.util.List<User> list = exec(r, t);
        return list != null ? list : new java.util.ArrayList<>();
    }

    public User approveWorker(String token, String userId) throws ApiException {
        Request r = req("/users/" + userId + "/approve", token).post(jsonBody(new JsonObject())).build();
        return exec(r, User.class);
    }

    public User rejectWorker(String token, String userId, String reason) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("reason", reason);
        Request r = req("/users/" + userId + "/reject", token).post(jsonBody(body)).build();
        return exec(r, User.class);
    }

    public User suspendWorker(String token, String userId, String reason) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("reason", reason);
        Request r = req("/users/" + userId + "/suspend", token).post(jsonBody(body)).build();
        return exec(r, User.class);
    }

    public User reactivateWorker(String token, String userId) throws ApiException {
        Request r = req("/users/" + userId + "/reactivate", token).post(jsonBody(new JsonObject())).build();
        return exec(r, User.class);
    }

    public PickupRequest assignOrder(String token, String requestId, String workerId) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("workerId", workerId);
        Request r = req("/requests/" + requestId + "/assign", token).post(jsonBody(body)).build();
        return exec(r, PickupRequest.class);
    }

    public PickupRequest updateRequestStatus(String token, String requestId, String status) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("status", status);
        Request r = req("/requests/" + requestId + "/status", token).put(jsonBody(body)).build();
        return exec(r, PickupRequest.class);
    }

    /** Reference helper used when uploading a worker's ID document from the gallery. */
    public static byte[] readAllBytes(InputStream in) throws IOException {
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
        return out.toByteArray();
    }
}
