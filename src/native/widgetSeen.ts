/**
 * Araç kuyruğundan (çipler) işlenmiş qid'lerin cihazdaki listesi. widgetQueue.ts çift kaydı önlemek için yazar;
 * widget.ts son kısmını payload'a `seen` olarak koyar: CepWidgetProvider bu listede olmayan kuyruk öğelerini
 * (henüz uygulamaya işlenmemiş) tutara iyimser olarak yansıtır, olanları (zaten veride) yansıtmaz.
 */
const SEEN_KEY = 'cep-defteri:widget-seen';
export const SEEN_MAX = 300;
/** Payload'a giden son qid sayısı (kuyruk en fazla 50 öğe tutar). */
export const SEEN_IN_PAYLOAD = 60;

export function loadSeen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveSeen(ids: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-SEEN_MAX)));
  } catch {
    /* depolama yoksa koruma yalnız ack'e kalır */
  }
}
