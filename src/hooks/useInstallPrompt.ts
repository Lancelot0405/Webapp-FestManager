import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIos, setIsIos]                 = useState(false);
  const [isStandalone, setIsStandalone]   = useState(false);

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

  const triggerInstall = async (): Promise<'installed' | 'guide' | 'already'> => {
    // Đã cài rồi (standalone) → nhắc nhở
    if (isStandalone) return 'already';
    // Android/Chrome có prompt → cài trực tiếp
    if (installPrompt) {
      await installPrompt.prompt();
      setInstallPrompt(null);
      return 'installed';
    }
    // iOS hoặc không có prompt → hiện hướng dẫn
    return 'guide';
  };

  return { isIos, isStandalone, triggerInstall };
}
