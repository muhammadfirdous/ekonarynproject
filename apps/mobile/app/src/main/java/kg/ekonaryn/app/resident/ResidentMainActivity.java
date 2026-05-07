package kg.ekonaryn.app.resident;

import android.content.Context;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;

public class ResidentMainActivity extends AppCompatActivity {

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(LocaleHelper.wrap(base));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main_host);

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        BottomNavigationView nav = findViewById(R.id.bottomNav);
        nav.inflateMenu(R.menu.resident_bottom_nav);

        nav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_home) {
                show(new HomeFragment(), getString(R.string.tab_home));
            } else if (id == R.id.nav_request) {
                show(new RequestFragment(), getString(R.string.tab_request_title));
            } else if (id == R.id.nav_history) {
                show(new HistoryFragment(), getString(R.string.tab_history_title));
            } else if (id == R.id.nav_schedule) {
                show(new ScheduleFragment(), getString(R.string.tab_schedule));
            } else if (id == R.id.nav_profile) {
                show(new ProfileFragment(), getString(R.string.tab_profile));
            } else {
                return false;
            }
            return true;
        });

        if (savedInstanceState == null) {
            nav.setSelectedItemId(R.id.nav_home);
        }
    }

    private void show(Fragment fragment, String title) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragmentHost, fragment)
                .commit();
        if (getSupportActionBar() != null) {
            getSupportActionBar().setTitle(title);
        }
    }
}
