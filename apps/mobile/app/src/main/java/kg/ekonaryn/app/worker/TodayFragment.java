package kg.ekonaryn.app.worker;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.ui.Localized;

public class TodayFragment extends Fragment {

    private SwipeRefreshLayout swipe;
    private TextView textName, textDate, routeEmpty, assignedEmpty;
    private LinearLayout routeContainer, assignedContainer;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_today, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        textName = v.findViewById(R.id.textName);
        textDate = v.findViewById(R.id.textDate);
        routeContainer = v.findViewById(R.id.routeContainer);
        routeEmpty = v.findViewById(R.id.routeEmpty);
        assignedContainer = v.findViewById(R.id.assignedContainer);
        assignedEmpty = v.findViewById(R.id.assignedEmpty);

        User user = EkoApp.get().auth().getUser();
        if (user != null) textName.setText(user.name);

        SimpleDateFormat fmt = new SimpleDateFormat("EEEE, d MMMM",
                new Locale(LocaleHelper.getStoredLang(requireContext())));
        textDate.setText(fmt.format(new Date()));

        swipe.setOnRefreshListener(this::load);
        load();
    }

    private void load() {
        swipe.setRefreshing(true);
        // We don't currently have a routes endpoint binding here — the route panel is
        // populated only when an admin assigns one. Show "no route" until backend wires it.
        renderRoute(false);

        String token = EkoApp.get().auth().getToken();
        Async.run(() -> ApiClient.get().getRequests(token, "ASSIGNED", 20),
                this::renderAssigned,
                err -> renderAssigned(new ArrayList<>()));
    }

    private void renderRoute(boolean hasRoute) {
        swipe.setRefreshing(false);
        if (!hasRoute) {
            routeContainer.removeAllViews();
            routeContainer.setVisibility(View.GONE);
            routeEmpty.setVisibility(View.VISIBLE);
        } else {
            routeContainer.setVisibility(View.VISIBLE);
            routeEmpty.setVisibility(View.GONE);
        }
    }

    private void renderAssigned(List<PickupRequest> items) {
        swipe.setRefreshing(false);
        assignedContainer.removeAllViews();
        if (items == null || items.isEmpty()) {
            assignedContainer.setVisibility(View.GONE);
            assignedEmpty.setVisibility(View.VISIBLE);
            return;
        }
        assignedEmpty.setVisibility(View.GONE);
        assignedContainer.setVisibility(View.VISIBLE);

        LayoutInflater inf = LayoutInflater.from(requireContext());
        for (PickupRequest req : items) {
            View row = inf.inflate(R.layout.row_assigned_request, assignedContainer, false);
            ((TextView) row.findViewById(R.id.textName)).setText(req.resident != null ? req.resident.name : "");
            TextView phone = row.findViewById(R.id.textPhone);
            phone.setText(req.resident != null ? req.resident.phone : "");
            phone.setOnClickListener(v -> {
                if (req.resident != null && !TextUtils.isEmpty(req.resident.phone)) {
                    Intent dial = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + req.resident.phone));
                    startActivity(dial);
                }
            });
            String matLine = Localized.materialName(requireContext(), req.material)
                    + " · ~" + req.estimatedQty + " " + getString(R.string.kg);
            ((TextView) row.findViewById(R.id.textMaterialQty)).setText(matLine);
            ((TextView) row.findViewById(R.id.textAddress)).setText(req.address != null ? req.address : "");
            assignedContainer.addView(row);
        }
    }
}
