/**
 * GA4 field reference data.
 * Common fields and all standard event parameters, sourced from:
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */

const GA4_COMMON_FIELDS = [
  { name: "client_id",         type: "string",   description: "Unique identifier for the browser/device." },
  { name: "language",          type: "string",   description: "Browser language (e.g. 'en-us')." },
  { name: "page_encoding",     type: "string",   description: "Character encoding of the page (e.g. 'UTF-8')." },
  { name: "page_location",     type: "string",   description: "Full URL of the page." },
  { name: "page_referrer",     type: "string",   description: "URL of the previous page." },
  { name: "page_title",        type: "string",   description: "Title of the page." },
  { name: "screen_resolution", type: "string",   description: "Screen resolution (e.g. '1920x1080')." },
  { name: "send_to",           type: "string",   description: "GA4 Measurement ID to send the event to." },
  { name: "user_agent",        type: "string",   description: "Browser user-agent string." },
  { name: "user_id",           type: "string",   description: "Signed-in user identifier (set by your site)." },
  { name: "event_callback",    type: "function", description: "Callback invoked after the event is sent." },
  { name: "event_timeout",     type: "number",   description: "Milliseconds to wait before invoking event_callback without confirmation." },
  { name: "groups",            type: "string",   description: "Named group of Measurement IDs to target." },
  { name: "non_interaction",   type: "boolean",  description: "Set true to mark event as non-interactive (does not affect bounce rate)." },
];

const GA4_ITEM_FIELDS = [
  { name: "item_id",          type: "string", required: true,  description: "Product SKU or ID." },
  { name: "item_name",        type: "string", required: true,  description: "Product name." },
  { name: "affiliation",      type: "string", required: false, description: "Store or affiliation this product is associated with." },
  { name: "coupon",           type: "string", required: false, description: "Coupon code applied to the item." },
  { name: "discount",         type: "number", required: false, description: "Monetary discount value for the item." },
  { name: "index",            type: "number", required: false, description: "Item position in a list." },
  { name: "item_brand",       type: "string", required: false, description: "Item brand." },
  { name: "item_category",    type: "string", required: false, description: "Item category (level 1)." },
  { name: "item_category2",   type: "string", required: false, description: "Item category (level 2)." },
  { name: "item_category3",   type: "string", required: false, description: "Item category (level 3)." },
  { name: "item_category4",   type: "string", required: false, description: "Item category (level 4)." },
  { name: "item_category5",   type: "string", required: false, description: "Item category (level 5)." },
  { name: "item_list_id",     type: "string", required: false, description: "ID of the list the item belongs to." },
  { name: "item_list_name",   type: "string", required: false, description: "Name of the list the item belongs to." },
  { name: "item_variant",     type: "string", required: false, description: "Item variant (e.g. color, size)." },
  { name: "location_id",      type: "string", required: false, description: "Physical location associated with the item (e.g. store)." },
  { name: "price",            type: "number", required: false, description: "Item price in the specified currency." },
  { name: "quantity",         type: "number", required: false, description: "Number of units." },
];

const GA4_EVENTS = [
  {
    name: "add_payment_info",
    description: "Sent when a user submits payment info during checkout.",
    parameters: [
      { name: "currency",      type: "string",      required: true,  description: "Currency code (ISO 4217), e.g. 'USD'." },
      { name: "value",         type: "number",      required: true,  description: "Total monetary value of the event." },
      { name: "coupon",        type: "string",      required: false, description: "Coupon code applied." },
      { name: "payment_type",  type: "string",      required: false, description: "Payment method (e.g. 'credit card')." },
      { name: "items",         type: "Array<Item>", required: true,  description: "Array of items in the cart." },
    ],
  },
  {
    name: "add_shipping_info",
    description: "Sent when a user submits shipping info during checkout.",
    parameters: [
      { name: "currency",      type: "string",      required: true,  description: "Currency code (ISO 4217)." },
      { name: "value",         type: "number",      required: true,  description: "Total monetary value." },
      { name: "coupon",        type: "string",      required: false, description: "Coupon code applied." },
      { name: "shipping_tier", type: "string",      required: false, description: "Shipping tier selected (e.g. 'Ground')." },
      { name: "items",         type: "Array<Item>", required: true,  description: "Array of items." },
    ],
  },
  {
    name: "add_to_cart",
    description: "Sent when a user adds an item to the shopping cart.",
    parameters: [
      { name: "currency", type: "string",      required: true, description: "Currency code (ISO 4217)." },
      { name: "value",    type: "number",      required: true, description: "Total monetary value." },
      { name: "items",    type: "Array<Item>", required: true, description: "Array of items added." },
    ],
  },
  {
    name: "add_to_wishlist",
    description: "Sent when a user adds an item to a wishlist.",
    parameters: [
      { name: "currency", type: "string",      required: true, description: "Currency code (ISO 4217)." },
      { name: "value",    type: "number",      required: true, description: "Total monetary value." },
      { name: "items",    type: "Array<Item>", required: true, description: "Array of items added." },
    ],
  },
  {
    name: "begin_checkout",
    description: "Sent when a user begins the checkout process.",
    parameters: [
      { name: "currency", type: "string",      required: false, description: "Currency code (ISO 4217)." },
      { name: "value",    type: "number",      required: false, description: "Total monetary value." },
      { name: "coupon",   type: "string",      required: false, description: "Coupon code applied." },
      { name: "items",    type: "Array<Item>", required: false, description: "Array of items in the cart." },
    ],
  },
  {
    name: "earn_virtual_currency",
    description: "Sent when a user earns virtual currency in a game.",
    parameters: [
      { name: "virtual_currency_name", type: "string", required: false, description: "Name of the virtual currency." },
      { name: "value",                 type: "number", required: false, description: "Amount of virtual currency earned." },
    ],
  },
  {
    name: "exception",
    description: "Sent to report errors or exceptions in the app.",
    parameters: [
      { name: "description", type: "string",  required: false, description: "Description of the error." },
      { name: "fatal",       type: "boolean", required: false, description: "True if the error was fatal." },
    ],
  },
  {
    name: "generate_lead",
    description: "Sent when a lead is generated (e.g. via a form).",
    parameters: [
      { name: "currency", type: "string", required: true, description: "Currency code (ISO 4217)." },
      { name: "value",    type: "number", required: true, description: "Monetary value of the lead." },
    ],
  },
  {
    name: "join_group",
    description: "Sent when a user joins a group.",
    parameters: [
      { name: "group_id", type: "string", required: false, description: "ID of the group." },
    ],
  },
  {
    name: "level_end",
    description: "Sent when a player finishes a level in a game.",
    parameters: [
      { name: "level_name", type: "string",  required: false, description: "Name of the level." },
      { name: "success",    type: "boolean", required: false, description: "True if the level was completed successfully." },
    ],
  },
  {
    name: "level_start",
    description: "Sent when a player starts a level in a game.",
    parameters: [
      { name: "level_name", type: "string", required: true, description: "Name of the level." },
    ],
  },
  {
    name: "level_up",
    description: "Sent when a player levels up in a game.",
    parameters: [
      { name: "level",     type: "number", required: false, description: "New level number." },
      { name: "character", type: "string", required: false, description: "Character that leveled up." },
    ],
  },
  {
    name: "login",
    description: "Sent when a user logs in.",
    parameters: [
      { name: "method", type: "string", required: false, description: "Authentication method (e.g. 'Google')." },
    ],
  },
  {
    name: "page_view",
    description: "Sent when the current page is viewed.",
    parameters: [
      { name: "page_location", type: "string", required: false, description: "Full URL of the page." },
      { name: "client_id",     type: "string", required: false, description: "Unique browser/device identifier." },
      { name: "language",      type: "string", required: false, description: "Browser language." },
      { name: "page_encoding", type: "string", required: false, description: "Character encoding of the page." },
      { name: "page_title",    type: "string", required: false, description: "Title of the page." },
      { name: "user_agent",    type: "string", required: false, description: "Browser user-agent string." },
    ],
  },
  {
    name: "post_score",
    description: "Sent when a player posts a score in a game.",
    parameters: [
      { name: "score",     type: "number", required: true,  description: "Score posted." },
      { name: "level",     type: "number", required: false, description: "Level the score was earned on." },
      { name: "character", type: "string", required: false, description: "Character used." },
    ],
  },
  {
    name: "purchase",
    description: "Sent when a user completes a purchase.",
    parameters: [
      { name: "currency",       type: "string",      required: true,  description: "Currency code (ISO 4217)." },
      { name: "transaction_id", type: "string",      required: true,  description: "Unique transaction identifier." },
      { name: "value",          type: "number",      required: true,  description: "Total monetary value." },
      { name: "coupon",         type: "string",      required: false, description: "Coupon code applied." },
      { name: "shipping",       type: "number",      required: false, description: "Shipping cost." },
      { name: "tax",            type: "number",      required: false, description: "Tax amount." },
      { name: "items",          type: "Array<Item>", required: true,  description: "Array of purchased items." },
    ],
  },
  {
    name: "refund",
    description: "Sent when a refund is issued.",
    parameters: [
      { name: "currency",       type: "string",      required: true,  description: "Currency code (ISO 4217)." },
      { name: "transaction_id", type: "string",      required: true,  description: "Transaction being refunded." },
      { name: "value",          type: "number",      required: true,  description: "Refund amount." },
      { name: "coupon",         type: "string",      required: false, description: "Coupon code." },
      { name: "shipping",       type: "number",      required: false, description: "Shipping cost refunded." },
      { name: "tax",            type: "number",      required: false, description: "Tax refunded." },
      { name: "items",          type: "Array<Item>", required: false, description: "Array of refunded items (partial refund)." },
    ],
  },
  {
    name: "remove_from_cart",
    description: "Sent when a user removes an item from the cart.",
    parameters: [
      { name: "currency", type: "string",      required: true, description: "Currency code (ISO 4217)." },
      { name: "value",    type: "number",      required: true, description: "Total monetary value." },
      { name: "items",    type: "Array<Item>", required: true, description: "Array of items removed." },
    ],
  },
  {
    name: "search",
    description: "Sent when a user performs a search.",
    parameters: [
      { name: "search_term", type: "string", required: true, description: "The term searched for." },
    ],
  },
  {
    name: "select_content",
    description: "Sent when a user selects content.",
    parameters: [
      { name: "content_type", type: "string", required: false, description: "Type of content selected." },
      { name: "content_id",   type: "string", required: false, description: "ID of the selected content." },
    ],
  },
  {
    name: "select_item",
    description: "Sent when a user selects an item from a list.",
    parameters: [
      { name: "item_list_id",   type: "string",      required: false, description: "ID of the list." },
      { name: "item_list_name", type: "string",      required: false, description: "Name of the list." },
      { name: "items",          type: "Array<Item>", required: true,  description: "Array containing the selected item." },
    ],
  },
  {
    name: "select_promotion",
    description: "Sent when a user selects a promotion.",
    parameters: [
      { name: "creative_name",  type: "string",      required: false, description: "Name of the promotional creative." },
      { name: "creative_slot",  type: "string",      required: false, description: "Slot of the promotional creative." },
      { name: "promotion_id",   type: "string",      required: false, description: "ID of the promotion." },
      { name: "promotion_name", type: "string",      required: false, description: "Name of the promotion." },
      { name: "items",          type: "Array<Item>", required: false, description: "Array of promoted items." },
    ],
  },
  {
    name: "share",
    description: "Sent when a user shares content.",
    parameters: [
      { name: "method",       type: "string", required: false, description: "Sharing method (e.g. 'twitter')." },
      { name: "content_type", type: "string", required: false, description: "Type of content shared." },
      { name: "item_id",      type: "string", required: false, description: "ID of the shared item." },
    ],
  },
  {
    name: "sign_up",
    description: "Sent when a user signs up for an account.",
    parameters: [
      { name: "method", type: "string", required: false, description: "Sign-up method (e.g. 'Google')." },
    ],
  },
  {
    name: "spend_virtual_currency",
    description: "Sent when a user spends virtual currency in a game.",
    parameters: [
      { name: "value",                 type: "number", required: true, description: "Amount of virtual currency spent." },
      { name: "virtual_currency_name", type: "string", required: true, description: "Name of the virtual currency." },
      { name: "item_name",             type: "string", required: true, description: "Item purchased with virtual currency." },
    ],
  },
  {
    name: "tutorial_begin",
    description: "Sent when a user begins a tutorial.",
    parameters: [],
  },
  {
    name: "tutorial_complete",
    description: "Sent when a user completes a tutorial.",
    parameters: [],
  },
  {
    name: "unlock_achievement",
    description: "Sent when a user unlocks an achievement in a game.",
    parameters: [
      { name: "achievement_id", type: "string", required: true, description: "ID of the achievement unlocked." },
    ],
  },
  {
    name: "view_cart",
    description: "Sent when a user views the shopping cart.",
    parameters: [
      { name: "currency", type: "string",      required: true, description: "Currency code (ISO 4217)." },
      { name: "value",    type: "number",      required: true, description: "Total monetary value of the cart." },
      { name: "items",    type: "Array<Item>", required: true, description: "Array of items in the cart." },
    ],
  },
  {
    name: "view_item",
    description: "Sent when a user views an item.",
    parameters: [
      { name: "currency", type: "string",      required: true, description: "Currency code (ISO 4217)." },
      { name: "value",    type: "number",      required: true, description: "Monetary value." },
      { name: "items",    type: "Array<Item>", required: true, description: "Array containing the viewed item." },
    ],
  },
  {
    name: "view_item_list",
    description: "Sent when a user views a list of items.",
    parameters: [
      { name: "item_list_id",   type: "string",      required: false, description: "ID of the list." },
      { name: "item_list_name", type: "string",      required: false, description: "Name of the list." },
      { name: "items",          type: "Array<Item>", required: false, description: "Array of listed items." },
    ],
  },
  {
    name: "view_promotion",
    description: "Sent when a promotion is shown to the user.",
    parameters: [
      { name: "creative_name",  type: "string",      required: false, description: "Name of the promotional creative." },
      { name: "creative_slot",  type: "string",      required: false, description: "Creative slot." },
      { name: "promotion_id",   type: "string",      required: false, description: "Promotion ID." },
      { name: "promotion_name", type: "string",      required: false, description: "Promotion name." },
      { name: "items",          type: "Array<Item>", required: false, description: "Array of promoted items." },
    ],
  },
  {
    name: "view_search_results",
    description: "Sent when a user views search results.",
    parameters: [
      { name: "search_term", type: "string", required: false, description: "The term searched for." },
    ],
  },
];
