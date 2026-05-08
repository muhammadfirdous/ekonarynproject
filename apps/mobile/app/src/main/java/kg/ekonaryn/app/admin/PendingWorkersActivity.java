package kg.ekonaryn.app.admin;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.List;
import java.util.Locale;

import kg.ekonaryn.app.BuildConfig;
import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.User;

public class PendingWorkersActivity extends AppCompatActivity {

    private SwipeRefreshLayout swipe;
    private LinearLayout container;
    private TextView textEmpty;

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(LocaleHelper.wrap(base));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pending_workers);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(R.string.admin_pending_title);
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        swipe = findViewById(R.id.swipeRefresh);
        container = findViewById(R.id.pendingContainer);
        textEmpty = findViewById(R.id.textEmpty);

        swipe.setOnRefreshListener(this::load);
        load();
    }

    @Override
    public boolean onSupportNavigateUp() {
        finish();
        return true;
    }

    private void load() {
        swipe.setRefreshing(true);
        String token = EkoApp.get().auth().getToken();
        Async.run(() -> ApiClient.get().getPendingWorkers(token),
                this::render,
                err -> {
                    swipe.setRefreshing(false);
                    Toast.makeText(this, err.getMessage() != null ? err.getMessage()
                            : getString(R.string.admin_loading_failed), Toast.LENGTH_LONG).show();
                });
    }

    private void render(List<User> items) {
        swipe.setRefreshing(false);
        container.removeAllViews();
        if (items == null || items.isEmpty()) {
            textEmpty.setVisibility(View.VISIBLE);
            return;
        }
        textEmpty.setVisibility(View.GONE);
        LayoutInflater inf = LayoutInflater.from(this);
        for (User u : items) {
            View row = inf.inflate(R.layout.row_pending_worker, container, false);
            ((TextView) row.findViewById(R.id.textName)).setText(u.name != null ? u.name : "");
            ((TextView) row.findViewById(R.id.textPhone)).setText(u.phone != null ? u.phone : "");

            String details = String.format(Locale.US, "%s: %s\n%s: %s\n%s: %s\n%s: %s\n%s: %s",
                    getString(R.string.admin_pending_field_id), nullToDash(u.idNumber),
                    getString(R.string.admin_pending_field_areas), formatAreas(u.serviceAreas),
                    getString(R.string.admin_pending_field_vehicle_type), nullToDash(u.vehicleType),
                    getString(R.string.admin_pending_field_vehicle_plate), nullToDash(u.vehiclePlate),
                    getString(R.string.admin_pending_field_capacity),
                    u.vehicleCapacityKg != null ? u.vehicleCapacityKg + " kg" : "—");
            ((TextView) row.findViewById(R.id.textDetails)).setText(details);

            TextView doc = row.findViewById(R.id.textIdDocument);
            if (u.idDocumentUrl != null && !u.idDocumentUrl.isEmpty()) {
                doc.setVisibility(View.VISIBLE);
                doc.setText(R.string.admin_pending_view_document);
                doc.setOnClickListener(v -> openDocument(u.idDocumentUrl));
            }

            row.findViewById(R.id.btnApprove).setOnClickListener(v -> approve(u));
            row.findViewById(R.id.btnReject).setOnClickListener(v -> promptReject(u));
            container.addView(row);
        }
    }

    private void openDocument(String relativeUrl) {
        // BuildConfig.API_BASE_URL ends in /api/v1; strip it to get the upload origin.
        String origin = BuildConfig.API_BASE_URL.replace("/api/v1", "");
        Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse(origin + relativeUrl));
        startActivity(Intent.createChooser(open, getString(R.string.admin_pending_view_document)));
    }

    private void approve(User u) {
        String token = EkoApp.get().auth().getToken();
        Async.run(
                () -> ApiClient.get().approveWorker(token, u.id),
                ok -> {
                    Toast.makeText(this, R.string.admin_pending_approved, Toast.LENGTH_SHORT).show();
                    load();
                },
                err -> Toast.makeText(this, err.getMessage(), Toast.LENGTH_LONG).show()
        );
    }

    private void promptReject(User u) {
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT);
        input.setHint(R.string.admin_pending_reject_reason_hint);
        new AlertDialog.Builder(this)
                .setTitle(R.string.admin_pending_reject)
                .setView(input)
                .setPositiveButton(R.string.admin_pending_reject, (d, w) -> {
                    String reason = input.getText().toString().trim();
                    if (reason.isEmpty()) {
                        Toast.makeText(this, R.string.admin_pending_reject_reason_required, Toast.LENGTH_SHORT).show();
                        return;
                    }
                    String token = EkoApp.get().auth().getToken();
                    Async.run(
                            () -> ApiClient.get().rejectWorker(token, u.id, reason),
                            ok -> {
                                Toast.makeText(this, R.string.admin_pending_rejected, Toast.LENGTH_SHORT).show();
                                load();
                            },
                            err -> Toast.makeText(this, err.getMessage(), Toast.LENGTH_LONG).show()
                    );
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private static String nullToDash(String s) {
        return s == null || s.isEmpty() ? "—" : s;
    }

    private static String formatAreas(String json) {
        if (json == null || json.isEmpty()) return "—";
        try {
            com.google.gson.JsonArray arr = com.google.gson.JsonParser.parseString(json).getAsJsonArray();
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < arr.size(); i++) {
                if (i > 0) sb.append(", ");
                sb.append(arr.get(i).getAsString());
            }
            return sb.toString();
        } catch (Exception e) {
            return json;
        }
    }
}
