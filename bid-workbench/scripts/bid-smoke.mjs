// Compatibility entry point for the current full smoke suite. Build first.
await import('./unit-smoke.mjs');
await import('./collaboration-smoke.mjs');
await import('./demo-smoke.mjs');
await import('./lifecycle-smoke.mjs');
await import('./evidence-sync-smoke.mjs');
