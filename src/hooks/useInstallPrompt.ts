import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (window.navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;
    setIsIos(ios);
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return false;
    await installPrompt.prompt();
    setInstallPrompt(null);
    return true;
  };

  const canInstall = !isStandalone && (installPrompt !== null || isIos);

  return { canInstall, isIos, triggerInstall };
}
