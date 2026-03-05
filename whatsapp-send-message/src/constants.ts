export const WHATSAPP_WEB_URL = "https://web.whatsapp.com";

export const SELECTORS = {
  NEW_CHAT_BUTTON: '[data-icon="new-chat-outline"]',
  NEW_CHAT_ARIA: '[aria-label="New chat"]',
  NEW_CHAT_LABEL: '[title="New chat"]',
  SEARCH_INPUT: 'div[contenteditable="true"][data-tab="3"]',
  SEARCH_ARIA: 'div[contenteditable="true"][aria-label*="Search"]',
  MESSAGE_INPUT: 'div[contenteditable="true"][data-tab="10"]',
  MESSAGE_ARIA: 'div[contenteditable="true"][aria-label*="Type a message"]',
  SEND_BUTTON: '[data-icon="send"]',
} as const;

/** Try these in order to find the send button (WhatsApp may change markup). */
export const SEND_BUTTON_SELECTORS = [
  '[data-icon="send"]',
  'span[data-icon="send"]',
  '[data-icon="send-outline"]',
  'span[data-icon="send-outline"]',
  '[aria-label="Send"]',
  'button[aria-label="Send"]',
] as const;

/** Try these in order to find the new chat button (WhatsApp may change markup). */
export const NEW_CHAT_SELECTORS = [
  SELECTORS.NEW_CHAT_BUTTON,
  SELECTORS.NEW_CHAT_ARIA,
  SELECTORS.NEW_CHAT_LABEL,
  'button[aria-label="New chat"]',
  'span[data-icon="new-chat-outline"]',
] as const;
