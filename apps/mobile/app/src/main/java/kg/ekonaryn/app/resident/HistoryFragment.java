package kg.ekonaryn.app.resident;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.ui.adapters.RequestAdapter;

public class HistoryFragment extends Fragment {

    private SwipeRefreshLayout swipe;
    private RecyclerView recycler;
    private View emptyView;
    private ChipGroup filterChips;
    private RequestAdapter adapter;

    private final Map<Integer, String> chipIdToFilter = new HashMap<>();
    private String currentFilter = "";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_history, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        recycler = v.findViewById(R.id.recycler);
        emptyView = v.findViewById(R.id.emptyView);
        filterChips = v.findViewById(R.id.filterChips);

        adapter = new RequestAdapter();
        recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        recycler.setAdapter(adapter);

        addFilterChip(getString(R.string.all), "");
        addFilterChip(getString(R.string.status_summary_pending), "PENDING");
        addFilterChip(getString(R.string.status_assigned), "ASSIGNED");
        addFilterChip(getString(R.string.status_completed), "COMPLETED");
        addFilterChip(getString(R.string.status_cancelled), "CANCELLED");

        filterChips.setOnCheckedStateChangeListener((group, checkedIds) -> {
            String f = checkedIds.isEmpty() ? "" : chipIdToFilter.get(checkedIds.get(0));
            currentFilter = f != null ? f : "";
            load();
        });

        swipe.setOnRefreshListener(this::load);
        load();
    }

    private void addFilterChip(String label, String filterValue) {
        Chip chip = new Chip(requireContext());
        chip.setId(View.generateViewId());
        chip.setText(label);
        chip.setCheckable(true);
        if (filterValue.isEmpty()) chip.setChecked(true);
        filterChips.addView(chip);
        chipIdToFilter.put(chip.getId(), filterValue);
    }

    private void load() {
        swipe.setRefreshing(true);
        String token = EkoApp.get().auth().getToken();
        Async.run(() -> ApiClient.get().getRequests(token, currentFilter, 50),
                this::render,
                err -> render(new ArrayList<>()));
    }

    private void render(List<PickupRequest> items) {
        swipe.setRefreshing(false);
        if (items == null || items.isEmpty()) {
            emptyView.setVisibility(View.VISIBLE);
            recycler.setVisibility(View.GONE);
        } else {
            emptyView.setVisibility(View.GONE);
            recycler.setVisibility(View.VISIBLE);
            adapter.setItems(items);
        }
    }
}
