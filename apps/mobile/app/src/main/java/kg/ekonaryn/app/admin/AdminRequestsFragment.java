package kg.ekonaryn.app.admin;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.List;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.PickupRequest;

public class AdminRequestsFragment extends Fragment {

    private static final String[] FILTERS = {null, "PENDING", "ASSIGNED", "COMPLETED", "CANCELLED"};
    private static final int[] FILTER_LABELS = {
            R.string.admin_filter_all,
            R.string.admin_filter_pending,
            R.string.admin_filter_assigned,
            R.string.admin_filter_completed,
            R.string.admin_filter_cancelled
    };

    private SwipeRefreshLayout swipe;
    private RecyclerView recycler;
    private TextView textEmpty;
    private LinearLayout filterRow;
    private AdminRequestsAdapter adapter;

    private int activeFilter = 0;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_admin_requests, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        recycler = v.findViewById(R.id.recycler);
        textEmpty = v.findViewById(R.id.textEmpty);
        filterRow = v.findViewById(R.id.filterRow);

        adapter = new AdminRequestsAdapter(this::showActions);
        recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        recycler.setAdapter(adapter);

        renderFilterChips();
        swipe.setOnRefreshListener(this::load);
        load();
    }

    private void renderFilterChips() {
        filterRow.removeAllViews();
        LayoutInflater inf = LayoutInflater.from(requireContext());
        for (int i = 0; i < FILTERS.length; i++) {
            final int idx = i;
            TextView chip = new TextView(requireContext());
            chip.setText(FILTER_LABELS[i]);
            chip.setTextSize(12f);
            chip.setPadding(dp(14), dp(7), dp(14), dp(7));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.setMarginEnd(dp(8));
            chip.setLayoutParams(lp);
            updateChipStyle(chip, idx == activeFilter);
            chip.setOnClickListener(view -> {
                activeFilter = idx;
                for (int c = 0; c < filterRow.getChildCount(); c++) {
                    updateChipStyle((TextView) filterRow.getChildAt(c), c == activeFilter);
                }
                load();
            });
            filterRow.addView(chip);
        }
    }

    private void updateChipStyle(TextView chip, boolean active) {
        chip.setBackgroundResource(active ? R.drawable.bg_chip_active : R.drawable.bg_chip_inactive);
        chip.setTextColor(ContextCompat.getColor(requireContext(),
                active ? R.color.white : R.color.text_gray));
        chip.setTypeface(chip.getTypeface(), active ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL);
    }

    private int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density);
    }

    private void load() {
        swipe.setRefreshing(true);
        String token = EkoApp.get().auth().getToken();
        String filter = FILTERS[activeFilter];
        Async.run(() -> ApiClient.get().getRequests(token, filter, 50),
                this::renderItems,
                err -> renderItems(null));
    }

    private void renderItems(List<PickupRequest> items) {
        swipe.setRefreshing(false);
        adapter.setItems(items);
        boolean empty = items == null || items.isEmpty();
        textEmpty.setVisibility(empty ? View.VISIBLE : View.GONE);
        recycler.setVisibility(empty ? View.GONE : View.VISIBLE);
    }

    private void showActions(PickupRequest req) {
        // Show actions appropriate for current status.
        java.util.List<String> labels = new java.util.ArrayList<>();
        java.util.List<String> targets = new java.util.ArrayList<>();
        switch (req.status != null ? req.status : "PENDING") {
            case "PENDING":
                labels.add(getString(R.string.admin_action_assign));   targets.add("ASSIGNED");
                labels.add(getString(R.string.admin_action_cancel));   targets.add("CANCELLED");
                break;
            case "ASSIGNED":
                labels.add(getString(R.string.admin_action_complete)); targets.add("COMPLETED");
                labels.add(getString(R.string.admin_action_pending));  targets.add("PENDING");
                labels.add(getString(R.string.admin_action_cancel));   targets.add("CANCELLED");
                break;
            case "COMPLETED":
                labels.add(getString(R.string.admin_action_pending));  targets.add("PENDING");
                break;
            case "CANCELLED":
                labels.add(getString(R.string.admin_action_pending));  targets.add("PENDING");
                break;
        }
        if (labels.isEmpty()) return;

        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.admin_request_actions)
                .setItems(labels.toArray(new String[0]), (dialog, which) -> {
                    String target = targets.get(which);
                    updateStatus(req, target);
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void updateStatus(PickupRequest req, String target) {
        String token = EkoApp.get().auth().getToken();
        Async.run(() -> ApiClient.get().updateRequestStatus(token, req.id, target),
                updated -> {
                    Toast.makeText(requireContext(), R.string.admin_status_updated, Toast.LENGTH_SHORT).show();
                    load();
                },
                err -> Toast.makeText(requireContext(), R.string.admin_status_failed, Toast.LENGTH_SHORT).show());
    }
}
