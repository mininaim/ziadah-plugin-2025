/**
 * Escapes HTML special characters in a given string
 * @param {string} unsafe - The string to be escaped
 * @return {string} The escaped string
 */
export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formats a price with the given currency and language
 * @param {number} price - The price to format
 * @param {string} currency - The currency code (e.g., 'USD', 'EUR')
 * @param {string} language - The language code (e.g., 'en-US', 'fr-FR')
 * @return {string} The formatted price string
 */
export function formatPrice(price, currency, language) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency: currency,
  }).format(price);
}

/**
 * Copies text to clipboard
 * @param {string} text - The text to copy
 * @return {Promise<void>}
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
}
