package io.github.kivancogretmenoglu.cepdefteri;

import static org.junit.Assume.assumeTrue;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.RemoteViews;
import androidx.test.core.app.ApplicationProvider;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;

/**
 * Ana ekran aracını gerçek düzen dosyalarıyla (RemoteViews) her Samsung ızgara boyutunda çizip PNG olarak kaydeder.
 * Görsel denetim içindir; yalnız WIDGET_PAYLOADS (uygulamanın widgetPayload() çıktılarından oluşan
 * [{name, payload}] JSON dosyası) ve WIDGET_SHOTS (çıktı klasörü) ortam değişkenleri verilince çalışır:
 *
 *   WIDGET_PAYLOADS=/yol/payloads.json WIDGET_SHOTS=/yol/cikti ./gradlew testDebugUnitTest --tests '*WidgetRenderTest*'
 */
@RunWith(RobolectricTestRunner.class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = 35, qualifiers = "w411dp-h891dp-xxhdpi")
public class WidgetRenderTest {

    /** Samsung ızgarası (hücre ≈ 80×100 dp; bkz. CepWidgetProvider.pickSize): ad, genişlik, yükseklik (dp). */
    static final Object[][] SIZES = {
        { "2x1", 160f, 100f }, { "3x1", 240f, 100f }, { "4x1", 320f, 100f }, { "5x1", 400f, 100f },
        { "2x2", 160f, 200f }, { "3x2", 240f, 200f }, { "2x3", 160f, 300f }, { "3x3", 240f, 300f },
        { "4x2", 320f, 200f }, { "5x2", 400f, 200f },
        { "4x3", 320f, 300f }, { "4x4", 320f, 400f }, { "5x3", 400f, 300f },
    };

    @Test
    public void renderEverySize() throws Exception {
        String payloads = System.getenv("WIDGET_PAYLOADS");
        String outDir = System.getenv("WIDGET_SHOTS");
        assumeTrue(payloads != null && outDir != null);
        Context ctx = ApplicationProvider.getApplicationContext();
        float density = ctx.getResources().getDisplayMetrics().density;
        JSONArray list = new JSONArray(new String(Files.readAllBytes(Paths.get(payloads)), StandardCharsets.UTF_8));
        new File(outDir).mkdirs();
        for (int n = 0; n < list.length(); n++) {
            JSONObject item = list.getJSONObject(n);
            ctx.getSharedPreferences(CepWidgetProvider.PREFS, Context.MODE_PRIVATE)
                .edit().clear().putString(CepWidgetProvider.KEY, item.getString("payload")).commit();
            CepWidgetProvider.State st = CepWidgetProvider.load(ctx, System.currentTimeMillis());
            for (Object[] s : SIZES) {
                float w = (Float) s[1], h = (Float) s[2];
                int size = CepWidgetProvider.pickSize(w, h);
                RemoteViews rv = CepWidgetProvider.build(ctx, size, st, w, h);
                FrameLayout parent = new FrameLayout(ctx);
                View v = rv.apply(ctx, parent);
                int pw = Math.round(w * density), ph = Math.round(h * density);
                v.measure(View.MeasureSpec.makeMeasureSpec(pw, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(ph, View.MeasureSpec.EXACTLY));
                v.layout(0, 0, pw, ph);
                Bitmap bmp = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888);
                Canvas c = new Canvas(bmp);
                c.drawColor(0xFF1E2A33);
                v.draw(c);
                try (FileOutputStream out = new FileOutputStream(new File(outDir, item.getString("name") + "_" + s[0] + ".png"))) {
                    bmp.compress(Bitmap.CompressFormat.PNG, 100, out);
                }
            }
        }
    }
}
