package kg.ekonaryn.app.worker;

import android.content.Context;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;

public class WorkerMainActivity extends AppCompatActivity {

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
        nav.inflateMenu(R.menu.worker_bottom_nav);

        nav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_today) {
                show(new TodayFragment(), getString(R.string.tab_today_title));
            } else if (id == R.id.nav_collect) {
                show(new CollectFragment(), getString(R.string.tab_collect_title));
            } else if (id == R.id.nav_mycollections) {
                show(new MyCollectionsFragment(), getString(R.string.tab_my_collections_title));
            } else if (id == R.id.nav_workerprofile) {
                show(new WorkerProfileFragment(), getString(R.string.tab_profile));
            } else {
                return false;
            }
            return true;
        });

        if (savedInstanceState == null) {
            nav.setSelectedItemId(R.id.nav_today);
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
