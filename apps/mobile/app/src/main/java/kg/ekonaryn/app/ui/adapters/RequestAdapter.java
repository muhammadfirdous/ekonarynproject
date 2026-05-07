package kg.ekonaryn.app.ui.adapters;

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

import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.ui.Localized;

public class RequestAdapter extends RecyclerView.Adapter<RequestAdapter.VH> {

    private final List<PickupRequest> data = new ArrayList<>();

    public void setItems(List<PickupRequest> items) {
        data.clear();
        if (items != null) data.addAll(items);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_request, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Context ctx = h.itemView.getContext();
        PickupRequest r = data.get(position);
        h.material.setText(Localized.materialName(ctx, r.material));
        h.address.setText(r.address != null ? r.address : "");
        h.qty.setText(ctx.getString(R.string.kg_qty_format, r.estimatedQty));
        h.date.setText(Localized.shortDate(ctx, r.createdAt));

        h.badge.setText(Localized.statusLabelRes(r.status));
        h.badge.setBackgroundResource(Localized.statusBgRes(r.status));
        h.badge.setTextColor(ContextCompat.getColor(ctx, Localized.statusFgColorRes(r.status)));

        if (r.collection != null) {
            String fmt = ctx.getString(R.string.history_collected) + ": "
                    + String.format(java.util.Locale.US, "%.1f", r.collection.actualWeightKg)
                    + " " + ctx.getString(R.string.kg);
            h.collected.setText(fmt);
            h.collected.setVisibility(View.VISIBLE);
        } else {
            h.collected.setVisibility(View.GONE);
        }

        if (r.notes != null && !r.notes.trim().isEmpty()) {
            h.notes.setText("💬 " + r.notes);
            h.notes.setVisibility(View.VISIBLE);
        } else {
            h.notes.setVisibility(View.GONE);
        }
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView material, address, qty, date, collected, notes, badge;
        VH(@NonNull View itemView) {
            super(itemView);
            material = itemView.findViewById(R.id.textMaterial);
            address = itemView.findViewById(R.id.textAddress);
            qty = itemView.findViewById(R.id.textQty);
            date = itemView.findViewById(R.id.textDate);
            collected = itemView.findViewById(R.id.textCollected);
            notes = itemView.findViewById(R.id.textNotes);
            badge = itemView.findViewById(R.id.badgeStatus);
        }
    }
}
