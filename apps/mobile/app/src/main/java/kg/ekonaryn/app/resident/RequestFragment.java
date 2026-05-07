package kg.ekonaryn.app.resident;

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
import kg.ekonaryn.app.api.models.User;
import kg.ekonaryn.app.ui.Localized;

public class RequestFragment extends Fragment {

    private LinearLayout successPanel, formPanel;
    private ChipGroup materialChips;
    private EditText inputAddress, inputQty, inputNotes;
    private Button btnSubmit, btnAnother;

    private final Map<Integer, String> chipIdToMaterialId = new HashMap<>();
    private String selectedMaterialId;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_request, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        successPanel = v.findViewById(R.id.successPanel);
        formPanel = v.findViewById(R.id.formPanel);
        materialChips = v.findViewById(R.id.materialChips);
        inputAddress = v.findViewById(R.id.inputAddress);
        inputQty = v.findViewById(R.id.inputQty);
        inputNotes = v.findViewById(R.id.inputNotes);
        btnSubmit = v.findViewById(R.id.btnSubmit);
        btnAnother = v.findViewById(R.id.btnAnother);

        User user = EkoApp.get().auth().getUser();
        if (user != null && user.address != null) inputAddress.setText(user.address);

        materialChips.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.isEmpty()) {
                selectedMaterialId = null;
            } else {
                selectedMaterialId = chipIdToMaterialId.get(checkedIds.get(0));
            }
        });

        btnSubmit.setOnClickListener(view -> handleSubmit());
        btnAnother.setOnClickListener(view -> resetForm());

        loadMaterials();
    }

    private void loadMaterials() {
        Async.run(() -> ApiClient.get().getMaterials(),
                this::renderMaterials,
                err -> renderMaterials(new ArrayList<>()));
    }

    private void renderMaterials(List<Material> items) {
        materialChips.removeAllViews();
        chipIdToMaterialId.clear();
        if (items == null) return;
        for (Material m : items) {
            Chip chip = new Chip(requireContext());
            chip.setId(View.generateViewId());
            chip.setText(getString(R.string.material_price_format,
                    Localized.materialName(requireContext(), m),
                    m.buyingPrice,
                    m.unit));
            chip.setCheckable(true);
            chip.setChipBackgroundColorResource(R.color.white);
            materialChips.addView(chip);
            chipIdToMaterialId.put(chip.getId(), m.id);
        }
    }

    private void handleSubmit() {
        String address = inputAddress.getText().toString().trim();
        String qtyText = inputQty.getText().toString().trim();
        String notes = inputNotes.getText().toString().trim();

        if (selectedMaterialId == null || address.isEmpty() || qtyText.isEmpty()) {
            Toast.makeText(requireContext(), R.string.request_fill_required, Toast.LENGTH_SHORT).show();
            return;
        }
        double qty;
        try {
            qty = Double.parseDouble(qtyText);
        } catch (NumberFormatException e) {
            Toast.makeText(requireContext(), R.string.request_fill_required, Toast.LENGTH_SHORT).show();
            return;
        }

        btnSubmit.setEnabled(false);
        btnSubmit.setText(R.string.request_submitting);
        String token = EkoApp.get().auth().getToken();

        Async.run(
                () -> ApiClient.get().createRequest(token, selectedMaterialId, address, qty, notes),
                resp -> {
                    btnSubmit.setEnabled(true);
                    btnSubmit.setText(R.string.request_submit);
                    formPanel.setVisibility(View.GONE);
                    successPanel.setVisibility(View.VISIBLE);
                },
                err -> {
                    btnSubmit.setEnabled(true);
                    btnSubmit.setText(R.string.request_submit);
                    String m = err.getMessage();
                    Toast.makeText(requireContext(),
                            m != null ? m : getString(R.string.request_failed),
                            Toast.LENGTH_LONG).show();
                });
    }

    private void resetForm() {
        successPanel.setVisibility(View.GONE);
        formPanel.setVisibility(View.VISIBLE);
        materialChips.clearCheck();
        selectedMaterialId = null;
        inputQty.setText("");
        inputNotes.setText("");
    }
}
