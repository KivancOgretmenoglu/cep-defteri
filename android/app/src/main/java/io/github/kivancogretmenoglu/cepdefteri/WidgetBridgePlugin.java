package io.github.kivancogretmenoglu.cepdefteri;

import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;

/**
 * Web katmanından ana ekran aracına köprü.
 * update({ payload }) : araç metnini (JSON) saklar ve tüm araçları hemen yeniler.
 * refresh()           : yalnız yeniler.
 * readQueue()         : araçtaki çiplerle eklenmiş, henüz işlenmemiş kayıtlar → { queue: "<JSON dizi metni>" }.
 *                       Kuyruk silinmez; uygulama işledikten sonra ackQueue çağırır.
 * ackQueue({ ids })   : ids = qid'lerin JSON dizi metni; bunlar kuyruktan çıkarılır → { remaining }.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null) {
            call.reject("payload eksik");
            return;
        }
        Context ctx = getContext();
        CepWidgetProvider.prefs(ctx).edit().putString(CepWidgetProvider.KEY, payload).apply();
        CepWidgetProvider.refreshAll(ctx);
        call.resolve();
    }

    @PluginMethod
    public void refresh(PluginCall call) {
        CepWidgetProvider.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void readQueue(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("queue", CepWidgetProvider.readQueue(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void ackQueue(PluginCall call) {
        String ids = call.getString("ids");
        if (ids == null) {
            call.reject("ids eksik");
            return;
        }
        Set<String> set = new HashSet<>();
        try {
            JSONArray arr = new JSONArray(ids);
            for (int i = 0; i < arr.length(); i++) {
                String s = arr.optString(i, "");
                if (!s.isEmpty()) set.add(s);
            }
        } catch (JSONException e) {
            call.reject("ids geçersiz");
            return;
        }
        int remaining = CepWidgetProvider.ackQueue(getContext(), set);
        JSObject ret = new JSObject();
        ret.put("remaining", remaining);
        call.resolve(ret);
    }
}
