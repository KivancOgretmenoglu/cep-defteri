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
import android.view.View;
import android.widget.RemoteViews;
import android.widget.Toast;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Ana ekran aracı. "Önce sahne": maskotun sahnesi aracın tamamını kaplar (widget_scene, centerCrop; Android 12+'da
 * kök clipToOutline ile yuvarlak köşeli), maskot büyük ve zemin bandında, metin yarı saydam panelde, düğmeler maskotun
 * renginde (widget_btn_/widget_btn_soft_/widget_chip_/widget_fab_<anahtar>). Boyuta göre dört düzen:
 *   küçük  (2×1)      widget_small   şerit sahne + alttan bakan büst + tutar
 *   geniş  (3×1, 4×1) widget_cep     şerit sahne + solda maskot + tutar/dönem + yuvarlak "+"
 *   orta   (3×2, 4×2) widget_medium  geniş sahne + solda maskot + sağ üstte tutar/dönem + "Gider" / "Gelir"
 *   büyük  (4×3+)     widget_large   uzun sahne + canlanan maskot + bugünkü harcama + düğmeler + tek dokunuşla kayıt çipleri
 * Android 12+ (API 31) boyuta duyarlı RemoteViews (Map&lt;SizeF, RemoteViews&gt;) kullanır; daha eskilerde düzen
 * araç seçeneklerindeki (en/boy) ölçüye göre seçilir ve onAppWidgetOptionsChanged'de yenilenir.
 *
 * Metinler (dil dahil) web katmanında biçimlendirilip WidgetBridgePlugin ile SharedPreferences'a yazılır
 * (src/native/widgetPayload.ts). Ayrıca burada tutulanlar:
 *   writingAt : Gider/Gelir/kutucuk ile uygulama açıldığında (MainActivity) → "yazmaya gidiyorum" pozu (2 dk)
 *   notedAt   : çipe dokununca → "Not aldım ✓" pozu (3 dk). Uygulamada kayıt eklenince payload.notedAt aynı işi görür.
 *   queue     : çiplerle eklenen, uygulamanın henüz işlemediği kayıtlar (JSON dizi). Uygulama açılınca
 *               WidgetBridgePlugin.readQueue/ackQueue ile alınır ve silinir.
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
    /** Sahne zeminleri: şerit (küçük/geniş), geniş (orta), uzun (büyük). scripts/gen-android-icons.ts */
    static final int[] SCENE_STRIP = {
        R.drawable.widget_scene_fistik_strip,
        R.drawable.widget_scene_bilge_strip,
        R.drawable.widget_scene_ceviz_strip,
        R.drawable.widget_scene_diken_strip,
        R.drawable.widget_scene_karamel_strip,
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
    /** Saydam maskot pozları (geniş/orta/büyük): "yazmaya gidiyorum" ve "Not aldım! ✓". */
    static final int[] WRITE_IMG = {
        R.drawable.widget_anim_fistik_write,
        R.drawable.widget_anim_bilge_write,
        R.drawable.widget_anim_ceviz_write,
        R.drawable.widget_anim_diken_write,
        R.drawable.widget_anim_karamel_write,
    };
    static final int[] NOTED_IMG = {
        R.drawable.widget_anim_fistik_noted,
        R.drawable.widget_anim_bilge_noted,
        R.drawable.widget_anim_ceviz_noted,
        R.drawable.widget_anim_diken_noted,
        R.drawable.widget_anim_karamel_noted,
    };
    /** Küçük araç: alttan bakan büst (sabit, yazıyor, not aldı). */
    static final int[] BUST = {
        R.drawable.widget_bust_fistik,
        R.drawable.widget_bust_bilge,
        R.drawable.widget_bust_ceviz,
        R.drawable.widget_bust_diken,
        R.drawable.widget_bust_karamel,
    };
    static final int[] BUST_WRITE = {
        R.drawable.widget_bust_fistik_write,
        R.drawable.widget_bust_bilge_write,
        R.drawable.widget_bust_ceviz_write,
        R.drawable.widget_bust_diken_write,
        R.drawable.widget_bust_karamel_write,
    };
    static final int[] BUST_NOTED = {
        R.drawable.widget_bust_fistik_noted,
        R.drawable.widget_bust_bilge_noted,
        R.drawable.widget_bust_ceviz_noted,
        R.drawable.widget_bust_diken_noted,
        R.drawable.widget_bust_karamel_noted,
    };
    /** Maskot renginde düğmeler (üretilir: values/widget_mascot_colors.xml + drawable/widget_*_<anahtar>.xml). */
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
    static final int[] FRAME_IDS = {
        R.id.widget_frame_0, R.id.widget_frame_1, R.id.widget_frame_2,
        R.id.widget_frame_3, R.id.widget_frame_4, R.id.widget_frame_5,
    };
    static final int[] CHIP_IDS = { R.id.widget_chip_0, R.id.widget_chip_1, R.id.widget_chip_2 };

    /** Tek bir yenilemede tüm düzenlerin kullandığı durum. */
    static final class State {
        String amount = "—";
        String label;
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
        JSONArray chips = new JSONArray();
        int pose = POSE_NONE;
        /** Pozun biteceği an (ms); 0 = yenileme gerekmiyor. */
        long poseEndsAt = 0;
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
        if (json != null) {
            try {
                JSONObject o = new JSONObject(json);
                st.amount = o.optString("amount", st.amount);
                st.label = o.optString("label", st.label);
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
                payloadNotedAt = o.optLong("notedAt", 0L);
                JSONArray chips = o.optJSONArray("chips");
                if (chips != null) st.chips = chips;
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

    static RemoteViews viewsFor(Context context, AppWidgetManager manager, int appWidgetId, State st) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Başlatıcı, aracın o anki boyuna sığan en büyük düzeni seçer (dp).
            Map<SizeF, RemoteViews> sized = new HashMap<>();
            sized.put(new SizeF(100f, 40f), build(context, SIZE_SMALL, st));
            sized.put(new SizeF(180f, 40f), build(context, SIZE_WIDE, st));
            sized.put(new SizeF(180f, 120f), build(context, SIZE_MEDIUM, st));
            sized.put(new SizeF(250f, 200f), build(context, SIZE_LARGE, st));
            return new RemoteViews(sized);
        }
        return build(context, legacySize(context, manager, appWidgetId), st);
    }

    /** Android 11 ve öncesi: dikeyde en küçük genişlik × en büyük yükseklik, yatayda tersi. */
    static int legacySize(Context context, AppWidgetManager manager, int appWidgetId) {
        Bundle o = manager.getAppWidgetOptions(appWidgetId);
        if (o == null) return SIZE_MEDIUM;
        int minW = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int maxW = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0);
        int minH = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0);
        int maxH = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        boolean landscape = context.getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE;
        int w = landscape ? maxW : minW;
        int h = landscape ? minH : maxH;
        if (w <= 0 || h <= 0) return SIZE_MEDIUM;
        return pickSize(w, h);
    }

    static int pickSize(int w, int h) {
        if (w >= 250 && h >= 200) return SIZE_LARGE;
        if (w >= 180 && h >= 120) return SIZE_MEDIUM;
        if (w >= 180) return SIZE_WIDE;
        return SIZE_SMALL;
    }

    // ───────────────────────── Çizim ─────────────────────────

    static RemoteViews build(Context context, int size, State st) {
        int layout;
        switch (size) {
            case SIZE_SMALL:
                layout = R.layout.widget_small;
                break;
            case SIZE_WIDE:
                layout = R.layout.widget_cep;
                break;
            case SIZE_LARGE:
                layout = R.layout.widget_large;
                break;
            default:
                layout = R.layout.widget_medium;
                break;
        }
        RemoteViews views = new RemoteViews(context.getPackageName(), layout);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

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
        views.setOnClickPendingIntent(R.id.widget_root, PendingIntent.getActivity(context, 0, open, flags));

        int m = st.mascot;
        int scene = size == SIZE_LARGE ? SCENE_TALL[m] : size == SIZE_MEDIUM ? SCENE_WIDE[m] : SCENE_STRIP[m];
        views.setImageViewResource(R.id.widget_scene, scene);
        int btnInk = context.getResources().getColor(BTN_INK[m], context.getTheme());

        if (size == SIZE_SMALL) {
            int bust = st.pose == POSE_WRITING ? BUST_WRITE[m] : st.pose == POSE_NOTED ? BUST_NOTED[m] : BUST[m];
            views.setImageViewResource(R.id.widget_mascot, bust);
            return views;
        }
        if (size != SIZE_LARGE) {
            int img = st.pose == POSE_WRITING ? WRITE_IMG[m] : st.pose == POSE_NOTED ? NOTED_IMG[m] : FRAMES[m][0];
            views.setImageViewResource(R.id.widget_mascot, img);
        }

        views.setTextViewText(R.id.widget_title, st.title);
        views.setTextViewText(R.id.widget_label, st.label);
        String status = st.pose == POSE_NOTED ? st.noted : st.pose == POSE_WRITING ? st.writing : st.note;
        views.setTextViewText(R.id.widget_note, status);
        views.setViewVisibility(R.id.widget_note, status.isEmpty() ? View.GONE : View.VISIBLE);

        if (size == SIZE_WIDE) {
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

        int[] frames = FRAMES[m];
        for (int i = 0; i < FRAME_IDS.length; i++) {
            views.setImageViewResource(FRAME_IDS[i], frames[i]);
        }
        int still;
        if (st.pose == POSE_WRITING) still = WRITE_IMG[m];
        else if (st.pose == POSE_NOTED) still = NOTED_IMG[m];
        else still = frames[0];
        boolean flip = st.animate && st.pose == POSE_NONE;
        views.setImageViewResource(R.id.widget_static, still);
        views.setViewVisibility(R.id.widget_flipper, flip ? View.VISIBLE : View.GONE);
        views.setViewVisibility(R.id.widget_static, flip ? View.GONE : View.VISIBLE);

        int shown = 0;
        for (int i = 0; i < CHIP_IDS.length; i++) {
            JSONObject chip = i < MAX_CHIPS ? st.chips.optJSONObject(i) : null;
            String id = chip == null ? "" : chip.optString("id", "");
            if (chip == null || id.isEmpty()) {
                views.setViewVisibility(CHIP_IDS[i], View.GONE);
                continue;
            }
            shown++;
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
        Toast.makeText(context, label.isEmpty() ? queuedText : queuedText + " " + label, Toast.LENGTH_SHORT).show();
        refreshAll(context);
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
