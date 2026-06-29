import { useState, useEffect, type FocusEvent } from 'react';

export function useKeyboardOffset(isOpen: boolean): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!isOpen) { setOffset(0); return; }
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [isOpen]);

  return offset;
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
