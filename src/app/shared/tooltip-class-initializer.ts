import { Injectable } from '@angular/core';

/**
 * Adds the 'mi-tooltip' CSS class to any tooltip DOM nodes created at runtime.
 * This covers ng-bootstrap tooltips (.tooltip) and PrimeNG tooltips (.p-tooltip).
 * It runs once at app init and installs a MutationObserver to handle dynamic nodes.
 */
export function tooltipClassInitializer() {
  return () => {
    try {
      const addClassToNode = (node: Element) => {
        if (!node) return;
        try {
          if (node.classList && (node.classList.contains('tooltip') || node.classList.contains('p-tooltip'))) {
            node.classList.add('mi-tooltip');
          }
        } catch (e) {
          // ignore
        }
      };

      // Add to already existing tooltips (if any)
      document.querySelectorAll('.tooltip, .p-tooltip').forEach(el => {
        try { el.classList.add('mi-tooltip'); } catch (e) {}
      });

      // Observe future additions to the DOM and add class when tooltip nodes appear
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach(n => {
            if (n instanceof Element) {
              // direct match
              if (n.matches && (n.matches('.tooltip') || n.matches('.p-tooltip'))) {
                addClassToNode(n);
              }
              // nested matches
              n.querySelectorAll && n.querySelectorAll('.tooltip, .p-tooltip').forEach(el => addClassToNode(el));
            }
          });
        }
      });

      // Start observing the body for additions
      if (typeof document !== 'undefined' && document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    } catch (e) {
      // Fail silently: nothing critical if this doesn't run
      // console.warn('tooltipClassInitializer failed', e);
    }
  };
}
