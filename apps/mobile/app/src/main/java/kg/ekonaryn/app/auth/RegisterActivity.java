package kg.ekonaryn.app.auth;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.text.Spannable;
import android.text.SpannableString;
import android.text.style.ForegroundColorSpan;
import android.text.style.StyleSpan;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.resident.ResidentMainActivity;

public class RegisterActivity extends AppCompatActivity {

    private EditText inputName, inputPhone, inputPassword, inputAddress;
    private Button btnRegister;
    private TextView errorBox, btnGoToLogin;

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
        inputPassword = findViewById(R.id.inputPassword);
        inputAddress = findViewById(R.id.inputAddress);
        btnRegister = findViewById(R.id.btnRegister);
        errorBox = findViewById(R.id.errorBox);
        btnGoToLogin = findViewById(R.id.btnGoToLogin);

        renderLoginPrompt();
        inputPhone.setText("+996");
        inputPhone.setSelection(inputPhone.getText().length());

        btnRegister.setOnClickListener(v -> handleRegister());
        btnGoToLogin.setOnClickListener(v -> finish());
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
        String password = inputPassword.getText().toString();
        String address = inputAddress.getText().toString().trim();

        if (name.isEmpty() || phone.isEmpty() || password.isEmpty()) {
            showError(getString(R.string.auth_fill_phone_pass));
            return;
        }
        errorBox.setVisibility(View.GONE);
        btnRegister.setEnabled(false);
        btnRegister.setText(R.string.auth_registering);

        Async.run(
                () -> ApiClient.get().register(name, phone, password, address.isEmpty() ? null : address),
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

    private void showError(String message) {
        errorBox.setText(message);
        errorBox.setVisibility(View.VISIBLE);
    }
}
