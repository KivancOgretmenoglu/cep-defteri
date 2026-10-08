package io.github.kivancogretmenoglu.cepdefteri;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Uygulama simgesi seçilen maskotu izler. AndroidManifest.xml'de her maskot için bir
 * activity-alias (".Icon_<anahtar>") vardır; yalnız biri etkin olur ve başlatıcıda o görünür.
 * setIcon({ key }) : seçileni etkinleştirir, diğerlerini kapatır (önce etkinleştir, sonra kapat:
 *                    başlatıcıda hiç simge kalmaması önlenir). Sonuç: { key, changed }.
 * getIcon()        : etkin olanın anahtarı { key }.
 */
@CapacitorPlugin(name = "AppIcon")
public class AppIconPlugin extends Plugin {

    static final String[] KEYS = { "fistik", "bilge", "ceviz", "diken", "karamel", "pamuk" };
    /** Manifest'te varsayılan olarak etkin olan takma ad */
    static final String DEFAULT_KEY = "fistik";

    static ComponentName alias(Context ctx, String key) {
        // Sınıf adı manifest'teki ad alanına (namespace) göre çözülür; paket adı ise uygulama kimliğidir.
        return new ComponentName(ctx.getPackageName(), MainActivity.class.getPackage().getName() + ".Icon_" + key);
    }

    static boolean isKnown(String key) {
        if (key == null) return false;
        for (String k : KEYS) if (k.equals(key)) return true;
        return false;
    }

    static boolean isEnabled(PackageManager pm, ComponentName cn, String key) {
        int s = pm.getComponentEnabledSetting(cn);
        if (s == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) return true;
        if (s == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT) return DEFAULT_KEY.equals(key);
        return false;
    }

    static String activeKey(Context ctx) {
        PackageManager pm = ctx.getPackageManager();
        for (String k : KEYS) {
            if (isEnabled(pm, alias(ctx, k), k)) return k;
        }
        return DEFAULT_KEY;
    }

    @PluginMethod
    public void getIcon(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("key", activeKey(getContext()));
        call.resolve(ret);
    }

    @PluginMethod
    public void setIcon(PluginCall call) {
        String key = call.getString("key");
        if (!isKnown(key)) {
            call.reject("bilinmeyen simge: " + key);
            return;
        }
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        boolean changed = false;
        try {
            ComponentName target = alias(ctx, key);
            if (!isEnabled(pm, target, key)) {
                pm.setComponentEnabledSetting(target, PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
                changed = true;
            }
            for (String k : KEYS) {
                if (k.equals(key)) continue;
                ComponentName other = alias(ctx, k);
                if (isEnabled(pm, other, k)) {
                    pm.setComponentEnabledSetting(other, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                    changed = true;
                }
            }
        } catch (Exception e) {
            call.reject("simge değiştirilemedi", e);
            return;
        }
        JSObject ret = new JSObject();
        ret.put("key", key);
        ret.put("changed", changed);
        call.resolve(ret);
    }
}
