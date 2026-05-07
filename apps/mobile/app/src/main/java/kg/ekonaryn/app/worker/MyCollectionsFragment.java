package kg.ekonaryn.app.worker;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.Collection;
import kg.ekonaryn.app.ui.adapters.CollectionAdapter;

public class MyCollectionsFragment extends Fragment {

    private SwipeRefreshLayout swipe;
    private RecyclerView recycler;
    private TextView textTotalCount, textTotalWeight, emptyView;
    private CollectionAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_mycollections, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        recycler = v.findViewById(R.id.recycler);
        textTotalCount = v.findViewById(R.id.textTotalCount);
        textTotalWeight = v.findViewById(R.id.textTotalWeight);
        emptyView = v.findViewById(R.id.emptyView);

        adapter = new CollectionAdapter();
        recycler.setLayoutManager(new LinearLayoutManager(requireContext()));
        recycler.setAdapter(adapter);

        swipe.setOnRefreshListener(this::load);
        load();
    }

    private void load() {
        swipe.setRefreshing(true);
        String token = EkoApp.get().auth().getToken();
        Async.run(() -> ApiClient.get().getCollections(token, 50),
                this::render,
                err -> render(new ArrayList<>()));
    }

    private void render(List<Collection> items) {
        swipe.setRefreshing(false);
        double total = 0;
        if (items != null) {
            for (Collection c : items) total += c.actualWeightKg;
        }
        textTotalCount.setText(items != null ? String.valueOf(items.size()) : "0");
        textTotalWeight.setText(String.format(Locale.US, "%.1f %s", total, getString(R.string.kg)));
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
