/**
 * Boş durum sahneleri: her ekranda seçili maskot o işe uygun kıyafetle küçük bir boşta hareketi
 * tekrarlar (deftere yazar, gözlüğünü düzeltir, havaya bozuk para atar, el sallar…).
 * Metin anahtarları `empty.<sahne>.title|body|cta` (src/i18n/empty.*.ts).
 */
import type { Mood } from '../domain/mood';
import type { Key } from '../i18n/core';
import type { ActionName } from './actions';

export type EmptyScene = 'tx' | 'home' | 'reports' | 'reportsMonth' | 'invest' | 'budget' | 'people';

export interface SceneDef {
  outfit: string;
  mood: Mood;
  /** Sırayla, aralıklı oynatılan hareketler */
  acts: ActionName[];
}

export const EMPTY_SCENES: Record<EmptyScene, SceneDef> = {
  tx: { outfit: 'ledger', mood: 'curious', acts: ['write', 'lookaround', 'write', 'nod'] },
  home: { outfit: 'plain', mood: 'happy', acts: ['note', 'tilt', 'note', 'wave'] },
  reports: { outfit: 'scholar', mood: 'thoughtful', acts: ['glasses', 'lookaround', 'glasses', 'shrug'] },
  reportsMonth: { outfit: 'scholar', mood: 'calm', acts: ['lookaround', 'glasses'] },
  invest: { outfit: 'suit', mood: 'curious', acts: ['coins', 'nod', 'coins', 'lookaround'] },
  budget: { outfit: 'planner', mood: 'calm', acts: ['pages', 'nod', 'pages', 'lookaround'] },
  people: { outfit: 'plain', mood: 'happy', acts: ['wave', 'hey', 'wave', 'tilt'] },
};

export const EMPTY_SCENE_NAMES = Object.keys(EMPTY_SCENES) as EmptyScene[];

/** Tür denetimli: bir sahnenin metni sözlükte yoksa derleme hata verir. */
export const sceneKeys = (s: EmptyScene): { title: Key; body: Key; cta: Key } => ({
  title: `empty.${s}.title`,
  body: `empty.${s}.body`,
  cta: `empty.${s}.cta`,
});
