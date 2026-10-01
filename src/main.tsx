import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/atkinson-hyperlegible-next';
import './styles.css';
import { App } from './App';
import { requestPersistence } from './store/storage';
import { isNative, setupBackButton } from './platform';
import { closeSheet, getNav, go } from './ui/nav';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestPersistence();

setupBackButton({ hasSheet: () => !!getNav().sheet, closeSheet, isHome: () => getNav().screen === 'home', goHome: () => go('home') });

// Android uygulamasında dosyalar zaten uygulamanın içinde; servis çalışanı yalnız web sürümünde.
if ('serviceWorker' in navigator && import.meta.env.PROD && !isNative()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
