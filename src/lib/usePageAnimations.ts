/**
 * usePageAnimations
 * Runs a coordinated GSAP entrance animation for the main iTab page.
 * Called once on mount when gsapAnimations === true.
 *
 * Animation sequence:
 *  0.00s  background layers fade in
 *  0.10s  TopBar slides down
 *  0.20s  AiPortalBar slides down (stagger)
 *  0.25s  AppGrid icons stagger scale-in from below
 *  0.50s  Dock slides up
 *  0.55s  Widgets fade+slide in from right
 *  0.60s  Prompt sidebar button fades in
 */
import { useEffect } from 'react';
import { gsap } from 'gsap';

export function usePageAnimations(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    // Kill any leftover tweens on these selectors to avoid double-play on HMR
    gsap.killTweensOf([
      '[data-anim="topbar"]',
      '[data-anim="aibar"]',
      '[data-anim="appgrid"]',
      '[data-anim="app-icon"]',
      '[data-anim="dock"]',
      '[data-anim="widgets"]',
      '[data-anim="prompts-btn"]',
    ]);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // 1. Background
    tl.from('[data-anim="bg"]', {
      opacity: 0,
      duration: 0.7,
    }, 0);

    // 2. TopBar — slide from top
    tl.from('[data-anim="topbar"]', {
      y: -32,
      opacity: 0,
      duration: 0.55,
    }, 0.1);

    // 3. AI Portal Bar — slide from top, slight delay
    tl.from('[data-anim="aibar"]', {
      y: -20,
      opacity: 0,
      duration: 0.5,
    }, 0.22);

    // 4. App icons — stagger scale + fade from below
    tl.from('[data-anim="app-icon"]', {
      y: 22,
      opacity: 0,
      scale: 0.82,
      duration: 0.5,
      stagger: {
        amount: 0.35,
        from: 'start',
        grid: 'auto',
      },
    }, 0.28);

    // 5. Dock — slide from bottom
    tl.from('[data-anim="dock"]', {
      y: 40,
      opacity: 0,
      duration: 0.55,
    }, 0.45);

    // 6. Widgets — slide from right
    tl.from('[data-anim="widgets"]', {
      x: 28,
      opacity: 0,
      duration: 0.5,
    }, 0.5);

    // 7. Prompt sidebar button
    tl.from('[data-anim="prompts-btn"]', {
      x: -20,
      opacity: 0,
      duration: 0.45,
    }, 0.55);

    return () => { tl.kill(); };
  }, [enabled]);
}
