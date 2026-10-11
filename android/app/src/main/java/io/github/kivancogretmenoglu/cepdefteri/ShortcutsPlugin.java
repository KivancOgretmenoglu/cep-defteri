package io.github.kivancogretmenoglu.cepdefteri;

import android.app.StatusBarManager;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.drawable.Icon;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Uygulamanın içinden "ana ekrana araç ekle" ve "hızlı ayarlara kutucuk ekle" sistem isteklerini açar.
 * isPinWidgetSupported() : { supported } — Android 8+ (API 26) ve başlatıcı destekliyorsa true.
 * requestPinWidget()     : { result: 'ok' | 'unsupported' | 'error' } — 'ok' yalnız isteğin gösterildiğini söyler;
 *                          kullanıcının aracı gerçekten bırakıp bırakmadığı bildirilmez.
 * isAddTileSupported()   : { supported } — Android 13+ (API 33).
 * requestAddTile()       : { result: 'ok' | 'already' | 'dismissed' | 'unsupported' | 'error' } — sistem penceresinin sonucu.
 */
@CapacitorPlugin(name = "Shortcuts")
public class ShortcutsPlugin extends Plugin {

    static boolean pinSupported(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false;
        try {
            AppWidgetManager awm = AppWidgetManager.getInstance(ctx);
            return awm != null && awm.isRequestPinAppWidgetSupported();
        } catch (RuntimeException e) {
            return false;
        }
    }

    static boolean tileSupported() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU;
    }

    private static void resolveResult(PluginCall call, String result) {
        JSObject ret = new JSObject();
        ret.put("result", result);
        call.resolve(ret);
    }

    @PluginMethod
    public void isPinWidgetSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", pinSupported(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void isAddTileSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", tileSupported());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPinWidget(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            resolveResult(call, "unsupported");
            return;
        }
        if (!pinSupported(ctx)) {
            resolveResult(call, "unsupported");
            return;
        }
        try {
            AppWidgetManager awm = AppWidgetManager.getInstance(ctx);
            boolean shown = awm.requestPinAppWidget(new ComponentName(ctx, CepWidgetProvider.class), null, null);
            resolveResult(call, shown ? "ok" : "unsupported");
        } catch (Exception e) {
            resolveResult(call, "error");
        }
    }

    @PluginMethod
    public void requestAddTile(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            resolveResult(call, "unsupported");
            return;
        }
        // Sistem penceresi ön plandaki etkinlikten açılmalı; varsa etkinlik bağlamını kullan.
        Context ctx = getActivity() != null ? getActivity() : getContext();
        try {
            StatusBarManager sbm = ctx.getSystemService(StatusBarManager.class);
            if (sbm == null) {
                resolveResult(call, "unsupported");
                return;
            }
            sbm.requestAddTileService(
                new ComponentName(ctx, AddTileService.class),
                ctx.getString(R.string.tile_label),
                Icon.createWithResource(ctx, R.drawable.ic_tile_add),
                ctx.getMainExecutor(),
                result -> {
                    String r;
                    if (result == null) {
                        r = "error";
                    } else if (result == StatusBarManager.TILE_ADD_REQUEST_RESULT_TILE_ADDED) {
                        r = "ok";
                    } else if (result == StatusBarManager.TILE_ADD_REQUEST_RESULT_TILE_ALREADY_ADDED) {
                        r = "already";
                    } else if (result == StatusBarManager.TILE_ADD_REQUEST_RESULT_TILE_NOT_ADDED) {
                        r = "dismissed";
                    } else {
                        r = "error";
                    }
                    resolveResult(call, r);
                }
            );
        } catch (Exception e) {
            resolveResult(call, "error");
        }
    }
}
