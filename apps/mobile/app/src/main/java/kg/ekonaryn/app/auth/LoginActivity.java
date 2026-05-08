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
import kg.ekonaryn.app.MainActivity;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.admin.AdminMainActivity;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.resident.ResidentMainActivity;
import kg.ekonaryn.app.worker.WorkerMainActivity;

public class LoginActivity extends AppCompatActivity {

    private EditText inputPhone, inputPassword;
    private Button btnLogin, btnLangRu, btnLangEn;
    private TextView errorBox, btnGoToRegister;

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(LocaleHelper.wrap(base));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        inputPhone = findViewById(R.id.inputPhone);
        inputPassword = findViewById(R.id.inputPassword);
        btnLogin = findViewById(R.id.btnLogin);
        btnLangRu = findViewById(R.id.btnLangRu);
        btnLangEn = findViewById(R.id.btnLangEn);
        errorBox = findViewById(R.id.errorBox);
        btnGoToRegister = findViewById(R.id.btnGoToRegister);

        renderRegisterPrompt();
        applyLangButtons();

        btnLangRu.setOnClickListener(v -> setLang("ru"));
        btnLangEn.setOnClickListener(v -> setLang("en"));

        btnLogin.setOnClickListener(v -> handleLogin());
        btnGoToRegister.setOnClickListener(v ->
                startActivity(new Intent(this, RegisterActivity.class)));
    }

    private void renderRegisterPrompt() {
        String prompt = getString(R.string.auth_no_account) + " ";
        String link = getString(R.string.auth_to_register);
        SpannableString span = new SpannableString(prompt + link);
        int linkStart = prompt.length();
        span.setSpan(new ForegroundColorSpan(ContextCompat.getColor(this, R.color.brand_primary)),
                linkStart, span.length(), Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
        span.setSpan(new StyleSpan(android.graphics.Typeface.BOLD),
                linkStart, span.length(), Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
        btnGoToRegister.setText(span);
    }

    private void setLang(String lang) {
        if (lang.equals(LocaleHelper.getStoredLang(this))) return;
        LocaleHelper.setStoredLang(this, lang);
        recreate();
    }

    private void applyLangButtons() {
        String current = LocaleHelper.getStoredLang(this);
        boolean isRu = "ru".equals(current);
        btnLangRu.setBackgroundResource(isRu ? R.drawable.bg_chip_active : android.R.color.transparent);
        btnLangRu.setTextColor(ContextCompat.getColor(this, isRu ? R.color.white : R.color.text_gray));
        btnLangEn.setBackgroundResource(!isRu ? R.drawable.bg_chip_active : android.R.color.transparent);
        btnLangEn.setTextColor(ContextCompat.getColor(this, !isRu ? R.color.white : R.color.text_gray));
    }

    private void handleLogin() {
        String phone = inputPhone.getText().toString().trim();
        String password = inputPassword.getText().toString();
        if (phone.isEmpty() || password.isEmpty()) {
            showError(getString(R.string.auth_fill_phone_pass));
            return;
        }
        errorBox.setVisibility(View.GONE);
        btnLogin.setEnabled(false);
        btnLogin.setText(R.string.auth_login_in);

        Async.run(
                () -> ApiClient.get().login(phone, password),
                resp -> {
                    btnLogin.setEnabled(true);
                    btnLogin.setText(R.string.auth_login);
                    if (resp == null || resp.user == null || resp.accessToken == null) {
                        showError(getString(R.string.auth_login_failed));
                        return;
                    }
                    EkoApp.get().auth().save(resp.accessToken, resp.user);
                    routeToHome(resp.user);
                },
                err -> {
                    btnLogin.setEnabled(true);
                    btnLogin.setText(R.string.auth_login);
                    String m = err.getMessage();
                    showError(m != null ? m : getString(R.string.auth_login_failed));
                }
        );
    }

    private void routeToHome(User user) {
        Intent next;
        if ("ADMIN".equals(user.role)) {
            next = new Intent(this, AdminMainActivity.class);
        } else if ("WORKER".equals(user.role)) {
            next = new Intent(this, WorkerMainActivity.class);
        } else {
            next = new Intent(this, ResidentMainActivity.class);
        }
        next.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(next);
        finish();
    }

    private void showError(String message) {
        errorBox.setText(message);
        errorBox.setVisibility(View.VISIBLE);
    }
}
