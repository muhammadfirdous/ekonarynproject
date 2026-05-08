package kg.ekonaryn.app.auth;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.TextUtils;
import android.text.style.ForegroundColorSpan;
import android.text.style.StyleSpan;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.resident.ResidentMainActivity;

public class RegisterActivity extends AppCompatActivity {

    private static final String ROLE_RESIDENT = "RESIDENT";
    private static final String ROLE_WORKER = "WORKER";

    private EditText inputName, inputPhone, inputEmail, inputPassword, inputAddress;
    private EditText inputIdNumber, inputServiceAreas, inputVehicleType, inputVehiclePlate, inputVehicleCapacity;
    private Button btnRegister, btnRoleResident, btnRoleWorker, btnPickIdDocument;
    private TextView errorBox, btnGoToLogin, textIdDocumentName;
    private LinearLayout sectionResident, sectionWorker;

    private String selectedRole = ROLE_RESIDENT;
    private Uri pickedDocumentUri;
    private String pickedDocumentName;
    private String pickedDocumentMime;

    private final ActivityResultLauncher<String> pickDocumentLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            uri -> {
                if (uri == null) return;
                pickedDocumentUri = uri;
                pickedDocumentMime = getContentResolver().getType(uri);
                pickedDocumentName = queryDisplayName(uri);
                textIdDocumentName.setText(pickedDocumentName != null ? pickedDocumentName : uri.getLastPathSegment());
            }
    );

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(LocaleHelper.wrap(base));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        inputName = findViewById(R.id.inputName);
        inputPhone = findViewById(R.id.inputPhone);
        inputEmail = findViewById(R.id.inputEmail);
        inputPassword = findViewById(R.id.inputPassword);
        inputAddress = findViewById(R.id.inputAddress);
        inputIdNumber = findViewById(R.id.inputIdNumber);
        inputServiceAreas = findViewById(R.id.inputServiceAreas);
        inputVehicleType = findViewById(R.id.inputVehicleType);
        inputVehiclePlate = findViewById(R.id.inputVehiclePlate);
        inputVehicleCapacity = findViewById(R.id.inputVehicleCapacity);
        btnRegister = findViewById(R.id.btnRegister);
        btnRoleResident = findViewById(R.id.btnRoleResident);
        btnRoleWorker = findViewById(R.id.btnRoleWorker);
        btnPickIdDocument = findViewById(R.id.btnPickIdDocument);
        textIdDocumentName = findViewById(R.id.textIdDocumentName);
        sectionResident = findViewById(R.id.sectionResident);
        sectionWorker = findViewById(R.id.sectionWorker);
        errorBox = findViewById(R.id.errorBox);
        btnGoToLogin = findViewById(R.id.btnGoToLogin);

        renderLoginPrompt();
        inputPhone.setText("+996");
        inputPhone.setSelection(inputPhone.getText().length());

        btnRoleResident.setOnClickListener(v -> setRole(ROLE_RESIDENT));
        btnRoleWorker.setOnClickListener(v -> setRole(ROLE_WORKER));
        btnPickIdDocument.setOnClickListener(v -> pickDocumentLauncher.launch("image/*"));
        btnRegister.setOnClickListener(v -> handleRegister());
        btnGoToLogin.setOnClickListener(v -> finish());

        setRole(ROLE_RESIDENT);
    }

    private void setRole(String role) {
        selectedRole = role;
        boolean isWorker = ROLE_WORKER.equals(role);
        sectionWorker.setVisibility(isWorker ? View.VISIBLE : View.GONE);
        sectionResident.setVisibility(isWorker ? View.GONE : View.VISIBLE);
        btnRoleResident.setBackgroundResource(isWorker ? android.R.color.transparent : R.drawable.bg_chip_active);
        btnRoleResident.setTextColor(ContextCompat.getColor(this, isWorker ? R.color.text_gray : R.color.white));
        btnRoleWorker.setBackgroundResource(isWorker ? R.drawable.bg_chip_active : android.R.color.transparent);
        btnRoleWorker.setTextColor(ContextCompat.getColor(this, isWorker ? R.color.white : R.color.text_gray));
    }

    private void renderLoginPrompt() {
        String prompt = getString(R.string.auth_has_account) + " ";
        String link = getString(R.string.auth_to_login);
        SpannableString span = new SpannableString(prompt + link);
        int linkStart = prompt.length();
        span.setSpan(new ForegroundColorSpan(ContextCompat.getColor(this, R.color.brand_primary)),
                linkStart, span.length(), Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
        span.setSpan(new StyleSpan(android.graphics.Typeface.BOLD),
                linkStart, span.length(), Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
        btnGoToLogin.setText(span);
    }

    private void handleRegister() {
        String name = inputName.getText().toString().trim();
        String phone = inputPhone.getText().toString().trim();
        String email = inputEmail.getText().toString().trim();
        String password = inputPassword.getText().toString();

        if (name.isEmpty() || phone.isEmpty() || password.isEmpty()) {
            showError(getString(R.string.auth_fill_phone_pass));
            return;
        }
        errorBox.setVisibility(View.GONE);
        btnRegister.setEnabled(false);
        btnRegister.setText(R.string.auth_registering);

        if (ROLE_WORKER.equals(selectedRole)) {
            handleWorkerRegister(name, phone, email, password);
        } else {
            handleResidentRegister(name, phone, email, password);
        }
    }

    private void handleResidentRegister(String name, String phone, String email, String password) {
        String address = inputAddress.getText().toString().trim();
        Async.run(
                () -> ApiClient.get().registerResident(name, phone, email.isEmpty() ? null : email, password, address.isEmpty() ? null : address),
                resp -> {
                    btnRegister.setEnabled(true);
                    btnRegister.setText(R.string.auth_register);
                    if (resp == null || resp.user == null || resp.accessToken == null) {
                        showError(getString(R.string.auth_register_failed));
                        return;
                    }
                    EkoApp.get().auth().save(resp.accessToken, resp.user);
                    Intent next = new Intent(this, ResidentMainActivity.class);
                    next.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(next);
                    finish();
                },
                err -> {
                    btnRegister.setEnabled(true);
                    btnRegister.setText(R.string.auth_register);
                    String m = err.getMessage();
                    showError(m != null ? m : getString(R.string.auth_register_failed));
                }
        );
    }

    private void handleWorkerRegister(String name, String phone, String email, String password) {
        String idNumber = inputIdNumber.getText().toString().trim();
        String serviceAreasRaw = inputServiceAreas.getText().toString().trim();
        String vehicleType = inputVehicleType.getText().toString().trim();
        String vehiclePlate = inputVehiclePlate.getText().toString().trim();
        String capacityRaw = inputVehicleCapacity.getText().toString().trim();

        if (idNumber.isEmpty() || serviceAreasRaw.isEmpty() || vehicleType.isEmpty()
                || vehiclePlate.isEmpty() || capacityRaw.isEmpty()) {
            btnRegister.setEnabled(true);
            btnRegister.setText(R.string.auth_register);
            showError(getString(R.string.auth_worker_fill_required));
            return;
        }

        if (pickedDocumentUri == null) {
            btnRegister.setEnabled(true);
            btnRegister.setText(R.string.auth_register);
            showError(getString(R.string.auth_id_document_required));
            return;
        }

        double capacity;
        try {
            capacity = Double.parseDouble(capacityRaw);
        } catch (NumberFormatException e) {
            btnRegister.setEnabled(true);
            btnRegister.setText(R.string.auth_register);
            showError(getString(R.string.auth_invalid_capacity));
            return;
        }

        List<String> areas = new ArrayList<>();
        for (String s : serviceAreasRaw.split(",")) {
            String trimmed = s.trim();
            if (!TextUtils.isEmpty(trimmed)) areas.add(trimmed);
        }
        if (areas.isEmpty()) {
            btnRegister.setEnabled(true);
            btnRegister.setText(R.string.auth_register);
            showError(getString(R.string.auth_worker_fill_required));
            return;
        }

        final byte[] documentBytes;
        final String documentName = pickedDocumentName != null ? pickedDocumentName : "id-document";
        final String documentMime = pickedDocumentMime != null ? pickedDocumentMime : "application/octet-stream";
        try (InputStream is = getContentResolver().openInputStream(pickedDocumentUri)) {
            if (is == null) throw new java.io.IOException("Could not read selected document");
            documentBytes = ApiClient.readAllBytes(is);
        } catch (Exception e) {
            btnRegister.setEnabled(true);
            btnRegister.setText(R.string.auth_register);
            showError(e.getMessage() != null ? e.getMessage() : getString(R.string.auth_register_failed));
            return;
        }

        Async.run(
                () -> ApiClient.get().registerWorker(
                        name, phone, email.isEmpty() ? null : email, password,
                        idNumber, areas, vehicleType, vehiclePlate, capacity,
                        documentName, documentBytes, documentMime),
                resp -> {
                    btnRegister.setEnabled(true);
                    btnRegister.setText(R.string.auth_register);
                    showWorkerPendingDialog(resp != null && resp.message != null
                            ? resp.message
                            : getString(R.string.auth_worker_pending));
                },
                err -> {
                    btnRegister.setEnabled(true);
                    btnRegister.setText(R.string.auth_register);
                    String m = err.getMessage();
                    showError(m != null ? m : getString(R.string.auth_register_failed));
                }
        );
    }

    private void showWorkerPendingDialog(String message) {
        new AlertDialog.Builder(this)
                .setTitle(R.string.auth_worker_pending_title)
                .setMessage(message)
                .setPositiveButton(R.string.ok, (d, w) -> finish())
                .setCancelable(false)
                .show();
    }

    private void showError(String message) {
        errorBox.setText(message);
        errorBox.setVisibility(View.VISIBLE);
    }

    private String queryDisplayName(Uri uri) {
        String result = null;
        try (android.database.Cursor c = getContentResolver().query(uri, null, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) result = c.getString(idx);
            }
        } catch (Exception ignored) {}
        return result;
    }
}
