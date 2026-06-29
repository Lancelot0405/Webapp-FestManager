import { useState, useEffect, type FocusEvent } from 'react';

export interface KeyboardInsets {
  /** Pixel height of the on-screen keyboard (0 khi đóng). Dùng cho marginBottom. */
  bottom: number;
  /** Visual viewport height khi bàn phím mở (null khi đóng). Dùng cap maxHeight dialog. */
  viewportHeight: number | null;
}

/**
 * Theo dõi bàn phím iOS qua visualViewport.
 * - `bottom`: chiều cao bàn phím → đẩy bottom sheet lên trên bàn phím.
 * - `viewportHeight`: chiều cao vùng nhìn thấy → cap maxHeight dialog (dvh KHÔNG co
 *   khi bàn phím hiện trên iOS, nên phải dùng số đo này thay cho max-h-[85dvh]).
 */
export function useKeyboardInsets(isOpen: boolean): KeyboardInsets {
  const [insets, setInsets] = useState<KeyboardInsets>({ bottom: 0, viewportHeight: null });

  useEffect(() => {
    if (!isOpen) { setInsets({ bottom: 0, viewportHeight: null }); return; }
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInsets({ bottom, viewportHeight: bottom > 0 ? vv.height : null });
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [isOpen]);

  return insets;
}

/** Backward-compat: chỉ lấy chiều cao bàn phím. */
export function useKeyboardOffset(isOpen: boolean): number {
  return useKeyboardInsets(isOpen).bottom;
}

/**
 * Scroll a focused input/textarea into view inside a keyboard-open modal.
 * Delay lets iOS finish resizing visualViewport before scrolling.
 * Use as: <Modal.Body onFocus={handleFocusScroll}>
 */
export function handleFocusScroll(e: FocusEvent) {
  const el = e.target;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    setTimeout(() => {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 100);
  }
}
