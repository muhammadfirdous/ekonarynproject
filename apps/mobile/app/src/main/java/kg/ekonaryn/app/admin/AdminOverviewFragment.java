package kg.ekonaryn.app.admin;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.List;
import java.util.Locale;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.Overview;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.ui.Localized;

public class AdminOverviewFragment extends Fragment {

    private SwipeRefreshLayout swipe;
    private TextView textName;
    private TextView statCollections, statWeight, statRevenue, statPending, statWorkers, statResidents;
    private LinearLayout recentContainer;
    private TextView recentEmpty, btnSeeAll;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_admin_overview, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        textName = v.findViewById(R.id.textName);
        statCollections = v.findViewById(R.id.statCollections);
        statWeight = v.findViewById(R.id.statWeight);
        statRevenue = v.findViewById(R.id.statRevenue);
        statPending = v.findViewById(R.id.statPending);
        statWorkers = v.findViewById(R.id.statWorkers);
        statResidents = v.findViewById(R.id.statResidents);
        recentContainer = v.findViewById(R.id.recentContainer);
        recentEmpty = v.findViewById(R.id.recentEmpty);
        btnSeeAll = v.findViewById(R.id.btnSeeAll);

        User user = EkoApp.get().auth().getUser();
        if (user != null) textName.setText(user.name);

        btnSeeAll.setOnClickListener(view -> {
            if (getActivity() instanceof AdminMainActivity) {
                ((AdminMainActivity) getActivity()).selectRequestsTab();
            }
        });

        swipe.setOnRefreshListener(this::load);
        load();
    }

    private void load() {
        swipe.setRefreshing(true);
        String token = EkoApp.get().auth().getToken();

        Async.run(() -> ApiClient.get().getOverview(token),
                this::renderStats,
                err -> renderStats(null));

        Async.run(() -> ApiClient.get().getRequests(token, null, 5),
                this::renderRecent,
                err -> renderRecent(null));
    }

    private void renderStats(Overview o) {
        if (o == null) {
            swipe.setRefreshing(false);
            return;
        }
        statCollections.setText(String.valueOf(o.totalCollections));
        statWeight.setText(String.format(Locale.US, "%.0f", o.totalWeightKg));
        statRevenue.setText(String.format(Locale.US, "%.0f", o.totalRevenue));
        statPending.setText(String.valueOf(o.pendingRequests));
        statWorkers.setText(String.valueOf(o.activeWorkers));
        statResidents.setText(String.valueOf(o.totalResidents));
    }

    private void renderRecent(List<PickupRequest> items) {
        swipe.setRefreshing(false);
        recentContainer.removeAllViews();
        if (items == null || items.isEmpty()) {
            recentContainer.setVisibility(View.GONE);
            recentEmpty.setVisibility(View.VISIBLE);
            return;
        }
        recentEmpty.setVisibility(View.GONE);
        recentContainer.setVisibility(View.VISIBLE);

        LayoutInflater inf = LayoutInflater.from(requireContext());
        for (PickupRequest r : items) {
            View row = inf.inflate(R.layout.item_admin_request, recentContainer, false);
            String residentName = r.resident != null && r.resident.name != null ? r.resident.name : "—";
            ((TextView) row.findViewById(R.id.textResident)).setText(residentName);
            ((TextView) row.findViewById(R.id.avatar))
                    .setText(residentName.isEmpty() ? "?" : residentName.substring(0, 1).toUpperCase(Locale.US));
            String matLine = Localized.materialName(requireContext(), r.material)
                    + " · " + r.estimatedQty + " " + getString(R.string.kg);
            ((TextView) row.findViewById(R.id.textMaterial)).setText(matLine);
            ((TextView) row.findViewById(R.id.textAddress)).setText(r.address != null ? r.address : "");
            ((TextView) row.findViewById(R.id.textQty)).setText("");
            ((TextView) row.findViewById(R.id.textDate)).setText(Localized.shortDate(requireContext(), r.createdAt));

            TextView badge = row.findViewById(R.id.badgeStatus);
            badge.setText(Localized.statusLabelRes(r.status));
            badge.setBackgroundResource(Localized.statusBgRes(r.status));
            badge.setTextColor(ContextCompat.getColor(requireContext(), Localized.statusFgColorRes(r.status)));

            recentContainer.addView(row);
        }
    }
}
