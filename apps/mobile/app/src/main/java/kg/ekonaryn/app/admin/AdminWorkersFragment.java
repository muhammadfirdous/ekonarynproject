package kg.ekonaryn.app.admin;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.List;
import java.util.Locale;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.WorkerStats;

public class AdminWorkersFragment extends Fragment {

    private SwipeRefreshLayout swipe;
    private LinearLayout container;
    private TextView textEmpty;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup parent,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_admin_workers, parent, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        container = v.findViewById(R.id.workersContainer);
        textEmpty = v.findViewById(R.id.textEmpty);

        Button btnPending = v.findViewById(R.id.btnPendingWorkers);
        if (btnPending != null) {
            btnPending.setOnClickListener(view ->
                    startActivity(new android.content.Intent(requireContext(), PendingWorkersActivity.class)));
        }

        swipe.setOnRefreshListener(this::load);
        load();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Refresh after returning from PendingWorkersActivity, since approving a
        // worker there changes the active-worker count rendered on this screen.
        load();
    }

    private void load() {
        swipe.setRefreshing(true);
        String token = EkoApp.get().auth().getToken();
        Async.run(() -> ApiClient.get().getWorkerStats(token),
                this::render,
                err -> render(null));
    }

    private void render(List<WorkerStats> items) {
        swipe.setRefreshing(false);
        container.removeAllViews();
        if (items == null || items.isEmpty()) {
            textEmpty.setVisibility(View.VISIBLE);
            return;
        }
        textEmpty.setVisibility(View.GONE);
        LayoutInflater inf = LayoutInflater.from(requireContext());
        for (WorkerStats ws : items) {
            View row = inf.inflate(R.layout.row_worker_stat, container, false);
            String name = ws.worker != null && ws.worker.name != null ? ws.worker.name : "—";
            ((TextView) row.findViewById(R.id.textName)).setText(name);
            ((TextView) row.findViewById(R.id.avatar))
                    .setText(name.isEmpty() ? "?" : name.substring(0, 1).toUpperCase(Locale.US));
            TextView phone = row.findViewById(R.id.textPhone);
            String phoneNum = ws.worker != null ? ws.worker.phone : null;
            phone.setText(phoneNum != null ? phoneNum : "");
            phone.setOnClickListener(view -> {
                if (!TextUtils.isEmpty(phoneNum)) {
                    Intent dial = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phoneNum));
                    startActivity(dial);
                }
            });
            ((TextView) row.findViewById(R.id.textCollections)).setText(String.valueOf(ws.totalCollections));
            ((TextView) row.findViewById(R.id.textWeight))
                    .setText(String.format(Locale.US, "%.0f", ws.totalWeightKg));
            ((TextView) row.findViewById(R.id.textTrips)).setText(String.valueOf(ws.totalTrips));
            container.addView(row);
        }
    }
}
