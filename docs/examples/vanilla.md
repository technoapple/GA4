# Vanilla JavaScript Integration Guide

Use this setup for plain JavaScript or TypeScript browser apps.

## Install

```bash
npm install @technoapple/ga4
```

## Basic setup

```ts
import {
  ga4,
  EventTracker,
  OutboundLinkTracker,
  UrlChangeTracker,
} from '@technoapple/ga4';

ga4.init({ targetId: 'G-XXXXXXX' });

ga4.use(EventTracker);
ga4.use(OutboundLinkTracker);
ga4.use(UrlChangeTracker, { trackReplaceState: true });

// Custom event
ga4.send('app_loaded', {
  app_name: 'marketing_site',
});
```

## Declarative tracking in HTML

```html
<button
  data-ga4-on="click"
  data-ga4-event-name="cta_click"
  data-ga4-cta-name="hero_primary"
>
  Get Started
</button>
```

With `EventTracker`, this emits:

```ts
gtag('event', 'cta_click', {
  cta_name: 'hero_primary',
});
```

## Cleanup (if needed)

If the page shell hot-swaps modules or widgets, remove listeners before re-initializing:

```ts
ga4.removeAll();
```

## Notes

- Initialize once at app startup.
- Register plugins after `ga4.init(...)`.
- Avoid duplicate page-view logic if another script already tracks history changes.
