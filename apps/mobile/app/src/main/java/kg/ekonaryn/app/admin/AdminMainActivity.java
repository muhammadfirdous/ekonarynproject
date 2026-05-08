package kg.ekonaryn.app.admin;

import android.content.Context;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;

public class AdminMainActivity extends AppCompatActivity {

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
        nav.inflateMenu(R.menu.admin_bottom_nav);

        nav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_overview) {
                show(new AdminOverviewFragment(), getString(R.string.tab_overview_title));
            } else if (id == R.id.nav_requests_admin) {
                show(new AdminRequestsFragment(), getString(R.string.tab_requests_title));
            } else if (id == R.id.nav_workers) {
                show(new AdminWorkersFragment(), getString(R.string.tab_workers_title));
            } else if (id == R.id.nav_adminprofile) {
                show(new AdminProfileFragment(), getString(R.string.tab_profile));
            } else {
                return false;
            }
            return true;
        });

        if (savedInstanceState == null) {
            nav.setSelectedItemId(R.id.nav_overview);
        }
    }

    public void selectRequestsTab() {
        BottomNavigationView nav = findViewById(R.id.bottomNav);
        if (nav != null) nav.setSelectedItemId(R.id.nav_requests_admin);
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
