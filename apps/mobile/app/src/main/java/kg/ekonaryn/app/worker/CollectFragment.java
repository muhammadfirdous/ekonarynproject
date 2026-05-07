package kg.ekonaryn.app.worker;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

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
import kg.ekonaryn.app.api.models.Material;
import kg.ekonaryn.app.api.models.PickupRequest;
import kg.ekonaryn.app.ui.Localized;

public class CollectFragment extends Fragment {

    private LinearLayout successPanel, formPanel;
    private ChipGroup requestChips, materialChips;
    private View noAssignedText;
    private EditText inputWeight, inputNotes;
    private Button btnSubmit, btnAnother;

    private final Map<Integer, String> requestChipMap = new HashMap<>();
    private final Map<Integer, String> materialChipMap = new HashMap<>();
    private final Map<String, PickupRequest> requestById = new HashMap<>();
    private final Map<String, String> materialIdByNameRu = new HashMap<>();

    private String selectedRequestId;
    private String selectedMaterialId;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_collect, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        successPanel = v.findViewById(R.id.successPanel);
        formPanel = v.findViewById(R.id.formPanel);
        requestChips = v.findViewById(R.id.requestChips);
        materialChips = v.findViewById(R.id.materialChips);
        noAssignedText = v.findViewById(R.id.noAssignedText);
        inputWeight = v.findViewById(R.id.inputWeight);
        inputNotes = v.findViewById(R.id.inputNotes);
        btnSubmit = v.findViewById(R.id.btnSubmit);
        btnAnother = v.findViewById(R.id.btnAnother);

        requestChips.setOnCheckedStateChangeListener((g, ids) -> {
            if (ids.isEmpty()) { selectedRequestId = null; return; }
            selectedRequestId = requestChipMap.get(ids.get(0));
            // auto-pick the matching material chip if we have one for this request
            PickupRequest pr = selectedRequestId != null ? requestById.get(selectedRequestId) : null;
            if (pr != null && pr.material != null) {
                String matId = materialIdByNameRu.get(pr.material.nameRu);
                if (matId != null) {
                    for (Map.Entry<Integer, String> e : materialChipMap.entrySet()) {
                        if (matId.equals(e.getValue())) {
                            View chip = materialChips.findViewById(e.getKey());
                            if (chip instanceof Chip) ((Chip) chip).setChecked(true);
                            selectedMaterialId = matId;
                            break;
                        }
                    }
                }
                inputWeight.setHint(getString(R.string.estimate_format, String.valueOf(pr.estimatedQty)));
            }
        });
        materialChips.setOnCheckedStateChangeListener((g, ids) -> {
            selectedMaterialId = ids.isEmpty() ? null : materialChipMap.get(ids.get(0));
        });

        btnSubmit.setOnClickListener(view -> handleSubmit());
        btnAnother.setOnClickListener(view -> resetForm());

        load();
    }

    private void load() {
        String token = EkoApp.get().auth().getToken();
        Async.run(() -> ApiClient.get().getRequests(token, "ASSIGNED", 50),
                this::renderRequests, err -> renderRequests(new ArrayList<>()));
        Async.run(() -> ApiClient.get().getMaterials(),
                this::renderMaterials, err -> renderMaterials(new ArrayList<>()));
    }

    private void renderRequests(List<PickupRequest> items) {
        requestChips.removeAllViews();
        requestChipMap.clear();
        requestById.clear();
        if (items == null || items.isEmpty()) {
            noAssignedText.setVisibility(View.VISIBLE);
            return;
        }
        noAssignedText.setVisibility(View.GONE);
        for (PickupRequest r : items) {
            Chip chip = new Chip(requireContext());
            chip.setId(View.generateViewId());
            String label = (r.resident != null ? r.resident.name : "?")
                    + " · " + Localized.materialName(requireContext(), r.material)
                    + " · ~" + r.estimatedQty + " " + getString(R.string.kg);
            chip.setText(label);
            chip.setCheckable(true);
            chip.setChipBackgroundColorResource(R.color.white);
            requestChips.addView(chip);
            requestChipMap.put(chip.getId(), r.id);
            requestById.put(r.id, r);
        }
    }

    private void renderMaterials(List<Material> items) {
        materialChips.removeAllViews();
        materialChipMap.clear();
        materialIdByNameRu.clear();
        if (items == null) return;
        for (Material m : items) {
            Chip chip = new Chip(requireContext());
            chip.setId(View.generateViewId());
            chip.setText(Localized.materialName(requireContext(), m));
            chip.setCheckable(true);
            chip.setChipBackgroundColorResource(R.color.white);
            materialChips.addView(chip);
            materialChipMap.put(chip.getId(), m.id);
            if (m.nameRu != null) materialIdByNameRu.put(m.nameRu, m.id);
        }
    }

    private void handleSubmit() {
        String weightText = inputWeight.getText().toString().trim();
        String notes = inputNotes.getText().toString().trim();
        if (selectedRequestId == null || selectedMaterialId == null || weightText.isEmpty()) {
            Toast.makeText(requireContext(), R.string.request_fill_required, Toast.LENGTH_SHORT).show();
            return;
        }
        double weight;
        try {
            weight = Double.parseDouble(weightText);
        } catch (NumberFormatException e) {
            Toast.makeText(requireContext(), R.string.request_fill_required, Toast.LENGTH_SHORT).show();
            return;
        }

        btnSubmit.setEnabled(false);
        btnSubmit.setText(R.string.collect_saving);
        String token = EkoApp.get().auth().getToken();

        Async.run(
                () -> ApiClient.get().createCollection(token, selectedRequestId, selectedMaterialId, weight, notes),
                resp -> {
                    btnSubmit.setEnabled(true);
                    btnSubmit.setText(R.string.collect_submit);
                    formPanel.setVisibility(View.GONE);
                    successPanel.setVisibility(View.VISIBLE);
                },
                err -> {
                    btnSubmit.setEnabled(true);
                    btnSubmit.setText(R.string.collect_submit);
                    String m = err.getMessage();
                    Toast.makeText(requireContext(),
                            m != null ? m : getString(R.string.collect_save_failed),
                            Toast.LENGTH_LONG).show();
                });
    }

    private void resetForm() {
        successPanel.setVisibility(View.GONE);
        formPanel.setVisibility(View.VISIBLE);
        requestChips.clearCheck();
        materialChips.clearCheck();
        selectedRequestId = null;
        selectedMaterialId = null;
        inputWeight.setText("");
        inputNotes.setText("");
        load();
    }
}
