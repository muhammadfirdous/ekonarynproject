package kg.ekonaryn.app.ui.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.List;

import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.models.Schedule;

public class ScheduleCardAdapter extends RecyclerView.Adapter<ScheduleCardAdapter.VH> {

    private final List<Schedule> data = new ArrayList<>();
    private final String[] daysShort;

    public ScheduleCardAdapter(String[] daysShort) {
        this.daysShort = daysShort;
    }

    public void setItems(List<Schedule> items) {
        data.clear();
        if (items != null) data.addAll(items);
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_schedule_card, parent, false);
        return new VH(v);
    }

    @Override
    public void onBindViewHolder(@NonNull VH h, int position) {
        Schedule s = data.get(position);
        int dow = (s.dayOfWeek >= 0 && s.dayOfWeek < daysShort.length) ? s.dayOfWeek : 0;
        h.day.setText(daysShort[dow]);
        h.time.setText(s.time != null ? s.time : "");
        h.area.setText(s.area != null ? s.area : "");
    }

    @Override
    public int getItemCount() {
        return data.size();
    }

    static class VH extends RecyclerView.ViewHolder {
        final TextView day, time, area;
        VH(@NonNull View itemView) {
            super(itemView);
            day = itemView.findViewById(R.id.textDay);
            time = itemView.findViewById(R.id.textTime);
            area = itemView.findViewById(R.id.textArea);
        }
    }
}
