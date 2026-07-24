/* ANG HR global viewport + virtual keyboard lock */
(() => {
  'use strict';

  const doc = document.documentElement;
  let stableHeight = 0;
  let keyboardOpen = false;
  let focusScrollX = 0;
  let focusScrollY = 0;
  let raf = 0;

  const viewportHeight = () => {
    const vv = window.visualViewport;
    return Math.round(vv ? Math.max(vv.height + vv.offsetTop, vv.height) : window.innerHeight);
  };

  const setHeight = (height) => {
    if (!height || height < 240) return;
    stableHeight = Math.round(height);
    doc.style.setProperty('--ang-app-height', `${stableHeight}px`);
  };

  const restorePagePosition = () => {
    window.scrollTo(focusScrollX, focusScrollY);
    document.body.scrollTop = 0;
    doc.scrollTop = 0;
  };

  const update = (force = false) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const current = viewportHeight();
      const baseline = stableHeight || Math.round(window.innerHeight || current);
      const focused = document.activeElement;
      const editing = !!focused && /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName);
      const heightLoss = baseline - current;
      const likelyKeyboard = editing && heightLoss > Math.max(110, baseline * 0.16);

      keyboardOpen = likelyKeyboard;
      doc.classList.toggle('ang-keyboard-open', keyboardOpen);

      if (!keyboardOpen && (force || !stableHeight || Math.abs(current - stableHeight) > 80)) {
        setHeight(current);
      }

      if (keyboardOpen) restorePagePosition();
    });
  };

  const onFocusIn = (event) => {
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    focusScrollX = window.scrollX;
    focusScrollY = window.scrollY;
    doc.classList.add('ang-input-focused');
    setTimeout(() => update(false), 50);
    setTimeout(restorePagePosition, 120);
    setTimeout(restorePagePosition, 320);
  };

  const onFocusOut = () => {
    doc.classList.remove('ang-input-focused');
    setTimeout(() => {
      doc.classList.remove('ang-keyboard-open');
      keyboardOpen = false;
      update(true);
      restorePagePosition();
    }, 180);
  };

  setHeight(viewportHeight() || window.innerHeight);
  addEventListener('resize', () => update(false), { passive: true });
  addEventListener('orientationchange', () => setTimeout(() => update(true), 280), { passive: true });
  addEventListener('focusin', onFocusIn, true);
  addEventListener('focusout', onFocusOut, true);
  addEventListener('scroll', () => {
    if (keyboardOpen || doc.classList.contains('ang-input-focused')) restorePagePosition();
  }, { passive: true });

  if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => update(false), { passive: true });
    visualViewport.addEventListener('scroll', () => {
      if (keyboardOpen) restorePagePosition();
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => update(true), { once: true });
})();
