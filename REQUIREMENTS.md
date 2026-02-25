# Project Requirements — @technoapple/ga4 v2.0

> **Version:** 2.0  
> **Last Updated:** 2026-02-24  
> **Author:** keke78ui9  
> **Status:** Draft  
> **Reference:** [googleanalytics/autotrack](https://github.com/googleanalytics/autotrack) — tracking concepts adapted for GA4

---

## 1. Overview

**Project Name:** @technoapple/ga4  
**Description:** A TypeScript library that provides functions to support sending GA4 events, interacting with `window.dataLayer`, and **automatic tracking plugins** — providing enhanced tracking capabilities beyond GA4's built-in enhanced measurement.

**Goals:**
- Provide automatic tracking plugins for GA4 via `gtag()` / `dataLayer`
- Maintain the existing `ga4.init()`, `ga4.send()`, `ga4.gtag`, and `dataLayerHelper.get()` APIs
- Provide each plugin as an opt-in module (tree-shakeable) so consumers only pay for what they use
- Written in TypeScript with full type safety, following the existing codebase patterns
- Zero third-party runtime dependencies (browser APIs only)

**Out of Scope:**
- Server-side tracking / Measurement Protocol
- Google Tag Manager container management

---

## 2. Background & Motivation

GA4's built-in enhanced measurement covers some basic automatic tracking (page views, scroll to 90%, outbound clicks, site search, video engagement, file downloads). However, many advanced tracking scenarios are not covered:

- **Declarative event tracking** via HTML attributes (no JS needed)
- **Granular scroll depth** tracking is limited — GA4 only fires a single event at 90%
- **Page visibility** duration (time in foreground vs. background tab)
- **SPA URL changes** require manual setup in many frameworks
- **Element impression** tracking (ads, CTAs entering the viewport)
- **Outbound form** submit tracking
- **URL normalization** to prevent fragmented reporting
- **Media query / breakpoint** change tracking

This library provides these capabilities as TypeScript plugins that integrate with GA4 via `gtag('event', ...)`.

> **Note:** GA4 enhanced measurement already tracks scroll events (at 90% depth). This library does **not** duplicate that — instead it focuses on capabilities GA4 does not provide out of the box.

---

## 3. Functional Requirements — Existing Features (Already Implemented)

| ID     | Requirement                         | Priority | Status    |
|--------|-------------------------------------|----------|-----------|
| FR-001 | GA4 initialization via `ga4.init()` | High     | ✅ Done   |
| FR-002 | Send events via `ga4.send()`        | High     | ✅ Done   |
| FR-003 | Direct `gtag()` access              | High     | ✅ Done   |
| FR-004 | Read values from `dataLayer`        | Medium   | ✅ Done   |

---

## 4. Functional Requirements — New Plugins

### 4.1 Plugin Summary

| # | Plugin                   | Priority | Rationale |
|---|--------------------------|----------|-----------|
| 1 | `eventTracker`           | High     | Declarative event tracking via HTML `data-*` attributes. No JS needed for page authors. |
| 2 | `outboundLinkTracker`    | High     | Click delegation on `<a>` elements, compare hostnames. Uses `navigator.sendBeacon` for reliability. |
| 3 | `outboundFormTracker`    | Medium   | Submit delegation on `<form>` elements with external `action` URLs. |
| 4 | `pageVisibilityTracker`  | High     | `document.visibilitychange` API. Track visible/hidden time. Handle session timeout. |
| 5 | `urlChangeTracker`       | High     | `popstate` + monkey-patch `history.pushState`/`replaceState` for SPA `page_view` tracking. |
| 6 | `impressionTracker`      | Medium   | `IntersectionObserver` + `MutationObserver`. Track element visibility in viewport. |
| 7 | `cleanUrlTracker`        | Medium   | Normalize URLs before sending `page_view` (strip query params, trailing slashes, force lowercase). |
| 8 | `mediaQueryTracker`      | Low      | `window.matchMedia` API. Track responsive breakpoint changes. |

### 4.2 Detailed Plugin Requirements

---

#### FR-100: `eventTracker` — Declarative Event Tracking via HTML Attributes

**Description:**  
Allow page authors to track user interactions by adding `data-ga4-*` attributes to HTML elements, without writing JavaScript. The plugin listens for DOM events (click, submit, etc.) on elements matching a configurable selector and sends GA4 events based on attribute values.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `events` | `string[]` | `['click']` | DOM event types to listen for |
| `attributePrefix` | `string` | `'data-ga4-'` | Prefix for data attributes |
| `hitFilter` | `(params, element, event) => params \| null` | `undefined` | Filter/modify params before sending |

**HTML Example:**
```html
<button
  data-ga4-on="click"
  data-ga4-event-name="video_play"
  data-ga4-video-title="My Video"
  data-ga4-video-id="abc123">
  Play video
</button>
```

**Sent as:**
```js
gtag('event', 'video_play', { video_title: 'My Video', video_id: 'abc123' });
```

**Acceptance Criteria:**
- [ ] Reads event name from `data-ga4-event-name` attribute
- [ ] Reads all `data-ga4-*` attributes as event parameters (kebab-case → snake_case)
- [ ] Supports configurable event types (`click`, `submit`, `change`, etc.)
- [ ] Uses event delegation on `document` for performance
- [ ] Provides `remove()` method to clean up listeners
- [ ] Does not throw errors when attributes are missing

**Implementation Notes:**
- Use event delegation (single listener on `document`) for performance
- Convert `data-ga4-video-title` → `video_title` parameter name
- Implement lightweight internal `delegate()` utility (zero dependencies)

---

#### FR-101: `outboundLinkTracker` — Automatic Outbound Link Click Tracking

**Description:**  
Automatically detect when a user clicks a link pointing to an external domain and send a GA4 event.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `events` | `string[]` | `['click']` | DOM events to listen for (e.g. add `'auxclick'`, `'contextmenu'`) |
| `linkSelector` | `string` | `'a, area'` | CSS selector for link elements |
| `shouldTrackOutboundLink` | `(link: HTMLAnchorElement, parseUrl: Function) => boolean` | hostname !== location.hostname | Customize outbound detection |
| `eventName` | `string` | `'outbound_link_click'` | GA4 event name |
| `attributePrefix` | `string` | `'data-ga4-'` | Prefix for declarative attribute overrides |
| `hitFilter` | `Function` | `undefined` | Filter/modify params before sending |

**Default event parameters sent:**

| Parameter | Value |
|-----------|-------|
| `event_name` | `'outbound_link_click'` |
| `link_url` | Full href of the clicked link |
| `link_domain` | Hostname of the outbound link |
| `outbound` | `true` |

**Acceptance Criteria:**
- [ ] Detects clicks on `<a>` and `<area>` elements pointing to external domains
- [ ] Uses `navigator.sendBeacon` transport for reliability (page may unload)
- [ ] Supports right-click and middle-click tracking via `events` option
- [ ] Provides `shouldTrackOutboundLink` callback for custom domain logic
- [ ] Provides `remove()` method to clean up all event listeners
- [ ] Handles links with `xlink:href` (SVG links)

---

#### FR-102: `outboundFormTracker` — Automatic Outbound Form Submit Tracking

**Description:**  
Automatically detect when a form is submitted to an external domain and send a GA4 event.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `formSelector` | `string` | `'form'` | CSS selector for forms |
| `shouldTrackOutboundForm` | `(form: HTMLFormElement, parseUrl: Function) => boolean` | action hostname !== location.hostname | Custom detection |
| `eventName` | `string` | `'outbound_form_submit'` | GA4 event name |
| `hitFilter` | `Function` | `undefined` | Filter/modify params |

**Acceptance Criteria:**
- [ ] Detects form submits where `form.action` points to an external domain
- [ ] Delays form submission briefly to ensure the GA4 event is sent
- [ ] Falls back gracefully if `navigator.sendBeacon` is not available
- [ ] Provides `remove()` method

---

#### FR-103: `pageVisibilityTracker` — Page Visibility Duration Tracking

**Description:**  
Track how long a page is in the visible state vs. hidden (background tab). Optionally send a new `page_view` when the page becomes visible again after session timeout.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `sendInitialPageview` | `boolean` | `false` | Plugin handles the initial page_view |
| `sessionTimeout` | `number` | `30` (minutes) | Minutes of hidden time before new session |
| `timeZone` | `string` | `undefined` | IANA timezone for session boundary |
| `pageLoadsMetricIndex` | `number` | `undefined` | Custom metric index |
| `visibleMetricIndex` | `number` | `undefined` | Custom metric for visible time |
| `eventName` | `string` | `'page_visibility'` | GA4 event name |
| `hitFilter` | `Function` | `undefined` | Filter/modify params |

**Default event parameters sent:**

| Parameter | Value |
|-----------|-------|
| `event_name` | `'page_visibility'` |
| `visibility_state` | `'visible'` or `'hidden'` |
| `visibility_duration` | Time in ms the page was in previous state |
| `page_path` | Current page path |

**Acceptance Criteria:**
- [ ] Listens for `visibilitychange` events on `document`
- [ ] Tracks cumulative visible time accurately
- [ ] Optionally sends new `page_view` on visible→hidden→visible session timeout
- [ ] Sends final visibility duration on `beforeunload`
- [ ] Provides `remove()` method

---

#### FR-104: `urlChangeTracker` — SPA URL Change Tracking

**Description:**  
Automatically track URL changes in Single Page Applications by intercepting `history.pushState()`, `history.replaceState()`, and `popstate` events, sending a `page_view` event for each navigation.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `shouldTrackUrlChange` | `(newPath: string, oldPath: string) => boolean` | `newPath !== oldPath` | Custom logic for what counts as a URL change |
| `trackReplaceState` | `boolean` | `false` | Whether `replaceState` triggers tracking |
| `hitFilter` | `Function` | `undefined` | Filter/modify params |

**Default event parameters sent:**

| Parameter | Value |
|-----------|-------|
| `event_name` | `'page_view'` |
| `page_path` | New URL path |
| `page_title` | `document.title` |
| `page_location` | Full URL |

**Acceptance Criteria:**
- [ ] Monkey-patches `history.pushState` and optionally `history.replaceState`
- [ ] Listens for `popstate` events (back/forward navigation)
- [ ] Sends `page_view` GA4 event on each tracked URL change
- [ ] Provides `shouldTrackUrlChange` callback for filtering
- [ ] Restores original `history.pushState`/`replaceState` on `remove()`
- [ ] Does not double-fire for the initial page load

---

#### FR-105: `impressionTracker` — Element Viewport Impression Tracking

**Description:**  
Track when specific DOM elements become visible in the viewport using `IntersectionObserver`. Useful for tracking ad impressions, CTA visibility, etc.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `elements` | `Array<string \| ElementConfig>` | `[]` | Element IDs or config objects to observe |
| `rootMargin` | `string` | `'0px'` | IntersectionObserver rootMargin |
| `attributePrefix` | `string` | `'data-ga4-'` | Attribute prefix for declarative params |
| `eventName` | `string` | `'element_impression'` | GA4 event name |
| `hitFilter` | `Function` | `undefined` | Filter/modify params |

**Element config object:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | — | Element ID to observe |
| `threshold` | `number` | `0` | Visibility ratio (0-1) to trigger |
| `trackFirstImpressionOnly` | `boolean` | `true` | Only fire once per element |

**Acceptance Criteria:**
- [ ] Uses `IntersectionObserver` API to detect element visibility
- [ ] Uses `MutationObserver` to handle dynamically added/removed elements
- [ ] Supports per-element threshold configuration
- [ ] Supports `trackFirstImpressionOnly` option
- [ ] Provides `observeElements()`, `unobserveElements()`, `unobserveAllElements()` methods
- [ ] Feature-detects `IntersectionObserver` / `MutationObserver` — no-ops gracefully if unsupported
- [ ] Provides `remove()` method

---

#### FR-106: `cleanUrlTracker` — URL Normalization for page_view Events

**Description:**  
Normalize URLs before they are sent with `page_view` events to ensure consistency in GA4 reports.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `stripQuery` | `boolean` | `false` | Remove query string from URLs |
| `queryParamsAllowlist` | `string[]` | `undefined` | Query params to keep (when `stripQuery` is true) |
| `queryParamsDenylist` | `string[]` | `undefined` | Specific query params to remove |
| `trailingSlash` | `'add' \| 'remove'` | `undefined` | Normalize trailing slashes |
| `urlFilter` | `(url: string) => string` | `undefined` | Custom URL transformation function |

**Acceptance Criteria:**
- [ ] Strips query parameters when configured
- [ ] Supports allowlist/denylist for selective query param removal
- [ ] Normalizes trailing slashes
- [ ] Applies custom `urlFilter` function
- [ ] Applies transformations to `page_location` and `page_path` in page_view events
- [ ] Provides `remove()` method

---

#### FR-107: `mediaQueryTracker` — Responsive Breakpoint Tracking

**Description:**  
Track which CSS media query breakpoints match and fire events when breakpoints change.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `definitions` | `MediaQueryDefinition[]` | `[]` | Array of media query definitions |
| `changeTemplate` | `(oldValue: string, newValue: string) => string` | `'${oldValue} => ${newValue}'` | Template for change events |
| `changeTimeout` | `number` | `1000` | Debounce timeout in ms |
| `eventName` | `string` | `'media_query_change'` | GA4 event name |
| `hitFilter` | `Function` | `undefined` | Filter/modify params |

**MediaQueryDefinition:**

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | e.g. `'Breakpoint'` |
| `dimensionIndex` | `number` | Custom dimension index |
| `items` | `Array<{name: string, media: string}>` | Media query items |

**Acceptance Criteria:**
- [ ] Uses `window.matchMedia()` API
- [ ] Fires event on breakpoint change with old and new values
- [ ] Debounces rapid changes (e.g. window resize)
- [ ] Feature-detects `matchMedia` — no-ops if unsupported
- [ ] Provides `remove()` method

---

## 5. Non-Functional Requirements

| ID      | Requirement              | Priority | Status      |
|---------|--------------------------|----------|-------------|
| NFR-001 | Modern Browser Support   | High     | Not Started |
| NFR-002 | TypeScript Type Safety   | High     | Not Started |
| NFR-003 | Zero Runtime Dependencies | High    | Not Started |
| NFR-004 | Tree-Shakeable Plugins   | High     | Not Started |
| NFR-005 | Bundle Size < 8KB gzip   | Medium   | Not Started |
| NFR-006 | Test Coverage >= 80%     | Medium   | Not Started |
| NFR-007 | Documentation per Plugin | Medium   | Not Started |
| NFR-008 | Graceful Feature Detection | High   | Not Started |

### 5.1 Details

- **Browser Compatibility:** Chrome 64+, Firefox 67+, Safari 12+, Edge 79+ (all browsers supporting `IntersectionObserver`, `MutationObserver`, `navigator.sendBeacon`)
- **TypeScript Version:** >= 4.x
- **Bundle Size Target:** < 8KB gzipped (all plugins), individual plugins < 2KB each
- **Test Coverage Target:** >= 80% line coverage
- **Graceful Degradation:** All plugins must feature-detect required browser APIs and silently no-op if unsupported (never throw errors)

---

## 6. Technical Requirements

- **Language:** TypeScript (strict mode)
- **Build Tool:** tsc
- **Test Framework:** Jest + jsdom
- **Package Registry:** npm (public, `@technoapple/ga4`)
- **Module Format:** CommonJS + ESM (dual publish)
- **Runtime Dependencies:** None (zero dependencies)
- **Node.js Version:** >= 16

---

## 7. Architecture & API Design

### 7.1 Existing APIs (unchanged)

| API | Method | Parameters | Returns | Description |
|-----|--------|------------|---------|-------------|
| `ga4` | `init` | `options: ga4Option` | `void` | Initialize GA4 with targetId |
| `ga4` | `send` | `event: string, params: KeyValueParams` | `boolean` | Send a GA4 event |
| `ga4` | `gtag` | (getter) | `gtag` | Direct access to `window.gtag` |
| `dataLayerHelper` | `get` | `key: string, getLast?: boolean` | `any` | Retrieve value from dataLayer |

### 7.2 New Plugin Architecture

Each plugin follows a consistent pattern:

```typescript
interface PluginInterface {
  remove(): void;  // Clean up all listeners, restore original state
}
```

**Plugin registration pattern (follows existing singleton pattern):**

```typescript
import { ga4, plugins } from '@technoapple/ga4';

// Initialize GA4 (existing)
ga4.init({ targetId: 'G-XXXXXXX' });

// Register plugins (new)
ga4.use(plugins.outboundLinkTracker, { /* options */ });
ga4.use(plugins.pageVisibilityTracker);
ga4.use(plugins.urlChangeTracker);

// Or import individual plugins directly
import { OutboundLinkTracker } from '@technoapple/ga4/plugins';
const tracker = new OutboundLinkTracker(ga4, { /* options */ });
tracker.remove(); // cleanup
```

### 7.3 Proposed File Structure

```
src/
  index.ts                          # Main exports (existing + new)
  ga4/
    ga4.ts                          # Core GA4 class (existing, add .use() method)
    ga4option.ts                    # Options interface (existing)
    index.ts                        # GA4 barrel export (existing)
  dataLayer.ts                      # DataLayer helper (existing)
  util.ts                           # Utilities (existing, extend)
  types/
    dataLayer.ts                    # DataLayer types (existing)
    global.ts                       # Window augmentation (existing)
    gtag.ts                         # gtag type definitions (existing)
    plugins.ts                      # Plugin option types (new)
  plugins/
    index.ts                        # Barrel export for all plugins
    plugin-base.ts                  # Base class / interface for plugins
    event-tracker.ts                # FR-100
    outbound-link-tracker.ts        # FR-101
    outbound-form-tracker.ts        # FR-102
    page-visibility-tracker.ts      # FR-103
    url-change-tracker.ts           # FR-104
    impression-tracker.ts           # FR-105
    clean-url-tracker.ts            # FR-106
    media-query-tracker.ts          # FR-107
  helpers/
    delegate.ts                     # Event delegation utility
    parse-url.ts                    # URL parsing utility
    dom-ready.ts                    # DOM ready utility
    session.ts                      # Session timeout / storage utilities
    debounce.ts                     # Debounce utility
test/
  dataLayer.spec.ts                 # Existing
  ga4.spec.ts                       # Existing
  plugins/
    event-tracker.spec.ts
    outbound-link-tracker.spec.ts
    outbound-form-tracker.spec.ts
    page-visibility-tracker.spec.ts
    url-change-tracker.spec.ts
    impression-tracker.spec.ts
    clean-url-tracker.spec.ts
    media-query-tracker.spec.ts
  helpers/
    delegate.spec.ts
    parse-url.spec.ts
    session.spec.ts
```

### 7.4 Internal Utilities

Lightweight internal helpers to keep zero runtime dependencies:

| Utility | File | Description |
|---------|------|-------------|
| `delegate` | `helpers/delegate.ts` | Event delegation using `document.addEventListener` + selector matching |
| `parseUrl` | `helpers/parse-url.ts` | Create an `<a>` element to parse URLs (returns `Location`-like object) |
| `domReady` | `helpers/dom-ready.ts` | Wait for DOM `DOMContentLoaded` |
| `sessionManager` | `helpers/session.ts` | `sessionStorage`-based session tracking with configurable timeout |
| `debounce` | `helpers/debounce.ts` | Standard debounce implementation |

---

## 8. User Stories

| ID    | Story | Priority |
|-------|-------|----------|
| US-01 | As a developer, I want to track outbound link clicks automatically so I can see which external sites users navigate to | High |
| US-02 | As a developer, I want to track page visibility so I can measure actual engagement time | High |
| US-03 | As a developer, I want SPA URL changes to automatically send page_view events so my GA4 reports are accurate | High |
| US-04 | As a content author, I want to add tracking via HTML data attributes without writing JavaScript | High |
| US-05 | As a developer, I want to track when specific elements (ads, CTAs) become visible in the viewport | Medium |
| US-06 | As a developer, I want to track outbound form submissions so I don't lose visibility when users are sent to external payment/signup pages | Medium |
| US-07 | As a developer, I want to normalize page URLs in my tracking to avoid fragmented data in GA4 reports | Medium |
| US-08 | As a developer, I want to track which responsive breakpoints are active so I can correlate device size with behavior | Low |
| US-09 | As a developer, I want to only import the plugins I need so my bundle size stays small | High |

---

## 9. Constraints & Assumptions

### Constraints
- Must not introduce any third-party runtime dependencies
- Must work in browser environments only (`window`, `document` required)
- Must be backward compatible — existing `ga4.init()`, `ga4.send()`, `ga4.gtag`, `dataLayerHelper.get()` APIs must not change
- Each plugin must be independently importable (tree-shakeable)
- All DOM event listeners must be removable (no leaks)

### Assumptions
- `window` and `document` are available (browser environment)
- GA4's `gtag.js` script is loaded by the consumer (or `ga4.init()` has been called)
- Consumers use modern browsers (no IE11 support needed)
- `sessionStorage` is available for session-based tracking

---

## 10. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Google changes gtag.js API | High | Low | Use documented public API only; abstract `gtag()` calls through our `ga4.send()` |
| IntersectionObserver not available in older browsers | Medium | Low | Feature detection — impressionTracker silently no-ops |
| Monkey-patching `history.pushState` conflicts with other libraries (e.g. React Router) | Medium | Medium | Carefully chain the original function; test with popular routers |
| `sendBeacon` not available | Low | Low | Fallback to synchronous XHR or `_blank` target trick |
| `sessionStorage` quota exceeded or disabled | Low | Low | Wrap in try-catch, degrade gracefully |

---

## 11. Implementation Order & Milestones

Plugins are ordered by priority and dependency:

| Phase | Milestone | Plugins / Tasks | Target Date | Status |
|-------|-----------|-----------------|-------------|--------|
| 0 | Core infrastructure | `helpers/` utilities, plugin base class, `ga4.use()` method | TBD | Not Started |
| 1 | High-priority plugins | `eventTracker`, `outboundLinkTracker` | TBD | Not Started |
| 2 | SPA & visibility | `urlChangeTracker`, `pageVisibilityTracker` | TBD | Not Started |
| 3 | Remaining plugins | `impressionTracker`, `outboundFormTracker`, `cleanUrlTracker` | TBD | Not Started |
| 4 | Low-priority | `mediaQueryTracker` | TBD | Not Started |
| 5 | Polish | Documentation, README update, examples | TBD | Not Started |
| 6 | Release | npm publish v2.0.0 | TBD | Not Started |

---

## 12. Sign-Off

| Role           | Name | Date | Approved |
|----------------|------|------|----------|
| Product Owner  |      |      | [ ]      |
| Tech Lead      |      |      | [ ]      |
| QA             |      |      | [ ]      |

---

_This document is a living artifact. Update it as requirements evolve._
