package io.github.kivancogretmenoglu.cepdefteri;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.SizeF;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.Toast;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Ana ekran aracı. "Önce sahne": maskotun sahnesi aracın tamamını kaplar (widget_scene, centerCrop), maskot büyük ve
 * zemin bandında, metin yarı saydam panelde, düğmeler maskotun renginde (widget_btn_/widget_btn_soft_/widget_chip_/
 * widget_fab_<anahtar>; hepsi basınca dalgalanan &lt;ripple&gt;). Kök zemini maskot renginin koyusunda dolu bir şekil
 * (widget_frame_<anahtar>), içerik (widget_inner) 2 dp içeride: kenarda duvar kâğıdından ayıran ince bir çerçeve kalır,
 * dokunuşları engelleyen bir katman yoktur. Android 12+'da kök ve iç kap clipToOutline ile yuvarlak köşelidir.
 *
 * Boyut kovaları (dp; boyut VE en/boy oranı, bkz. pickSize ve ANDROID.md):
 *   küçük  widget_small   h &lt; 130, w &lt; 200          (2×1)          mini sahne + %88 yükseklikte büst + tutar
 *   geniş  widget_cep     h &lt; 130, w ≥ 200          (3×1, 4×1, 5×1) şerit sahne + maskot + büyük tutar + "+"
 *   büyük  widget_large   w ≥ 280, h ≥ 250           (4×3, 4×4, 5×3) canlanan maskot + bugün + Gider/Gelir + çipler
 *   orta   widget_medium  w ≥ 260, w/h ≥ 1.4         (4×2, 5×2)      maskot + tutar + Gider/Gelir
 *   kare   widget_square  geri kalan her şey         (2×2, 3×2, 3×3) üstte tutar, altta ortada büyük maskot, küçük "+"
 * Android 12+ (API 31): başlatıcının bildirdiği gerçek boyutlar (OPTION_APPWIDGET_SIZES) için tam eşleşen bir
 * Map&lt;SizeF, RemoteViews&gt;; bildirilmemişse kovaları temsil eden 16 çapa boyutu (başlatıcı sığan en yakını seçer).
 * Daha eskilerde düzen, araç seçeneklerindeki en/boydan seçilir ve onAppWidgetOptionsChanged'de yenilenir.
 *
 * Veri (src/native/widgetPayload.ts → WidgetBridgePlugin → SharedPreferences "payload"): metinler web katmanında
 * hazırlanır; tutarlar ise ham kuruş (available, todaySpent) + dil olarak da gelir ve burada src/i18n/format.ts ile
 * aynı biçimde yazılır ("53.168,58 TL" / "₺53,168.58"). Böylece çiplerle kuyruğa eklenen ama uygulamanın henüz
 * işlemediği kayıtlar tutara hemen yansıtılır (iyimser gösterim; bkz. load). hidden=true (uygulamada "Toplamları gizle"
 * ya da cihazdaki "Widget'ta tutarı gizle") → tutarlar "•••• TL" ve maskot gizli ajan kıyafetinde (_spy görselleri).
 * Ayrıca burada tutulanlar:
 *   writingAt : Gider/Gelir/kutucuk ile uygulama açıldığında (MainActivity) → "yazmaya gidiyorum" pozu (2 dk)
 *   notedAt   : çipe dokununca → "Not aldım ✓" pozu (3 dk). Uygulamada kayıt eklenince payload.notedAt aynı işi görür.
 *   queue     : çiplerle eklenen, uygulamanın henüz işlemediği kayıtlar (JSON dizi). Uygulama açılınca
 *               WidgetBridgePlugin.readQueue/ackQueue ile alınır ve silinir; uygulama sonra taze payload gönderir.
 */
public class CepWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "CepWidget";
    static final String KEY = "payload";
    static final String KEY_QUEUE = "queue";
    static final String KEY_WRITING_AT = "writingAt";
    static final String KEY_NOTED_AT = "notedAt";
    static final String ADD_URI = "io.github.kivancogretmenoglu.cepdefteri://add";
    static final String ACTION_QUICK = "io.github.kivancogretmenoglu.cepdefteri.WIDGET_QUICK";
    static final String ACTION_REFRESH = "io.github.kivancogretmenoglu.cepdefteri.WIDGET_REFRESH";
    static final String EXTRA_CHIP_ID = "chipId";

    static final long NOTED_MS = 3L * 60L * 1000L;
    static final long WRITING_MS = 2L * 60L * 1000L;
    static final int MAX_QUEUE = 50;
    static final int MAX_CHIPS = 3;
    /** Kuyruk okuma-yazmaları (alıcı ana iş parçacığında, eklenti kendi iş parçacığında) bu kilitle sıralanır. */
    static final Object LOCK = new Object();

    static final int SIZE_SMALL = 0;
    static final int SIZE_WIDE = 1;
    static final int SIZE_MEDIUM = 2;
    static final int SIZE_LARGE = 3;
    static final int SIZE_SQUARE = 4;

    static final int POSE_NONE = 0;
    static final int POSE_WRITING = 1;
    static final int POSE_NOTED = 2;

    // Sıra: AppIconPlugin.KEYS ile aynı (fistik, bilge, ceviz, diken, karamel).
    /** Maskotun tek başına simgesi (eski düzen; görsel hâlâ üretiliyor, mascotDrawable ile erişilir). */
    static final int[] MASCOT = {
        R.drawable.widget_mascot_fistik,
        R.drawable.widget_mascot_bilge,
        R.drawable.widget_mascot_ceviz,
        R.drawable.widget_mascot_diken,
        R.drawable.widget_mascot_karamel,
    };
    /** Sahne zeminleri, her düzenin en/boy oranında (scripts/gen-android-icons.ts SCENE_SIZES). */
    static final int[] SCENE_MINI = {
        R.drawable.widget_scene_fistik_mini,
        R.drawable.widget_scene_bilge_mini,
        R.drawable.widget_scene_ceviz_mini,
        R.drawable.widget_scene_diken_mini,
        R.drawable.widget_scene_karamel_mini,
    };
    static final int[] SCENE_STRIP = {
        R.drawable.widget_scene_fistik_strip,
        R.drawable.widget_scene_bilge_strip,
        R.drawable.widget_scene_ceviz_strip,
        R.drawable.widget_scene_diken_strip,
        R.drawable.widget_scene_karamel_strip,
    };
    static final int[] SCENE_SQUARE = {
        R.drawable.widget_scene_fistik_square,
        R.drawable.widget_scene_bilge_square,
        R.drawable.widget_scene_ceviz_square,
        R.drawable.widget_scene_diken_square,
        R.drawable.widget_scene_karamel_square,
    };
    static final int[] SCENE_WIDE = {
        R.drawable.widget_scene_fistik_wide,
        R.drawable.widget_scene_bilge_wide,
        R.drawable.widget_scene_ceviz_wide,
        R.drawable.widget_scene_diken_wide,
        R.drawable.widget_scene_karamel_wide,
    };
    static final int[] SCENE_TALL = {
        R.drawable.widget_scene_fistik_tall,
        R.drawable.widget_scene_bilge_tall,
        R.drawable.widget_scene_ceviz_tall,
        R.drawable.widget_scene_diken_tall,
        R.drawable.widget_scene_karamel_tall,
    };
    /** Saydam maskot pozları: "yazmaya gidiyorum" ve "Not aldım! ✓" (sade / gizli ajan). */
    static final int[] WRITE_IMG = {
        R.drawable.widget_anim_fistik_write,
        R.drawable.widget_anim_bilge_write,
        R.drawable.widget_anim_ceviz_write,
        R.drawable.widget_anim_diken_write,
        R.drawable.widget_anim_karamel_write,
    };
    static final int[] WRITE_IMG_SPY = {
        R.drawable.widget_anim_fistik_spy_write,
        R.drawable.widget_anim_bilge_spy_write,
        R.drawable.widget_anim_ceviz_spy_write,
        R.drawable.widget_anim_diken_spy_write,
        R.drawable.widget_anim_karamel_spy_write,
    };
    static final int[] NOTED_IMG = {
        R.drawable.widget_anim_fistik_noted,
        R.drawable.widget_anim_bilge_noted,
        R.drawable.widget_anim_ceviz_noted,
        R.drawable.widget_anim_diken_noted,
        R.drawable.widget_anim_karamel_noted,
    };
    static final int[] NOTED_IMG_SPY = {
        R.drawable.widget_anim_fistik_spy_noted,
        R.drawable.widget_anim_bilge_spy_noted,
        R.drawable.widget_anim_ceviz_spy_noted,
        R.drawable.widget_anim_diken_spy_noted,
        R.drawable.widget_anim_karamel_spy_noted,
    };
    /** Küçük araç: alttan bakan büst (sabit, yazıyor, not aldı; sade / gizli ajan). */
    static final int[] BUST = {
        R.drawable.widget_bust_fistik,
        R.drawable.widget_bust_bilge,
        R.drawable.widget_bust_ceviz,
        R.drawable.widget_bust_diken,
        R.drawable.widget_bust_karamel,
    };
    static final int[] BUST_SPY = {
        R.drawable.widget_bust_fistik_spy,
        R.drawable.widget_bust_bilge_spy,
        R.drawable.widget_bust_ceviz_spy,
        R.drawable.widget_bust_diken_spy,
        R.drawable.widget_bust_karamel_spy,
    };
    static final int[] BUST_WRITE = {
        R.drawable.widget_bust_fistik_write,
        R.drawable.widget_bust_bilge_write,
        R.drawable.widget_bust_ceviz_write,
        R.drawable.widget_bust_diken_write,
        R.drawable.widget_bust_karamel_write,
    };
    static final int[] BUST_WRITE_SPY = {
        R.drawable.widget_bust_fistik_spy_write,
        R.drawable.widget_bust_bilge_spy_write,
        R.drawable.widget_bust_ceviz_spy_write,
        R.drawable.widget_bust_diken_spy_write,
        R.drawable.widget_bust_karamel_spy_write,
    };
    static final int[] BUST_NOTED = {
        R.drawable.widget_bust_fistik_noted,
        R.drawable.widget_bust_bilge_noted,
        R.drawable.widget_bust_ceviz_noted,
        R.drawable.widget_bust_diken_noted,
        R.drawable.widget_bust_karamel_noted,
    };
    static final int[] BUST_NOTED_SPY = {
        R.drawable.widget_bust_fistik_spy_noted,
        R.drawable.widget_bust_bilge_spy_noted,
        R.drawable.widget_bust_ceviz_spy_noted,
        R.drawable.widget_bust_diken_spy_noted,
        R.drawable.widget_bust_karamel_spy_noted,
    };
    /** Maskot renginde düğmeler ve çerçeve (üretilir: values/widget_mascot_colors.xml + drawable/widget_*_<anahtar>.xml). */
    static final int[] BTN = {
        R.drawable.widget_btn_fistik,
        R.drawable.widget_btn_bilge,
        R.drawable.widget_btn_ceviz,
        R.drawable.widget_btn_diken,
        R.drawable.widget_btn_karamel,
    };
    static final int[] BTN_INK = {
        R.color.widget_btn_ink_fistik,
        R.color.widget_btn_ink_bilge,
        R.color.widget_btn_ink_ceviz,
        R.color.widget_btn_ink_diken,
        R.color.widget_btn_ink_karamel,
    };
    static final int[] BTN_SOFT = {
        R.drawable.widget_btn_soft_fistik,
        R.drawable.widget_btn_soft_bilge,
        R.drawable.widget_btn_soft_ceviz,
        R.drawable.widget_btn_soft_diken,
        R.drawable.widget_btn_soft_karamel,
    };
    static final int[] CHIP_BG = {
        R.drawable.widget_chip_fistik,
        R.drawable.widget_chip_bilge,
        R.drawable.widget_chip_ceviz,
        R.drawable.widget_chip_diken,
        R.drawable.widget_chip_karamel,
    };
    static final int[] FAB = {
        R.drawable.widget_fab_fistik,
        R.drawable.widget_fab_bilge,
        R.drawable.widget_fab_ceviz,
        R.drawable.widget_fab_diken,
        R.drawable.widget_fab_karamel,
    };
    static final int[] FRAME_BG = {
        R.drawable.widget_frame_fistik,
        R.drawable.widget_frame_bilge,
        R.drawable.widget_frame_ceviz,
        R.drawable.widget_frame_diken,
        R.drawable.widget_frame_karamel,
    };
    /** Canlandırma kareleri, saydam (scripts/gen-android-icons.ts, ANIM_FRAMES = 6). İlki aynı zamanda sabit kare. */
    static final int[][] FRAMES = {
        {
            R.drawable.widget_anim_fistik_0, R.drawable.widget_anim_fistik_1, R.drawable.widget_anim_fistik_2,
            R.drawable.widget_anim_fistik_3, R.drawable.widget_anim_fistik_4, R.drawable.widget_anim_fistik_5,
        },
        {
            R.drawable.widget_anim_bilge_0, R.drawable.widget_anim_bilge_1, R.drawable.widget_anim_bilge_2,
            R.drawable.widget_anim_bilge_3, R.drawable.widget_anim_bilge_4, R.drawable.widget_anim_bilge_5,
        },
        {
            R.drawable.widget_anim_ceviz_0, R.drawable.widget_anim_ceviz_1, R.drawable.widget_anim_ceviz_2,
            R.drawable.widget_anim_ceviz_3, R.drawable.widget_anim_ceviz_4, R.drawable.widget_anim_ceviz_5,
        },
        {
            R.drawable.widget_anim_diken_0, R.drawable.widget_anim_diken_1, R.drawable.widget_anim_diken_2,
            R.drawable.widget_anim_diken_3, R.drawable.widget_anim_diken_4, R.drawable.widget_anim_diken_5,
        },
        {
            R.drawable.widget_anim_karamel_0, R.drawable.widget_anim_karamel_1, R.drawable.widget_anim_karamel_2,
            R.drawable.widget_anim_karamel_3, R.drawable.widget_anim_karamel_4, R.drawable.widget_anim_karamel_5,
        },
    };
    static final int[][] FRAMES_SPY = {
        {
            R.drawable.widget_anim_fistik_spy_0, R.drawable.widget_anim_fistik_spy_1, R.drawable.widget_anim_fistik_spy_2,
            R.drawable.widget_anim_fistik_spy_3, R.drawable.widget_anim_fistik_spy_4, R.drawable.widget_anim_fistik_spy_5,
        },
        {
            R.drawable.widget_anim_bilge_spy_0, R.drawable.widget_anim_bilge_spy_1, R.drawable.widget_anim_bilge_spy_2,
            R.drawable.widget_anim_bilge_spy_3, R.drawable.widget_anim_bilge_spy_4, R.drawable.widget_anim_bilge_spy_5,
        },
        {
            R.drawable.widget_anim_ceviz_spy_0, R.drawable.widget_anim_ceviz_spy_1, R.drawable.widget_anim_ceviz_spy_2,
            R.drawable.widget_anim_ceviz_spy_3, R.drawable.widget_anim_ceviz_spy_4, R.drawable.widget_anim_ceviz_spy_5,
        },
        {
            R.drawable.widget_anim_diken_spy_0, R.drawable.widget_anim_diken_spy_1, R.drawable.widget_anim_diken_spy_2,
            R.drawable.widget_anim_diken_spy_3, R.drawable.widget_anim_diken_spy_4, R.drawable.widget_anim_diken_spy_5,
        },
        {
            R.drawable.widget_anim_karamel_spy_0, R.drawable.widget_anim_karamel_spy_1, R.drawable.widget_anim_karamel_spy_2,
            R.drawable.widget_anim_karamel_spy_3, R.drawable.widget_anim_karamel_spy_4, R.drawable.widget_anim_karamel_spy_5,
        },
    };
    static final int[] FRAME_IDS = {
        R.id.widget_frame_0, R.id.widget_frame_1, R.id.widget_frame_2,
        R.id.widget_frame_3, R.id.widget_frame_4, R.id.widget_frame_5,
    };
    static final int[] CHIP_IDS = { R.id.widget_chip_0, R.id.widget_chip_1, R.id.widget_chip_2 };

    /** Tek bir yenilemede tüm düzenlerin kullandığı durum. */
    static final class State {
        String amount = "—";
        String label;
        String labelShort;
        String title;
        String add;
        String expense;
        String income;
        String today = "";
        String note = "";
        String noted;
        String writing;
        String queued;
        int mascot = 0;
        boolean negative = false;
        boolean animate = true;
        /** Tutarlar gizli (toplamları gizle ya da araçta gizle): "•••• TL" + gizli ajan maskot. */
        boolean hidden = false;
        JSONArray chips = new JSONArray();
        int pose = POSE_NONE;
        /** Pozun biteceği an (ms); 0 = yenileme gerekmiyor. */
        long poseEndsAt = 0;
        /** Uygulamanın henüz işlemediği, tutara iyimser olarak eklenen kuyruk öğesi sayısı. */
        int pending = 0;
    }

    // ───────────────────────── Yaşam döngüsü ─────────────────────────

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        State st = load(context, System.currentTimeMillis());
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, viewsFor(context, manager, id, st));
        }
        scheduleRefresh(context, st.poseEndsAt);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        State st = load(context, System.currentTimeMillis());
        manager.updateAppWidget(appWidgetId, viewsFor(context, manager, appWidgetId, st));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_QUICK.equals(action)) {
            quickAdd(context, intent.getStringExtra(EXTRA_CHIP_ID));
            return;
        }
        if (ACTION_REFRESH.equals(action)) {
            refreshAll(context);
            return;
        }
        super.onReceive(context, intent);
    }

    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager == null) return;
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, CepWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        State st = load(context, System.currentTimeMillis());
        for (int id : ids) {
            manager.updateAppWidget(id, viewsFor(context, manager, id, st));
        }
        scheduleRefresh(context, st.poseEndsAt);
    }

    /** Gider/Gelir düğmesi ya da hızlı ayarlar kutucuğu uygulamayı açtı: maskot "yazmaya gidiyor". */
    static void markWriting(Context context) {
        prefs(context).edit().putLong(KEY_WRITING_AT, System.currentTimeMillis()).apply();
        refreshAll(context);
    }

    /** Geçici poz bitince aracı yeniden çizmek için kesin olmayan (izin gerektirmeyen) bir alarm. */
    static void scheduleRefresh(Context context, long at) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            Intent i = new Intent(context, CepWidgetProvider.class);
            i.setAction(ACTION_REFRESH);
            PendingIntent pi = PendingIntent.getBroadcast(context, 100, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            if (at <= 0) {
                am.cancel(pi);
            } else {
                am.set(AlarmManager.RTC, at + 1000L, pi);
            }
        } catch (RuntimeException ignored) {
            // Alarm kurulamazsa poz bir sonraki güncellemede kendiliğinden düşer.
        }
    }

    // ───────────────────────── Durum ─────────────────────────

    static State load(Context context, long now) {
        State st = new State();
        st.label = context.getString(R.string.widget_waiting);
        st.labelShort = st.label;
        st.title = context.getString(R.string.widget_title);
        st.add = context.getString(R.string.widget_add);
        st.expense = context.getString(R.string.widget_expense);
        st.income = context.getString(R.string.widget_income);
        st.noted = context.getString(R.string.widget_noted);
        st.writing = context.getString(R.string.widget_writing);
        st.queued = context.getString(R.string.widget_queued);

        SharedPreferences p = prefs(context);
        long payloadNotedAt = 0;
        String json = p.getString(KEY, null);
        String queueJson;
        synchronized (LOCK) {
            queueJson = p.getString(KEY_QUEUE, "[]");
        }
        if (json != null) {
            try {
                JSONObject o = new JSONObject(json);
                st.amount = o.optString("amount", st.amount);
                st.label = o.optString("label", st.label);
                st.labelShort = o.optString("labelShort", st.label);
                st.title = o.optString("title", st.title);
                st.add = o.optString("add", st.add);
                st.expense = o.optString("expense", st.expense);
                st.income = o.optString("income", st.income);
                st.today = o.optString("today", "");
                st.note = o.optString("note", "");
                st.noted = o.optString("notedText", st.noted);
                st.writing = o.optString("writingText", st.writing);
                st.queued = o.optString("queuedText", st.queued);
                st.mascot = mascotIndex(o.optString("mascot", "fistik"));
                st.negative = o.optBoolean("negative", false);
                st.animate = o.optBoolean("animate", true);
                st.hidden = o.optBoolean("hidden", false);
                payloadNotedAt = o.optLong("notedAt", 0L);
                JSONArray chips = o.optJSONArray("chips");
                if (chips != null) st.chips = chips;
                applyAmounts(st, o, parseArray(queueJson), now);
            } catch (JSONException ignored) {
                // Bozuk veri: varsayılan metinler kalır.
            }
        }

        long notedAt = Math.max(payloadNotedAt, p.getLong(KEY_NOTED_AT, 0L));
        long writingAt = p.getLong(KEY_WRITING_AT, 0L);
        long sinceNoted = now - notedAt;
        long sinceWriting = now - writingAt;
        if (notedAt > 0 && notedAt >= writingAt && sinceNoted >= 0 && sinceNoted < NOTED_MS) {
            st.pose = POSE_NOTED;
            st.poseEndsAt = notedAt + NOTED_MS;
        } else if (writingAt > 0 && writingAt > notedAt && sinceWriting >= 0 && sinceWriting < WRITING_MS) {
            st.pose = POSE_WRITING;
            st.poseEndsAt = writingAt + WRITING_MS;
        }
        return st;
    }

    /**
     * Tutar ve "Bugün" satırını ham kuruştan yazar (yeni payload; eskisinde hazır metinler kalır).
     * İyimser gösterim: kuyruktaki, uygulamanın henüz işlemediği öğeler (qid payload.seen içinde değil; seen yoksa
     * dokunma anı payload.updatedAt'ten sonra) kullanılabilir tutardan düşülür (gelir eklenir), bugün dokunulmuş
     * giderler "Bugün"e eklenir. Yalnız gerçek veride (payload.real) uygulanır; örnek veri kuyruktan etkilenmez.
     */
    static void applyAmounts(State st, JSONObject o, JSONArray queue, long now) {
        if (!o.has("available") || !o.has("lang")) return;
        String lang = o.optString("lang", "tr");
        boolean real = o.optBoolean("real", false);
        boolean hasAvailable = !o.isNull("available");
        long available = o.optLong("available", 0L);
        String todayIso = o.optString("todayISO", "");
        long today = todayIso.equals(isoDate(now)) ? o.optLong("todaySpent", 0L) : 0L;
        long generatedAt = o.optLong("updatedAt", 0L);
        JSONArray seenArr = o.optJSONArray("seen");
        Set<String> seen = null;
        if (seenArr != null) {
            seen = new HashSet<>();
            for (int i = 0; i < seenArr.length(); i++) seen.add(seenArr.optString(i, ""));
        }
        if (real && hasAvailable) {
            String todayNow = isoDate(now);
            for (int i = 0; i < queue.length(); i++) {
                JSONObject e = queue.optJSONObject(i);
                if (e == null) continue;
                String qid = e.optString("qid", "");
                long at = e.optLong("at", 0L);
                if (seen != null ? seen.contains(qid) : at <= generatedAt) continue;
                long amt = e.optLong("amount", 0L);
                if (amt <= 0) continue;
                String type = e.optString("type", "");
                if ("expense".equals(type)) {
                    available -= amt;
                    if (todayNow.equals(isoDate(at))) today += amt;
                } else if ("income".equals(type)) {
                    available += amt;
                } else {
                    continue;
                }
                st.pending++;
            }
        }
        if (hasAvailable) {
            st.amount = st.hidden ? hiddenMoney(lang) : formatMoney(available, lang);
            st.negative = !st.hidden && available < 0;
        }
        String tpl = o.optString("todayTpl", "");
        if (hasAvailable && tpl.contains("%s")) {
            st.today = tpl.replace("%s", st.hidden ? hiddenMoney(lang) : formatMoney(today, lang));
        }
    }

    /** Cihazın yerel tarihi, "YYYY-MM-DD" (JS todayISO ile aynı). */
    static String isoDate(long ms) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(ms);
        return String.format(Locale.ROOT, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /**
     * src/domain/money.ts formatMoney (compact, birimli) ile birebir: kuruş sıfırsa ondalık yok, eksi "−" (U+2212).
     *   tr: "53.168,58 TL", "1.234 TL", "−12,50 TL"     en: "₺53,168.58", "₺1,234", "−₺12.50"
     */
    static String formatMoney(long m, String lang) {
        boolean en = "en".equals(lang);
        boolean neg = m < 0;
        long abs = Math.abs(m);
        long lira = abs / 100;
        long kurus = abs % 100;
        String digits = Long.toString(lira);
        StringBuilder body = new StringBuilder();
        char group = en ? ',' : '.';
        for (int i = 0; i < digits.length(); i++) {
            if (i > 0 && (digits.length() - i) % 3 == 0) body.append(group);
            body.append(digits.charAt(i));
        }
        if (kurus != 0) {
            body.append(en ? '.' : ',');
            if (kurus < 10) body.append('0');
            body.append(kurus);
        }
        String prefix = neg ? "−" : "";
        return en ? prefix + "₺" + body : prefix + body + " TL";
    }

    /** Gizli tutar: "•••• TL" (en: "₺••••"). */
    static String hiddenMoney(String lang) {
        return "en".equals(lang) ? "₺••••" : "•••• TL";
    }

    static int mascotIndex(String key) {
        switch (key == null ? "" : key) {
            case "bilge":
                return 1;
            case "ceviz":
                return 2;
            case "diken":
                return 3;
            case "karamel":
                return 4;
            default:
                return 0;
        }
    }

    /** Maskot anahtarı → araç görseli (bilinmeyen anahtar: Fıstık). */
    static int mascotDrawable(String key) {
        return MASCOT[mascotIndex(key)];
    }

    // ───────────────────────── Düzen seçimi ─────────────────────────

    /** Android 12+ yedek çapaları (gerçek boyutlar bildirilmediyse): {genişlik, yükseklik} dp, 16 adet (sınır). */
    static final float[] ANCHOR_W = { 100f, 200f, 280f, 320f };
    static final float[] ANCHOR_H = { 40f, 130f, 200f, 250f };
    /** RemoteViews(Map) en fazla 16 boyut kabul eder. */
    static final int MAX_SIZES = 16;

    static RemoteViews viewsFor(Context context, AppWidgetManager manager, int appWidgetId, State st) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Map<SizeF, RemoteViews> sized = new HashMap<>();
            // Başlatıcının bu araç için bildirdiği gerçek boyutlar (dikey/yatay): her birine tam o boyutun düzeni.
            ArrayList<SizeF> sizes = null;
            try {
                Bundle o = manager.getAppWidgetOptions(appWidgetId);
                if (o != null) sizes = o.getParcelableArrayList(AppWidgetManager.OPTION_APPWIDGET_SIZES);
            } catch (RuntimeException ignored) {
                sizes = null;
            }
            if (sizes != null) {
                for (SizeF s : sizes) {
                    if (s == null || s.getWidth() <= 0 || s.getHeight() <= 0 || sized.containsKey(s) || sized.size() >= MAX_SIZES) continue;
                    sized.put(s, build(context, pickSize(s.getWidth(), s.getHeight()), st, s.getWidth(), s.getHeight()));
                }
            }
            if (sized.isEmpty()) {
                // Boyut bilinmiyor: kovaları temsil eden çapalar; başlatıcı sığanların en yakınını seçer.
                for (float w : ANCHOR_W) {
                    for (float h : ANCHOR_H) {
                        sized.put(new SizeF(w, h), build(context, pickSize(w, h), st, 0f, 0f));
                    }
                }
            }
            return new RemoteViews(sized);
        }
        float[] wh = legacySize(context, manager, appWidgetId);
        return build(context, pickSize(wh[0], wh[1]), st, wh[0], wh[1]);
    }

    /** Android 11 ve öncesi: dikeyde en küçük genişlik × en büyük yükseklik, yatayda tersi. {0,0} = bilinmiyor. */
    static float[] legacySize(Context context, AppWidgetManager manager, int appWidgetId) {
        Bundle o = manager.getAppWidgetOptions(appWidgetId);
        if (o == null) return new float[] { 0f, 0f };
        int minW = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int maxW = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0);
        int minH = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
        int maxH = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        boolean landscape = context.getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
        int w = landscape ? maxW : minW;
        int h = landscape ? minH : maxH;
        if (w <= 0 || h <= 0) return new float[] { 0f, 0f };
        return new float[] { w, h };
    }

    /**
     * Boyut + en/boy oranı → düzen (dp). Samsung ızgarasında (hücre ≈ 80×100 dp):
     *   2×1 küçük · 3×1, 4×1, 5×1 geniş · 2×2, 3×2, 3×3, 2×3 kare · 4×2, 5×2 orta · 4×3, 4×4, 5×3+ büyük.
     * Bilinmeyen boyut (0) → orta.
     */
    static int pickSize(float w, float h) {
        if (w <= 0 || h <= 0) return SIZE_MEDIUM;
        if (h < 130f) return w < 200f ? SIZE_SMALL : SIZE_WIDE;
        if (w >= 280f && h >= 250f) return SIZE_LARGE;
        if (w >= 260f && w / h >= 1.4f) return SIZE_MEDIUM;
        return SIZE_SQUARE;
    }

    // ───────────────────────── Çizim ─────────────────────────

    static int layoutFor(int size) {
        switch (size) {
            case SIZE_SMALL:
                return R.layout.widget_small;
            case SIZE_WIDE:
                return R.layout.widget_cep;
            case SIZE_SQUARE:
                return R.layout.widget_square;
            case SIZE_LARGE:
                return R.layout.widget_large;
            default:
                return R.layout.widget_medium;
        }
    }

    /**
     * Düzene göre görünümler. Her düzende bulunan kimlikler (bir düzende olmayan kimliğe dokunmak aracı bozar):
     *   hepsi          widget_root, widget_inner, widget_scene, widget_amount
     *   küçük          + widget_mascot (büst)
     *   geniş, kare    + widget_mascot, widget_body, widget_title, widget_label, widget_note, widget_add
     *   orta           + widget_mascot, widget_body, widget_title, widget_label, widget_note, widget_btn_expense/income
     *   büyük          + widget_body, widget_title, widget_label, widget_note, widget_today, widget_btn_expense/income,
     *                    widget_flipper, widget_frame_0..5, widget_static, widget_chips, widget_chip_0..2
     * w, h: aracın dp boyutu (0 = bilinmiyor; o zaman XML varsayılanları kalır).
     */
    static RemoteViews build(Context context, int size, State st, float w, float h) {
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutFor(size));
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        float density = context.getResources().getDisplayMetrics().density;
        boolean known = w > 0 && h > 0;
        int m = st.mascot;
        boolean spy = st.hidden;

        // Çerçeve: kök zemini maskot renginin koyusu (içerik 2 dp içeride).
        views.setInt(R.id.widget_root, "setBackgroundResource", FRAME_BG[m]);

        views.setTextViewText(R.id.widget_amount, st.amount);
        int amountColor = st.negative ? R.color.widget_accent : R.color.widget_ink;
        views.setTextColor(R.id.widget_amount, context.getResources().getColor(amountColor, context.getTheme()));

        // Araca dokununca uygulama açılır: başlatıcıdaki etkin simgenin (activity-alias) niyetiyle,
        // böylece uygulama simgesinden açılmışla aynı görev öne gelir.
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open == null) {
            open = new Intent(context, MainActivity.class);
            open.setAction(Intent.ACTION_MAIN);
            open.addCategory(Intent.CATEGORY_LAUNCHER);
        }
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent openPi = PendingIntent.getActivity(context, 0, open, flags);
        views.setOnClickPendingIntent(R.id.widget_root, openPi);

        int scene;
        switch (size) {
            case SIZE_SMALL:
                scene = SCENE_MINI[m];
                break;
            case SIZE_WIDE:
                scene = SCENE_STRIP[m];
                break;
            case SIZE_SQUARE:
                scene = SCENE_SQUARE[m];
                break;
            case SIZE_LARGE:
                scene = SCENE_TALL[m];
                break;
            default:
                scene = SCENE_WIDE[m];
                break;
        }
        views.setImageViewResource(R.id.widget_scene, scene);
        int btnInk = context.getResources().getColor(BTN_INK[m], context.getTheme());

        int bust;
        if (st.pose == POSE_WRITING) bust = spy ? BUST_WRITE_SPY[m] : BUST_WRITE[m];
        else if (st.pose == POSE_NOTED) bust = spy ? BUST_NOTED_SPY[m] : BUST_NOTED[m];
        else bust = spy ? BUST_SPY[m] : BUST[m];
        // Dar geniş araçta (3×1) tam boy maskot çok küçülür: onun yerine büst (yüksekliğin ≈ %90'ı).
        boolean narrowWide = size == SIZE_WIDE && known && w < 280f;

        if (size == SIZE_SMALL) {
            views.setImageViewResource(R.id.widget_mascot, bust);
            // Büst yüksekliğin ≈ %88'i; genişliği aracın yarısını geçmesin (tutara yer kalsın).
            if (known) views.setInt(R.id.widget_mascot, "setMaxWidth", Math.round(w * 0.5f * density));
            // Tutar paneli de uygulamayı açar (basınca dalga).
            views.setOnClickPendingIntent(R.id.widget_amount, openPi);
            fitAmountLegacy(views, st.amount, known ? w * 0.5f - 28f : 0f, 20f);
            return views;
        }

        int[] frames = spy ? FRAMES_SPY[m] : FRAMES[m];
        int still;
        if (st.pose == POSE_WRITING) still = spy ? WRITE_IMG_SPY[m] : WRITE_IMG[m];
        else if (st.pose == POSE_NOTED) still = spy ? NOTED_IMG_SPY[m] : NOTED_IMG[m];
        else still = frames[0];
        if (size != SIZE_LARGE) views.setImageViewResource(R.id.widget_mascot, narrowWide ? bust : still);

        views.setOnClickPendingIntent(R.id.widget_body, openPi);
        views.setTextViewText(R.id.widget_title, st.title);
        String status = st.pose == POSE_NOTED ? st.noted : st.pose == POSE_WRITING ? st.writing : st.note;
        views.setTextViewText(R.id.widget_note, status);
        views.setViewVisibility(R.id.widget_note, status.isEmpty() ? View.GONE : View.VISIBLE);

        // Panelin iç genişliği (dp, yaklaşık): tutar ve dönem metni buna göre (dönem: tam → kısa → gizli).
        float panelW = 0f;
        if (known) {
            switch (size) {
                case SIZE_WIDE: {
                    float share = narrowWide ? 0.34f : 0.30f;
                    float mascotW = Math.min(w * share, (h - 11f) * (narrowWide ? 1.1f : 1.35f));
                    panelW = w - 4f - 8f - mascotW - 4f - 6f - 40f - 18f - 4f;
                    views.setInt(R.id.widget_mascot, "setMaxWidth", Math.round(w * share * density));
                    break;
                }
                case SIZE_SQUARE:
                    panelW = w - 16f - 18f - 4f;
                    break;
                case SIZE_MEDIUM:
                    panelW = (w - 16f - 6f - 4f) * 0.56f - 22f;
                    break;
                default: {
                    // Büyük: canlanan maskot en fazla aracın %45'i (panel ≥ %55, tutar büyük kalsın).
                    int maxPx = Math.round(Math.min(170f, w * 0.45f) * density);
                    for (int id : FRAME_IDS) views.setInt(id, "setMaxWidth", maxPx);
                    views.setInt(R.id.widget_static, "setMaxWidth", maxPx);
                    panelW = w - 20f - 4f - Math.min(170f, w * 0.45f) - 4f - 22f;
                    break;
                }
            }
        }
        // Tek satırlık ve kare araçta durum notu ("Not aldım ✓") geçici olarak dönemin yerini alır (yükseklik yetmez);
        // geniş araçta başlık da gizlenir.
        boolean statusReplaces = !status.isEmpty() && (size == SIZE_WIDE || size == SIZE_SQUARE);
        views.setViewVisibility(R.id.widget_title, statusReplaces && size == SIZE_WIDE ? View.GONE : View.VISIBLE);
        String label = statusReplaces ? "" : chooseLabel(st.label, st.labelShort, panelW, 11f);
        views.setTextViewText(R.id.widget_label, label);
        views.setViewVisibility(R.id.widget_label, label.isEmpty() ? View.GONE : View.VISIBLE);
        fitAmountLegacy(views, st.amount, panelW, size == SIZE_WIDE ? 30f : 28f);

        if (size == SIZE_WIDE || size == SIZE_SQUARE) {
            // Yuvarlak "+" (maskot renginde): derin bağlantı → uygulama ekleme sayfasını açar.
            views.setInt(R.id.widget_add, "setBackgroundResource", FAB[m]);
            views.setTextColor(R.id.widget_add, btnInk);
            views.setContentDescription(R.id.widget_add, st.add);
            views.setOnClickPendingIntent(R.id.widget_add, PendingIntent.getActivity(context, 1, addIntent(context, null), flags));
            return views;
        }

        views.setTextViewText(R.id.widget_btn_expense, st.expense);
        views.setTextViewText(R.id.widget_btn_income, st.income);
        views.setInt(R.id.widget_btn_expense, "setBackgroundResource", BTN[m]);
        views.setTextColor(R.id.widget_btn_expense, btnInk);
        views.setInt(R.id.widget_btn_income, "setBackgroundResource", BTN_SOFT[m]);
        views.setOnClickPendingIntent(R.id.widget_btn_expense, PendingIntent.getActivity(context, 2, addIntent(context, "expense"), flags));
        views.setOnClickPendingIntent(R.id.widget_btn_income, PendingIntent.getActivity(context, 3, addIntent(context, "income"), flags));
        if (size == SIZE_MEDIUM) return views;

        // ── Büyük ──
        views.setTextViewText(R.id.widget_today, st.today);
        views.setViewVisibility(R.id.widget_today, st.today.isEmpty() ? View.GONE : View.VISIBLE);

        for (int i = 0; i < FRAME_IDS.length; i++) {
            views.setImageViewResource(FRAME_IDS[i], frames[i]);
        }
        boolean flip = st.animate && st.pose == POSE_NONE;
        views.setImageViewResource(R.id.widget_static, still);
        views.setViewVisibility(R.id.widget_flipper, flip ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_static, flip ? View.GONE : View.VISIBLE);

        int shown = 0;
        // Çipler içerikleri kadar geniş, sola dayalı; sığmayan (tahmini genişlik) çip gösterilmez, kesik görünmez.
        float room = known ? w - 20f - 4f : Float.MAX_VALUE;
        for (int i = 0; i < CHIP_IDS.length; i++) {
            JSONObject chip = i < MAX_CHIPS ? st.chips.optJSONObject(i) : null;
            String id = chip == null ? "" : chip.optString("id", "");
            float chipW = chip == null ? 0f : Math.min(150f, textWidth(chip.optString("label", ""), 12f) + 22f) + (shown > 0 ? 6f : 0f);
            if (chip == null || id.isEmpty() || chipW > room) {
                views.setViewVisibility(CHIP_IDS[i], View.GONE);
                continue;
            }
            shown++;
            room -= chipW;
            views.setTextViewText(CHIP_IDS[i], chip.optString("label", ""));
            views.setInt(CHIP_IDS[i], "setBackgroundResource", CHIP_BG[m]);
            views.setViewVisibility(CHIP_IDS[i], View.VISIBLE);
            Intent quick = new Intent(context, CepWidgetProvider.class);
            quick.setAction(ACTION_QUICK);
            quick.setData(Uri.parse("cepdefteri-widget://chip/" + i));
            quick.putExtra(EXTRA_CHIP_ID, id);
            views.setOnClickPendingIntent(CHIP_IDS[i], PendingIntent.getBroadcast(context, 10 + i, quick, flags));
        }
        views.setViewVisibility(R.id.widget_chips, shown > 0 ? View.VISIBLE : View.GONE);
        return views;
    }

    /** Metnin yaklaşık genişliği (dp): ortalama karakter ≈ 0.52 em (Roboto/SamsungOne, küçük yazı). */
    static float textWidth(String s, float sp) {
        return s.length() * sp * 0.52f;
    }

    /** Dönem metni: sığarsa tam, değilse kısa, o da sığmazsa gizli (""). panelW = 0 → tam (bilinmiyor). */
    static String chooseLabel(String full, String shortLabel, float panelW, float sp) {
        if (panelW <= 0f || textWidth(full, sp) <= panelW) return full;
        if (shortLabel != null && !shortLabel.isEmpty() && textWidth(shortLabel, sp) <= panelW) return shortLabel;
        return "";
    }

    /**
     * Android 8 öncesinde autoSize yok: tutar boyutu panel genişliğinden hesaplanır (kalın rakam ≈ 0.6 em).
     * 8+ sürümlerde XML'deki autoSizeTextType="uniform" tutarı sığdırır (setTextSize orada yok sayılır, dokunulmaz).
     */
    static void fitAmountLegacy(RemoteViews views, String amount, float widthDp, float maxSp) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O || widthDp <= 0f || amount.isEmpty()) return;
        float sp = Math.max(10f, Math.min(maxSp, widthDp / (amount.length() * 0.6f)));
        views.setTextViewTextSize(R.id.widget_amount, TypedValue.COMPLEX_UNIT_SP, sp);
    }

    /** Ekleme sayfası derin bağlantısı; type: "expense" | "income" | null. */
    static Intent addIntent(Context context, String type) {
        String uri = type == null ? ADD_URI : ADD_URI + "?type=" + type;
        Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse(uri), context, MainActivity.class);
        add.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return add;
    }

    // ───────────────────────── Tek dokunuşla kayıt ─────────────────────────

    /**
     * Çipe dokunuldu: çipin o anki şablonu (payload.chips) kuyruğa eklenir, uygulama açılmaz.
     * Her öğeye benzersiz bir "qid" verilir; uygulama aynı qid'i iki kez işlemez.
     */
    static void quickAdd(Context context, String chipId) {
        if (chipId == null || chipId.isEmpty()) return;
        long now = System.currentTimeMillis();
        String label = null;
        String queuedText = context.getString(R.string.widget_queued);
        synchronized (LOCK) {
            SharedPreferences p = prefs(context);
            try {
                JSONObject payload = new JSONObject(p.getString(KEY, "{}"));
                queuedText = payload.optString("queuedText", queuedText);
                JSONArray chips = payload.optJSONArray("chips");
                JSONObject chip = null;
                if (chips != null) {
                    for (int i = 0; i < chips.length(); i++) {
                        JSONObject c = chips.optJSONObject(i);
                        if (c != null && chipId.equals(c.optString("id", ""))) {
                            chip = c;
                            break;
                        }
                    }
                }
                if (chip == null) return;
                JSONObject entry = new JSONObject(chip.toString());
                entry.put("qid", UUID.randomUUID().toString());
                entry.put("at", now);
                JSONArray queue = parseArray(p.getString(KEY_QUEUE, "[]"));
                queue.put(entry);
                JSONArray trimmed = new JSONArray();
                for (int i = Math.max(0, queue.length() - MAX_QUEUE); i < queue.length(); i++) {
                    trimmed.put(queue.get(i));
                }
                p.edit().putString(KEY_QUEUE, trimmed.toString()).putLong(KEY_NOTED_AT, now).commit();
                label = chip.optString("label", "");
            } catch (JSONException e) {
                return;
            }
        }
        // Önce araç: "Not aldım ✓" pozu ve kuyruk düşülmüş tutar hemen görünsün; sonra kısa bildirim.
        refreshAll(context);
        Toast.makeText(context, label.isEmpty() ? queuedText : queuedText + " " + label, Toast.LENGTH_SHORT).show();
    }

    static JSONArray parseArray(String s) {
        try {
            return new JSONArray(s == null ? "[]" : s);
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    /** Kuyruğun JSON metni (WidgetBridgePlugin.readQueue). */
    static String readQueue(Context context) {
        synchronized (LOCK) {
            return parseArray(prefs(context).getString(KEY_QUEUE, "[]")).toString();
        }
    }

    /** Uygulamanın işlediği öğeleri (qid) kuyruktan çıkarır; arada eklenenler kalır. Kalan öğe sayısını döndürür. */
    static int ackQueue(Context context, Set<String> qids) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(context);
            JSONArray queue = parseArray(p.getString(KEY_QUEUE, "[]"));
            JSONArray rest = new JSONArray();
            for (int i = 0; i < queue.length(); i++) {
                JSONObject e = queue.optJSONObject(i);
                if (e == null || qids.contains(e.optString("qid", ""))) continue;
                rest.put(e);
            }
            p.edit().putString(KEY_QUEUE, rest.toString()).commit();
            return rest.length();
        }
    }
}
