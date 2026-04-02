# Vue Integration Guide

This guide shows a safe integration pattern for Vue 3 applications.

## Install

```bash
npm install @technoapple/ga4
```

## 1) Create an analytics plugin

```ts
// src/plugins/analytics.ts
import type { App } from 'vue';
import {
  ga4,
  EventTracker,
  OutboundLinkTracker,
  UrlChangeTracker,
} from '@technoapple/ga4';

let initialized = false;

export default {
  install(_app: App) {
    if (initialized) return;
    initialized = true;

    ga4.init({ targetId: 'G-XXXXXXX' });

    ga4.use(EventTracker);
    ga4.use(OutboundLinkTracker);
    ga4.use(UrlChangeTracker, { trackReplaceState: true });
  },
};

export { ga4 };
```

Register it in app bootstrap:

```ts
// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import analytics from './plugins/analytics';

createApp(App)
  .use(analytics)
  .mount('#app');
```

## 2) Send custom events

```vue
<script setup lang="ts">
import { ga4 } from '@/plugins/analytics';

function onStartTrial() {
  ga4.send('start_trial_click', {
    plan: 'pro',
    placement: 'hero',
  });
}
</script>

<template>
  <button @click="onStartTrial">Start trial</button>
</template>
```

## 3) Optional cleanup (embedded Vue app)

If your Vue app is mounted/unmounted by another host shell, clean up listeners when disposing the app:

```ts
import { ga4 } from '@/plugins/analytics';

ga4.removeAll();
```

## Vue-specific notes

- Keep initialization in one plugin/module to avoid duplicate listeners.
- If you already send page views in router hooks, avoid double page-view tracking with `UrlChangeTracker`.
- Register plugins after `ga4.init(...)`.
