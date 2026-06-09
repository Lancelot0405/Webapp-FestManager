import { useState, useEffect } from 'react';

// Event chuẩn beforeinstallprompt chưa có trong lib DOM mặc định của TS.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Derive ngay ở initializer (giá trị có sẵn lúc mount) — tránh setState trong effect.
  const [isIos] = useState(() => /iphone|ipad|ipod/i.test(navigator.userAgent));
  const [isStandalone] = useState(() =>
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
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
