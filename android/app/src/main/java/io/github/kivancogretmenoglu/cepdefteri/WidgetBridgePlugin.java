package io.github.kivancogretmenoglu.cepdefteri;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Web katmanından ana ekran aracına köprü.
 * update({ payload }) : araç metnini (JSON) saklar ve tüm araçları hemen yeniler.
 * refresh()           : yalnız yeniler.
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
        ctx.getSharedPreferences(CepWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(CepWidgetProvider.KEY, payload)
            .apply();
        CepWidgetProvider.refreshAll(ctx);
        call.resolve();
    }

    @PluginMethod
    public void refresh(PluginCall call) {
        CepWidgetProvider.refreshAll(getContext());
        call.resolve();
    }
}
