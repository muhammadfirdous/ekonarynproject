package kg.ekonaryn.app.api;

import android.os.Handler;
import android.os.Looper;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.concurrent.TimeUnit;

import kg.ekonaryn.app.BuildConfig;
import kg.ekonaryn.app.api.models.Material;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.api.models.Schedule;
import kg.ekonaryn.app.api.models.User;
import okhttp3.MediaType;
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
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private static volatile ApiClient INSTANCE;

    private final OkHttpClient http;
    private final Gson gson = new Gson();
    private final String baseUrl;

    private ApiClient() {
        this.baseUrl = BuildConfig.API_BASE_URL;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
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
    }

    public AuthResponse login(String phone, String password) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("phone", phone);
        body.addProperty("password", password);
        Request r = req("/auth/login", null).post(jsonBody(body)).build();
        return exec(r, AuthResponse.class);
    }

    public AuthResponse register(String name, String phone, String password, String address) throws ApiException {
        JsonObject body = new JsonObject();
        body.addProperty("name", name);
        body.addProperty("phone", phone);
        body.addProperty("password", password);
        if (address != null && !address.trim().isEmpty()) body.addProperty("address", address);
        Request r = req("/auth/register", null).post(jsonBody(body)).build();
        return exec(r, AuthResponse.class);
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
}
