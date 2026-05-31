/// <reference path="../../node_modules/gsap/types/gsap.d.ts" />
/**
 * usePageAnimations
 * Runs a coordinated GSAP entrance animation for the main iTab page.
 * Called once on mount when gsapAnimations === true.
 */
import { useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gsap: any = (await import('gsap' as string)).gsap
  ?? (await import('gsap' as string)).default;

export function usePageAnimations(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { gsap: g } = (await import('gsap' as string)) as any;

      g.killTweensOf([
        '[data-anim="bg"]',
        '[data-anim="topbar"]',
        '[data-anim="aibar"]',
        '[data-anim="appgrid"]',
        '[data-anim="app-icon"]',
        '[data-anim="dock"]',
        '[data-anim="widgets"]',
        '[data-anim="prompts-btn"]',
      ]);

      const tl = g.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('[data-anim="bg"]',          { opacity: 0, duration: 0.7 }, 0);
      tl.from('[data-anim="topbar"]',      { y: -32, opacity: 0, duration: 0.55 }, 0.1);
      tl.from('[data-anim="aibar"]',       { y: -20, opacity: 0, duration: 0.5  }, 0.22);
      tl.from('[data-anim="app-icon"]',    {
        y: 22, opacity: 0, scale: 0.82, duration: 0.5,
        stagger: { amount: 0.35, from: 'start', grid: 'auto' },
      }, 0.28);
      tl.from('[data-anim="dock"]',        { y: 40, opacity: 0, duration: 0.55 }, 0.45);
      tl.from('[data-anim="widgets"]',     { x: 28, opacity: 0, duration: 0.5  }, 0.5);
      tl.from('[data-anim="prompts-btn"]', { x: -20, opacity: 0, duration: 0.45 }, 0.55);
    })();
  }, [enabled]);
}
