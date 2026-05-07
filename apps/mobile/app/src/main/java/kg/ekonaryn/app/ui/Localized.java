package kg.ekonaryn.app.ui;

import android.content.Context;

import kg.ekonaryn.app.LocaleHelper;
import kg.ekonaryn.app.R;
import kg.ekonaryn.app.api.models.Material;

public final class Localized {

    private Localized() {}

    public static String materialName(Context ctx, Material m) {
        if (m == null) return "";
        boolean ru = "ru".equals(LocaleHelper.getStoredLang(ctx));
        if (ru) return m.nameRu != null ? m.nameRu : (m.name != null ? m.name : "");
        return m.name != null ? m.name : (m.nameRu != null ? m.nameRu : "");
    }

    public static int statusLabelRes(String status) {
        if (status == null) return R.string.status_pending;
        switch (status) {
            case "PENDING": return R.string.status_pending;
            case "ASSIGNED": return R.string.status_assigned;
            case "COMPLETED": return R.string.status_completed;
            case "CANCELLED": return R.string.status_cancelled;
            default: return R.string.status_pending;
        }
    }

    public static int statusBgRes(String status) {
        if (status == null) return R.drawable.bg_status_pending;
        switch (status) {
            case "PENDING": return R.drawable.bg_status_pending;
            case "ASSIGNED": return R.drawable.bg_status_assigned;
            case "COMPLETED": return R.drawable.bg_status_completed;
            case "CANCELLED": return R.drawable.bg_status_cancelled;
            default: return R.drawable.bg_status_pending;
        }
    }

    public static int statusFgColorRes(String status) {
        if (status == null) return R.color.status_pending_fg;
        switch (status) {
            case "PENDING": return R.color.status_pending_fg;
            case "ASSIGNED": return R.color.status_assigned_fg;
            case "COMPLETED": return R.color.status_completed_fg;
            case "CANCELLED": return R.color.status_cancelled_fg;
            default: return R.color.status_pending_fg;
        }
    }

    public static String shortDate(Context ctx, String iso) {
        if (iso == null) return "";
        try {
            java.util.Date d = java.util.Date.from(java.time.Instant.parse(iso));
            java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat(
                    "d MMM",
                    new java.util.Locale(LocaleHelper.getStoredLang(ctx)));
            return fmt.format(d);
        } catch (Exception e) {
            return iso;
        }
    }

    public static String longDate(Context ctx, String iso) {
        if (iso == null) return "";
        try {
            java.util.Date d = java.util.Date.from(java.time.Instant.parse(iso));
            java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat(
                    "d MMM yyyy",
                    new java.util.Locale(LocaleHelper.getStoredLang(ctx)));
            return fmt.format(d);
        } catch (Exception e) {
            return iso;
        }
    }
}
