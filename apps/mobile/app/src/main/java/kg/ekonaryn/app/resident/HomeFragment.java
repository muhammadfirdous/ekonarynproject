package kg.ekonaryn.app.resident;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.material.bottomnavigation.BottomNavigationView;

import java.util.ArrayList;
import java.util.List;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.api.models.Schedule;
import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.ui.adapters.RequestAdapter;
import kg.ekonaryn.app.ui.adapters.ScheduleCardAdapter;

public class HomeFragment extends Fragment {

    private SwipeRefreshLayout swipe;
    private TextView textName, textPoints, countPending, countAssigned, countCompleted, scheduleEmpty;
    private RecyclerView recyclerSchedule, recyclerRequests;
    private View requestsEmpty;
    private Button btnNewRequest, btnEmptyCreate;
    private TextView btnSeeAll;

    private ScheduleCardAdapter scheduleAdapter;
    private RequestAdapter requestAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_home, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        textName = v.findViewById(R.id.textName);
        textPoints = v.findViewById(R.id.textPoints);
        countPending = v.findViewById(R.id.countPending);
        countAssigned = v.findViewById(R.id.countAssigned);
        countCompleted = v.findViewById(R.id.countCompleted);
        scheduleEmpty = v.findViewById(R.id.scheduleEmpty);
        recyclerSchedule = v.findViewById(R.id.recyclerSchedule);
        recyclerRequests = v.findViewById(R.id.recyclerRequests);
        requestsEmpty = v.findViewById(R.id.requestsEmpty);
        btnNewRequest = v.findViewById(R.id.btnNewRequest);
        btnEmptyCreate = v.findViewById(R.id.btnEmptyCreate);
        btnSeeAll = v.findViewById(R.id.btnSeeAll);

        String[] daysShort = getResources().getStringArray(R.array.days_short);
        scheduleAdapter = new ScheduleCardAdapter(daysShort);
        recyclerSchedule.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        recyclerSchedule.setAdapter(scheduleAdapter);

        requestAdapter = new RequestAdapter();
        recyclerRequests.setLayoutManager(new LinearLayoutManager(requireContext()));
        recyclerRequests.setAdapter(requestAdapter);
        recyclerRequests.setNestedScrollingEnabled(false);

        User user = EkoApp.get().auth().getUser();
        if (user != null) {
            textName.setText(user.name);
            textPoints.setText(String.valueOf(user.points));
        }

        btnNewRequest.setOnClickListener(view -> goToTab(R.id.nav_request));
        btnEmptyCreate.setOnClickListener(view -> goToTab(R.id.nav_request));
        btnSeeAll.setOnClickListener(view -> goToTab(R.id.nav_history));

        swipe.setOnRefreshListener(this::loadAll);
        loadAll();
    }

    private void goToTab(int navId) {
        if (getActivity() == null) return;
        BottomNavigationView nav = getActivity().findViewById(R.id.bottomNav);
        if (nav != null) nav.setSelectedItemId(navId);
    }

    private void loadAll() {
        swipe.setRefreshing(true);
        String token = EkoApp.get().auth().getToken();

        Async.run(() -> ApiClient.get().getSchedule(),
                this::renderSchedule,
                err -> { swipe.setRefreshing(false); renderSchedule(new ArrayList<>()); });

        Async.run(() -> ApiClient.get().getRequests(token, null, 10),
                this::renderRequests,
                err -> { swipe.setRefreshing(false); renderRequests(new ArrayList<>()); });
    }

    private void renderSchedule(List<Schedule> items) {
        swipe.setRefreshing(false);
        if (items == null || items.isEmpty()) {
            scheduleEmpty.setVisibility(View.VISIBLE);
            recyclerSchedule.setVisibility(View.GONE);
            return;
        }
        scheduleEmpty.setVisibility(View.GONE);
        recyclerSchedule.setVisibility(View.VISIBLE);
        scheduleAdapter.setItems(items.subList(0, Math.min(5, items.size())));
    }

    private void renderRequests(List<PickupRequest> items) {
        swipe.setRefreshing(false);
        int pending = 0, assigned = 0, completed = 0;
        if (items != null) {
            for (PickupRequest r : items) {
                if ("PENDING".equals(r.status)) pending++;
                else if ("ASSIGNED".equals(r.status)) assigned++;
                else if ("COMPLETED".equals(r.status)) completed++;
            }
        }
        countPending.setText(String.valueOf(pending));
        countAssigned.setText(String.valueOf(assigned));
        countCompleted.setText(String.valueOf(completed));

        if (items == null || items.isEmpty()) {
            requestsEmpty.setVisibility(View.VISIBLE);
            recyclerRequests.setVisibility(View.GONE);
        } else {
            requestsEmpty.setVisibility(View.GONE);
            recyclerRequests.setVisibility(View.VISIBLE);
            requestAdapter.setItems(items.subList(0, Math.min(5, items.size())));
        }
    }
}
