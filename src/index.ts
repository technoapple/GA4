import {ga} from './ga4/index';
import {get} from './dataLayer';

const dataLayerHelper = { get };
const ga4 = ga;

export {ga4, dataLayerHelper};

// Plugin exports
export { EventTracker } from './plugins/event-tracker';
export { OutboundLinkTracker } from './plugins/outbound-link-tracker';
export { OutboundFormTracker } from './plugins/outbound-form-tracker';
export { PageVisibilityTracker } from './plugins/page-visibility-tracker';
export { UrlChangeTracker } from './plugins/url-change-tracker';
export { ImpressionTracker } from './plugins/impression-tracker';
export { CleanUrlTracker } from './plugins/clean-url-tracker';
export { MediaQueryTracker } from './plugins/media-query-tracker';

// Type exports
export type {
    GA4Plugin,
    SendFunction,
    EventTrackerOptions,
    OutboundLinkTrackerOptions,
    OutboundFormTrackerOptions,
    PageVisibilityTrackerOptions,
    UrlChangeTrackerOptions,
    ImpressionTrackerOptions,
    ImpressionElementConfig,
    CleanUrlTrackerOptions,
    MediaQueryTrackerOptions,
    MediaQueryDefinition,
    MediaQueryDefinitionItem,
} from './types/plugins';