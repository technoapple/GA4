# @technoapple/ga4

A lightweight TypeScript GA4 helper for browser apps.

It provides:
- A simple GA4 wrapper (`init`, `send`, direct `gtag` access)
- A `dataLayer` helper (`dataLayerHelper.get`)
- Opt-in automatic tracking plugins (event delegation, outbound tracking, SPA page views, impression tracking, URL cleanup, media query tracking)

## Why this library

GA4 and `gtag.js` are flexible, but many teams still need reusable browser-side utilities:
- Keep initialization and event sending consistent
- Add automatic tracking without wiring listeners repeatedly
- Keep plugin logic tree-shakeable and removable

## Installation

```bash
npm install @technoapple/ga4
```

## Quick Start

```ts
import { ga4 } from '@technoapple/ga4';

ga4.init({ targetId: 'G-XXXXXXX' });

ga4.send('sign_up', {
    method: 'email',
    plan: 'pro',
});
```

## API

### `ga4.init(option)`

Initializes `window.dataLayer` and `window.gtag`, then sends:
- `gtag('js', new Date())`
- `gtag('config', option.targetId)`

```ts
ga4.init({ targetId: 'G-XXXXXXX' });
```

### `ga4.send(eventName, eventParameters)`

Sends a GA4 event through `gtag('event', ...)`.

```ts
ga4.send('purchase', {
    transaction_id: 'order_123',
    value: 99,
    currency: 'USD',
});
```

### `ga4.gtag`

Direct access to the typed `gtag` function.

```ts
ga4.gtag('event', 'login', { method: 'google' });
```

### `ga4.use(PluginClass, options?)`

Registers a plugin and returns its instance.

```ts
import { ga4, OutboundLinkTracker } from '@technoapple/ga4';

const tracker = ga4.use(OutboundLinkTracker, {
    eventName: 'outbound_link_click',
});

// Later
tracker.remove();
```

### `ga4.removeAll()`

Unregisters all plugins and calls each plugin's `remove()`.

### `dataLayerHelper.get(key, getLast?)`

Reads values from `window.dataLayer`.

- `getLast` omitted or `false`: returns first matching value
- `getLast` set to `true`: returns last matching value

```ts
import { dataLayerHelper } from '@technoapple/ga4';

const firstValue = dataLayerHelper.get('campaign');
const latestValue = dataLayerHelper.get('campaign', true);
```

## Plugin Catalog

All plugins implement:

```ts
interface GA4Plugin {
    remove(): void;
}
```

### `EventTracker`

Declarative DOM tracking via attributes (default prefix: `data-ga4-`).

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `events` | `string[]` | `['click']` | DOM events to listen to via delegation |
| `attributePrefix` | `string` | `'data-ga4-'` | Reads attributes like `data-ga4-on` and `data-ga4-event-name` |
| `hitFilter` | `(params, element, event) => Record<string, unknown> \| null` | `undefined` | Return `null` to skip sending |

Defaults:
- `events: ['click']`
- `attributePrefix: 'data-ga4-'`

Example:

```html
<button
    data-ga4-on="click"
    data-ga4-event-name="video_play"
    data-ga4-video-title="Summer Launch">
    Play
</button>
```

```ts
import { ga4, EventTracker } from '@technoapple/ga4';

ga4.use(EventTracker);
```

### `OutboundLinkTracker`

Tracks clicks on links whose hostname differs from `location.hostname`.

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `events` | `string[]` | `['click']` | Event types for delegated tracking |
| `linkSelector` | `string` | `'a, area'` | CSS selector for trackable links |
| `shouldTrackOutboundLink` | `(link, parseUrl) => boolean` | Built-in external-hostname matcher | Override outbound detection logic |
| `eventName` | `string` | `'outbound_link_click'` | Custom event name |
| `hitFilter` | `(params, element, event) => Record<string, unknown> \| null` | `undefined` | Return `null` to cancel event |

Defaults:
- `events: ['click']`
- `linkSelector: 'a, area'`
- `eventName: 'outbound_link_click'`

Default params:
- `link_url`
- `link_domain`
- `outbound: true`

### `OutboundFormTracker`

Tracks form submissions whose `form.action` points to an external hostname.

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `formSelector` | `string` | `'form'` | CSS selector for forms to observe |
| `shouldTrackOutboundForm` | `(form, parseUrl) => boolean` | Built-in external-hostname matcher | Override outbound detection logic |
| `eventName` | `string` | `'outbound_form_submit'` | Custom event name |
| `hitFilter` | `(params, element, event) => Record<string, unknown> \| null` | `undefined` | Return `null` to cancel event |

Defaults:
- `formSelector: 'form'`
- `eventName: 'outbound_form_submit'`

Default params:
- `form_action`
- `form_domain`
- `outbound: true`

### `PageVisibilityTracker`

Tracks visible/hidden durations using `document.visibilityState`.

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `sendInitialPageview` | `boolean` | `false` | Sends initial `page_view` when page is visible |
| `sessionTimeout` | `number` | `30` | Minutes before visible return triggers new `page_view` |
| `eventName` | `string` | `'page_visibility'` | Custom visibility event name |
| `hitFilter` | `(params) => Record<string, unknown> \| null` | `undefined` | Return `null` to skip event |

Defaults:
- `sendInitialPageview: false`
- `sessionTimeout: 30` (minutes)
- `eventName: 'page_visibility'`

Default params:
- `visibility_state`
- `visibility_duration`
- `page_path`

### `UrlChangeTracker`

Tracks SPA navigation by patching `history.pushState`, optional `replaceState`, and listening to `popstate`.

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `shouldTrackUrlChange` | `(newPath, oldPath) => boolean` | `newPath !== oldPath` | Decide when to emit `page_view` |
| `trackReplaceState` | `boolean` | `false` | Also patch `history.replaceState` |
| `hitFilter` | `(params) => Record<string, unknown> \| null` | `undefined` | Return `null` to skip event |

Defaults:
- `trackReplaceState: false`

Sends `page_view` with:
- `page_path`
- `page_title`
- `page_location`

### `ImpressionTracker`

Tracks element impressions with `IntersectionObserver` and dynamic DOM changes via `MutationObserver`.

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `elements` | `Array<string \| ImpressionElementConfig>` | `[]` | Element IDs or config objects to observe |
| `rootMargin` | `string` | `'0px'` | Passed to `IntersectionObserver` |
| `attributePrefix` | `string` | `'data-ga4-'` | Reads matching element attributes into params |
| `eventName` | `string` | `'element_impression'` | Custom event name |
| `hitFilter` | `(params, element) => Record<string, unknown> \| null` | `undefined` | Return `null` to skip event |

Defaults:
- `rootMargin: '0px'`
- `attributePrefix: 'data-ga4-'`
- `eventName: 'element_impression'`

Can observe with element IDs or configs:

```ts
import { ga4, ImpressionTracker } from '@technoapple/ga4';

ga4.use(ImpressionTracker, {
    elements: [
        'hero-banner',
        { id: 'cta-block', threshold: 0.5, trackFirstImpressionOnly: true },
    ],
});
```

### `CleanUrlTracker`

Intercepts `gtag` calls for `config` and `page_view` payloads and normalizes:
- `page_location`
- `page_path`

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `stripQuery` | `boolean` | `false` | Remove all query params unless allowlist is set |
| `queryParamsAllowlist` | `string[]` | `undefined` | Keep only selected params when stripping query |
| `queryParamsDenylist` | `string[]` | `undefined` | Remove selected params when not stripping query |
| `trailingSlash` | `'add' \| 'remove'` | `undefined` | Normalize `page_path` slash behavior |
| `urlFilter` | `(url) => string` | `undefined` | Final custom URL transform |

Options include:
- `stripQuery`
- `queryParamsAllowlist`
- `queryParamsDenylist`
- `trailingSlash: 'add' | 'remove'`
- `urlFilter`

### `MediaQueryTracker`

Tracks responsive breakpoint changes using `matchMedia`.

Options matrix:

| Option | Type | Default | Notes |
|---|---|---|---|
| `definitions` | `MediaQueryDefinition[]` | `[]` | Named breakpoint sets to track |
| `changeTemplate` | `(oldValue, newValue) => string` | `${oldValue} => ${newValue}` | Label formatter for change payload |
| `changeTimeout` | `number` | `1000` | Debounce delay in ms |
| `eventName` | `string` | `'media_query_change'` | Custom event name |
| `hitFilter` | `(params) => Record<string, unknown> \| null` | `undefined` | Return `null` to skip event |

Defaults:
- `changeTimeout: 1000`
- `eventName: 'media_query_change'`

Default params:
- `media_query_name`
- `media_query_value`
- `media_query_change`

## Plugin Lifecycle

Use either approach:

```ts
const plugin = ga4.use(EventTracker);
plugin.remove();
```

```ts
ga4.removeAll();
```

## Full Example

```ts
import {
    ga4,
    EventTracker,
    OutboundLinkTracker,
    UrlChangeTracker,
    CleanUrlTracker,
} from '@technoapple/ga4';

ga4.init({ targetId: 'G-XXXXXXX' });

ga4.use(CleanUrlTracker, {
    stripQuery: true,
    queryParamsAllowlist: ['utm_source', 'utm_medium', 'utm_campaign'],
    trailingSlash: 'remove',
});

ga4.use(EventTracker, { events: ['click', 'submit'] });
ga4.use(OutboundLinkTracker);
ga4.use(UrlChangeTracker, { trackReplaceState: true });

ga4.send('app_initialized', { env: 'production' });
```

## TypeScript Support

The package ships type definitions and exports plugin option types, including:
- `EventTrackerOptions`
- `OutboundLinkTrackerOptions`
- `OutboundFormTrackerOptions`
- `PageVisibilityTrackerOptions`
- `UrlChangeTrackerOptions`
- `ImpressionTrackerOptions`
- `CleanUrlTrackerOptions`
- `MediaQueryTrackerOptions`

## Development

```bash
npm run build
npm test
npm run test:coverage
```

## Notes

- Browser-focused library: APIs rely on `window`, `document`, and browser events.
- Call `ga4.init(...)` before sending events or registering plugins.
- If you register many plugins, clean them up with `remove()` or `ga4.removeAll()` to avoid duplicate listeners in long-lived apps.

## License

ISC