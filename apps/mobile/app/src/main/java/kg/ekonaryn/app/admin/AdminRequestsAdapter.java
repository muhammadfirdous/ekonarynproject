package kg.ekonaryn.app.admin;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.ui.Localized;

public class AdminRequestsAdapter extends RecyclerView.Adapter<AdminRequestsAdapter.VH> {

    public interface OnClick {
        void onRequestClicked(PickupRequest request);
    }

    private final List<PickupRequest> data = new ArrayList<>();
    private final OnClick listener;

    public AdminRequestsAdapter(OnClick listener) {
        this.listener = listener;
    }

    public void setItems(List<PickupRequest> items) {
        data.clear();
        if (items != null) data.addAll(items);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_admin_request, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Context ctx = h.itemView.getContext();
        PickupRequest r = data.get(position);

        String residentName = r.resident != null && r.resident.name != null ? r.resident.name : "—";
        h.resident.setText(residentName);
        h.avatar.setText(residentName.isEmpty() ? "?" : residentName.substring(0, 1).toUpperCase(Locale.US));

        String matLine = Localized.materialName(ctx, r.material)
                + " · " + r.estimatedQty + " " + ctx.getString(R.string.kg);
        h.material.setText(matLine);
        h.address.setText(r.address != null ? r.address : "");
        h.qty.setText(r.resident != null && r.resident.phone != null ? r.resident.phone : "");
        h.date.setText(Localized.shortDate(ctx, r.createdAt));

        h.badge.setText(Localized.statusLabelRes(r.status));
        h.badge.setBackgroundResource(Localized.statusBgRes(r.status));
        h.badge.setTextColor(ContextCompat.getColor(ctx, Localized.statusFgColorRes(r.status)));

        h.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onRequestClicked(r);
        });
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView resident, avatar, material, address, qty, date, badge;
        VH(@NonNull View itemView) {
            super(itemView);
            resident = itemView.findViewById(R.id.textResident);
            avatar = itemView.findViewById(R.id.avatar);
            material = itemView.findViewById(R.id.textMaterial);
            address = itemView.findViewById(R.id.textAddress);
            qty = itemView.findViewById(R.id.textQty);
            date = itemView.findViewById(R.id.textDate);
            badge = itemView.findViewById(R.id.badgeStatus);
        }
    }
}
