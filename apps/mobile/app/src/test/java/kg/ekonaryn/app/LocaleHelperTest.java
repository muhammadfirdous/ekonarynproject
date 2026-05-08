package kg.ekonaryn.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;

import android.content.Context;

import androidx.test.core.app.ApplicationProvider;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 33)
public class LocaleHelperTest {

    private Context ctx;

    @Before
    public void setUp() {
        ctx = ApplicationProvider.getApplicationContext();
        ctx.getSharedPreferences("eko_locale_prefs", Context.MODE_PRIVATE).edit().clear().commit();
    }

    @Test
    public void getStoredLang_defaultsToRussian() {
        assertEquals("ru", LocaleHelper.getStoredLang(ctx));
    }

    @Test
    public void setStoredLang_thenGetStoredLang_roundTrip() {
        LocaleHelper.setStoredLang(ctx, "en");
        assertEquals("en", LocaleHelper.getStoredLang(ctx));
        LocaleHelper.setStoredLang(ctx, "ru");
        assertEquals("ru", LocaleHelper.getStoredLang(ctx));
    }

    @Test
    public void wrap_returnsAContextWithTheStoredLocale() {
        LocaleHelper.setStoredLang(ctx, "en");
        Context wrapped = LocaleHelper.wrap(ctx);
        assertNotNull(wrapped);
        assertEquals("en", wrapped.getResources().getConfiguration().getLocales().get(0).getLanguage());
    }

    @Test
    public void updateResources_overridesLocaleEvenWhenNotStored() {
        // Skip the get/set storage cycle — pass the lang directly.
        Context wrapped = LocaleHelper.updateResources(ctx, "en");
        assertEquals("en", wrapped.getResources().getConfiguration().getLocales().get(0).getLanguage());
        // The Locale.setDefault side-effect happened too — assert that.
        // (Round-tripping back to "ru" via createConfigurationContext is finicky
        // under Robolectric's resource caching, so we don't assert that here.)
        assertEquals("en", java.util.Locale.getDefault().getLanguage());
    }

    @Test
    public void applyStoredLocale_doesNotThrow_andSetsDefaultLocale() {
        LocaleHelper.setStoredLang(ctx, "en");
        LocaleHelper.applyStoredLocale(ctx);
        // The static side-effect is Locale.setDefault; assert that.
        assertEquals("en", java.util.Locale.getDefault().getLanguage());
    }
}
