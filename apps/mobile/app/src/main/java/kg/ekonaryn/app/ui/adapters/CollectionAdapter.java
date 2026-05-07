package kg.ekonaryn.app.ui.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.models.Collection;
import kg.ekonaryn.app.ui.Localized;

public class CollectionAdapter extends RecyclerView.Adapter<CollectionAdapter.VH> {

    private final List<Collection> data = new ArrayList<>();

    public void setItems(List<Collection> items) {
        data.clear();
        if (items != null) data.addAll(items);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_collection, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Context ctx = h.itemView.getContext();
        Collection c = data.get(position);
        h.material.setText(Localized.materialName(ctx, c.material));
        h.weight.setText(String.format(Locale.US, "%.1f %s", c.actualWeightKg, ctx.getString(R.string.kg)));
        String resName = c.request != null && c.request.resident != null ? c.request.resident.name : "";
        h.resident.setText(ctx.getString(R.string.myc_resident) + ": " + resName);
        h.date.setText(Localized.longDate(ctx, c.collectedAt));
        if (c.notes != null && !c.notes.trim().isEmpty()) {
            h.notes.setText(c.notes);
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
        final TextView material, weight, resident, date, notes;
        VH(@NonNull View itemView) {
            super(itemView);
            material = itemView.findViewById(R.id.textMaterial);
            weight = itemView.findViewById(R.id.textWeight);
            resident = itemView.findViewById(R.id.textResident);
            date = itemView.findViewById(R.id.textDate);
            notes = itemView.findViewById(R.id.textNotes);
        }
    }
}
