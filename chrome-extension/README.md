# GA4 Field Reference — Chrome Extension

A lightweight Chrome extension that lets you look up all GA4 standard events, their event parameters, common configuration fields, and item-level fields — without leaving your browser.

## Features

- **Events tab** — browse all 30+ standard GA4 events (e.g. `purchase`, `add_to_cart`, `page_view`).  
  Click any event to expand it and see its parameters with types, required/optional badges, and descriptions.
- **Common Fields tab** — configuration and measurement fields shared across all events (e.g. `page_location`, `user_id`, `send_to`).
- **Item Fields tab** — the full `Item` object schema used in e-commerce events (e.g. `item_id`, `item_name`, `price`).
- **Live search** — filter any tab by event name, parameter name, or description.

## Installing (Developer / Unpacked mode)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `chrome-extension/` folder.
4. The "GA4 Field Reference" icon appears in your toolbar — click it to open the popup.

## File Structure

```
chrome-extension/
├── manifest.json        # Manifest V3 extension descriptor
├── popup.html           # Popup UI
├── popup.css            # Styles
├── popup.js             # Search & render logic
├── data/
│   └── ga4-fields.js    # GA4 event & field data
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Data Source

All event and parameter definitions are derived from:

- The [`src/types/gtag.ts`](../src/types/gtag.ts) TypeScript type definitions in this repository.
- The official [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events).
