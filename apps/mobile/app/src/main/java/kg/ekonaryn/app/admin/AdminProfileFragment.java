package kg.ekonaryn.app.admin;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import kg.ekonaryn.app.EkoApp;
import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.MainActivity;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.models.User;

public class AdminProfileFragment extends Fragment {

    private TextView textName, textPhone, avatar;
    private LinearLayout infoRows;
    private Button btnLangRu, btnLangEn, btnLogout;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_admin_profile, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View v, @Nullable Bundle savedInstanceState) {
        textName = v.findViewById(R.id.textName);
        textPhone = v.findViewById(R.id.textPhone);
        avatar = v.findViewById(R.id.avatar);
        infoRows = v.findViewById(R.id.infoRows);
        btnLangRu = v.findViewById(R.id.btnLangRu);
        btnLangEn = v.findViewById(R.id.btnLangEn);
        btnLogout = v.findViewById(R.id.btnLogout);

        User user = EkoApp.get().auth().getUser();
        if (user != null) {
            textName.setText(user.name);
            textPhone.setText(user.phone);
            avatar.setText(user.name != null && !user.name.isEmpty() ? user.name.substring(0, 1) : "?");
            renderInfo(user);
        }

        applyLangButtons();
        btnLangRu.setOnClickListener(view -> setLang("ru"));
        btnLangEn.setOnClickListener(view -> setLang("en"));
        btnLogout.setOnClickListener(view -> confirmLogout());
    }

    private void renderInfo(User user) {
        infoRows.removeAllViews();
        LayoutInflater inf = LayoutInflater.from(requireContext());
        addRow(inf, "👤", getString(R.string.profile_field_name), safe(user.name));
        addRow(inf, "📱", getString(R.string.profile_field_phone), safe(user.phone));
        addRow(inf, "📍", getString(R.string.profile_field_address),
                user.address != null && !user.address.isEmpty() ? user.address : getString(R.string.none));
        addRow(inf, "🏷", getString(R.string.profile_field_role), getString(R.string.admin_role_label));
    }

    private String safe(String s) { return s != null ? s : ""; }

    private void addRow(LayoutInflater inf, String icon, String label, String value) {
        View row = inf.inflate(R.layout.row_info, infoRows, false);
        ((TextView) row.findViewById(R.id.textIcon)).setText(icon);
        ((TextView) row.findViewById(R.id.textLabel)).setText(label);
        ((TextView) row.findViewById(R.id.textValue)).setText(value);
        if (infoRows.getChildCount() > 0) {
            View div = new View(requireContext());
            div.setLayoutParams(new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 1));
            div.setBackgroundColor(0xFFF5F5F5);
            infoRows.addView(div);
        }
        infoRows.addView(row);
    }

    private void applyLangButtons() {
        boolean isRu = "ru".equals(LocaleHelper.getStoredLang(requireContext()));
        btnLangRu.setBackgroundResource(isRu ? R.drawable.bg_chip_active : android.R.color.transparent);
        btnLangRu.setTextColor(ContextCompat.getColor(requireContext(),
                isRu ? R.color.white : R.color.text_gray));
        btnLangEn.setBackgroundResource(!isRu ? R.drawable.bg_chip_active : android.R.color.transparent);
        btnLangEn.setTextColor(ContextCompat.getColor(requireContext(),
                !isRu ? R.color.white : R.color.text_gray));
    }

    private void setLang(String lang) {
        if (lang.equals(LocaleHelper.getStoredLang(requireContext()))) return;
        LocaleHelper.setStoredLang(requireContext(), lang);
        if (getActivity() != null) getActivity().recreate();
    }

    private void confirmLogout() {
        new AlertDialog.Builder(requireContext())
                .setTitle(R.string.auth_logout)
                .setMessage(R.string.auth_confirm_logout)
                .setNegativeButton(R.string.cancel, null)
                .setPositiveButton(R.string.auth_logout, (dialog, which) -> {
                    EkoApp.get().auth().clear();
                    Intent next = new Intent(requireContext(), MainActivity.class);
                    next.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(next);
                })
                .show();
    }
}
