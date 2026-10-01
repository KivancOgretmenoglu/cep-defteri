package io.github.kivancogretmenoglu.cepdefteri;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Ana ekran aracı: "Kullanılabilir" tutar, dönem etiketi, Clawd ve "+ Ekle" düğmesi.
 * Metinler web katmanında biçimlendirilip WidgetBridgePlugin ile SharedPreferences'a yazılır.
 */
public class CepWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "CepWidget";
    static final String KEY = "payload";
    static final String ADD_URI = "io.github.kivancogretmenoglu.cepdefteri://add";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        RemoteViews views = build(context);
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, views);
        }
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager == null) return;
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, CepWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) {
            manager.updateAppWidget(id, views);
        }
    }

    static RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_cep);

        String amount = "—";
        String label = context.getString(R.string.widget_waiting);
        String note = "";
        boolean negative = false;
        String json = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, null);
        if (json != null) {
            try {
                JSONObject o = new JSONObject(json);
                amount = o.optString("amount", amount);
                label = o.optString("label", label);
                note = o.optString("note", "");
                negative = o.optBoolean("negative", false);
            } catch (JSONException ignored) {
                // Bozuk veri: varsayılan metinler kalır.
            }
        }

        views.setTextViewText(R.id.widget_amount, amount);
        views.setTextViewText(R.id.widget_label, label);
        views.setTextViewText(R.id.widget_note, note);
        views.setViewVisibility(R.id.widget_note, note.isEmpty() ? View.GONE : View.VISIBLE);
        if (negative) {
            views.setTextColor(R.id.widget_amount, context.getResources().getColor(R.color.widget_accent, context.getTheme()));
        }

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

        // Araca (tutara) dokununca uygulama açılır.
        Intent open = new Intent(context, MainActivity.class);
        open.setAction(Intent.ACTION_MAIN);
        open.addCategory(Intent.CATEGORY_LAUNCHER);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent openPi = PendingIntent.getActivity(context, 0, open, flags);
        views.setOnClickPendingIntent(R.id.widget_root, openPi);

        // "+ Ekle": derin bağlantı → uygulama ekleme sayfasını açar.
        Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse(ADD_URI), context, MainActivity.class);
        add.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent addPi = PendingIntent.getActivity(context, 1, add, flags);
        views.setOnClickPendingIntent(R.id.widget_add, addPi);

        return views;
    }
}
