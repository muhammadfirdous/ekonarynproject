package kg.ekonaryn.app;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.auth.LoginActivity;
import kg.ekonaryn.app.resident.ResidentMainActivity;
import kg.ekonaryn.app.worker.WorkerMainActivity;

/** Splash/router that routes to login or the role-specific home. */
public class MainActivity extends AppCompatActivity {

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(LocaleHelper.wrap(base));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        User user = EkoApp.get().auth().getUser();
        Intent next;
        if (user == null || EkoApp.get().auth().getToken() == null) {
            next = new Intent(this, LoginActivity.class);
        } else if ("WORKER".equals(user.role)) {
            next = new Intent(this, WorkerMainActivity.class);
        } else {
            next = new Intent(this, ResidentMainActivity.class);
        }
        next.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(next);
        finish();
    }
}
