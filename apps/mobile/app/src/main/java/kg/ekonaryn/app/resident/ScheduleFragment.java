package kg.ekonaryn.app.resident;

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

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.ApiClient;
import kg.ekonaryn.app.api.Async;
import kg.ekonaryn.app.api.models.Schedule;

public class ScheduleFragment extends Fragment {

    private SwipeRefreshLayout swipe;
    private LinearLayout container;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_schedule, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        swipe = v.findViewById(R.id.swipeRefresh);
        container = v.findViewById(R.id.scheduleContainer);
        swipe.setOnRefreshListener(this::load);
        load();
    }

    private void load() {
        swipe.setRefreshing(true);
        Async.run(() -> ApiClient.get().getSchedule(),
                this::render,
                err -> render(new ArrayList<>()));
    }

    private void render(List<Schedule> items) {
        swipe.setRefreshing(false);
        container.removeAllViews();
        LayoutInflater inflater = LayoutInflater.from(requireContext());
        String[] daysFull = getResources().getStringArray(R.array.days_full);

        if (items == null || items.isEmpty()) {
            TextView empty = new TextView(requireContext());
            empty.setText(R.string.schedule_loading);
            empty.setTextColor(ContextCompat.getColor(requireContext(), R.color.text_gray));
            empty.setGravity(android.view.Gravity.CENTER);
            empty.setPadding(0, 80, 0, 80);
            container.addView(empty);
            container.addView(inflater.inflate(R.layout.section_schedule_help, container, false));
            return;
        }

        Map<Integer, List<Schedule>> byDay = new HashMap<>();
        for (Schedule s : items) {
            byDay.computeIfAbsent(s.dayOfWeek, k -> new ArrayList<>()).add(s);
        }

        for (int day = 0; day < daysFull.length; day++) {
            List<Schedule> daySchedule = byDay.get(day);
            if (daySchedule == null || daySchedule.isEmpty()) continue;
            Collections.sort(daySchedule, (a, b) ->
                    (a.time != null ? a.time : "").compareTo(b.time != null ? b.time : ""));

            View section = inflater.inflate(R.layout.section_schedule_day, container, false);
            TextView header = section.findViewById(R.id.dayHeader);
            LinearLayout rows = section.findViewById(R.id.dayRows);
            header.setText(daysFull[day]);

            boolean first = true;
            for (Schedule s : daySchedule) {
                View row = inflater.inflate(R.layout.row_schedule_entry, rows, false);
                ((TextView) row.findViewById(R.id.textArea)).setText(s.area != null ? s.area : "");
                ((TextView) row.findViewById(R.id.textTime)).setText(s.time != null ? s.time : "");
                if (!first) {
                    View div = new View(requireContext());
                    div.setLayoutParams(new LinearLayout.LayoutParams(
                            LinearLayout.LayoutParams.MATCH_PARENT, 1));
                    div.setBackgroundColor(0xFFF0F0F0);
                    rows.addView(div);
                }
                rows.addView(row);
                first = false;
            }
            container.addView(section);
        }

        container.addView(inflater.inflate(R.layout.section_schedule_help, container, false));
    }
}
