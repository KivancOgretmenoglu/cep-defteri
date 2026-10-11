package io.github.kivancogretmenoglu.cepdefteri;

import android.app.PendingIntent;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

/**
 * Hızlı ayarlar kutucuğu "Cep Defteri: + Kayıt": dokununca paneli kapatıp uygulamayı yeni kayıt sayfasında açar
 * (io.github.kivancogretmenoglu.cepdefteri://add derin bağlantısı). Ekran kilitliyse önce kilidin açılması istenir.
 * Android 14+ (API 34) yalnız PendingIntent alan startActivityAndCollapse'ı kabul eder; öncesinde Intent sürümü.
 */
public class AddTileService extends TileService {

    @Override
    public void onStartListening() {
        super.onStartListening();
        Tile tile = getQsTile();
        if (tile == null) return;
        tile.setState(Tile.STATE_INACTIVE);
        tile.setLabel(getString(R.string.tile_label));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            tile.setSubtitle(getString(R.string.tile_subtitle));
        }
        tile.updateTile();
    }

    @Override
    public void onClick() {
        super.onClick();
        if (isLocked()) {
            unlockAndRun(this::openAdd);
        } else {
            openAdd();
        }
    }

    @SuppressWarnings("deprecation")
    private void openAdd() {
        Intent add = new Intent(Intent.ACTION_VIEW, Uri.parse(CepWidgetProvider.ADD_URI), this, MainActivity.class);
        add.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                PendingIntent pi = PendingIntent.getActivity(this, 20, add, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                startActivityAndCollapse(pi);
            } else {
                startActivityAndCollapse(add);
            }
        } catch (RuntimeException e) {
            // Son çare: paneli kapatamasak da uygulamayı açmayı dene.
            try {
                startActivity(add);
            } catch (RuntimeException ignored) {
                // yapılacak bir şey yok
            }
        }
    }
}
