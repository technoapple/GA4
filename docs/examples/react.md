# React Integration Guide

This guide shows a safe integration pattern for React applications.

## Install

```bash
npm install @technoapple/ga4
```

## 1) Initialize once

Create a small analytics module and initialize GA4 exactly once.

```ts
// src/analytics.ts
import {
  ga4,
  EventTracker,
  OutboundLinkTracker,
  UrlChangeTracker,
} from '@technoapple/ga4';

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  initialized = true;

  ga4.init({ targetId: 'G-XXXXXXX' });

  ga4.use(EventTracker);
  ga4.use(OutboundLinkTracker);
  ga4.use(UrlChangeTracker, { trackReplaceState: true });
}

export { ga4 };
```

Call it in your app entry.

```tsx
// src/main.tsx or src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initAnalytics } from './analytics';

initAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## 2) Send custom events

```tsx
import { ga4 } from './analytics';

export function BuyButton() {
  return (
    <button
      onClick={() => {
        ga4.send('purchase_click', {
          sku: 'plan_pro',
          source: 'pricing_page',
        });
      }}
    >
      Buy now
    </button>
  );
}
```

## 3) Optional cleanup (micro-frontend or test environments)

In most SPAs, analytics lives for the app lifetime. If your host mounts/unmounts React apps, clean up listeners:

```ts
import { ga4 } from './analytics';

export function disposeAnalytics() {
  ga4.removeAll();
}
```

## React-specific notes

- React Strict Mode can double-invoke lifecycle flows in development. The `initialized` guard prevents duplicate plugin registration.
- If your router already emits page views, avoid duplicate tracking with `UrlChangeTracker`.
- Register plugins after `ga4.init(...)`.
