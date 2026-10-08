package io.github.kivancogretmenoglu.cepdefteri;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Uygulamaya özel yerel eklentiler, köprü kurulmadan önce kaydedilmeli.
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(AppIconPlugin.class);
        super.onCreate(savedInstanceState);
    }

    /**
     * BridgeActivity açılıştaki niyeti de buradan geçirir (load → onNewIntent(getIntent())).
     * "://add" derin bağlantısıyla (araçtaki Gider/Gelir, + Ekle ya da hızlı ayarlar kutucuğu) gelindiyse
     * araçtaki maskot "yazmaya gidiyorum" pozuna geçer. Bağlantının kendisini JS tarafı (appUrlOpen) işler.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        try {
            if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
                Uri data = intent.getData();
                if (data != null && getString(R.string.custom_url_scheme).equalsIgnoreCase(data.getScheme()) && "add".equalsIgnoreCase(data.getHost())) {
                    CepWidgetProvider.markWriting(this);
                }
            }
        } catch (RuntimeException ignored) {
            // Araç güncellenemese de uygulama açılmaya devam eder.
        }
    }
}
