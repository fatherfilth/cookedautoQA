/**
 * Crypto configuration for Swapped.com integration monitoring tests.
 *
 * Defaults are placeholders only — actual paths should be determined by
 * inspecting the live site and overridden via environment variables.
 *
 * buyPath: The page on cooked.com that embeds the Swapped.com widget.
 * Default '/crypto/buy' is a TODO placeholder — needs live site inspection.
 *
 * iframeSrcPattern: Substring to match in the Swapped.com iframe src attribute.
 * Default 'connect.swapped.com' per Swapped.com docs
 * (https://docs.swapped.com/swapped-connect/connect-integration/iframe-initialization).
 *
 * After live site inspection, set these in .env:
 * CRYPTO_BUY_PATH=/actual-crypto-path
 * CRYPTO_IFRAME_SRC=connect.swapped.com
 */
export const cryptoConfig = {
  buyPath: process.env.CRYPTO_BUY_PATH || '/crypto/buy',
  iframeSrcPattern: process.env.CRYPTO_IFRAME_SRC || 'connect.swapped.com',
} as const;
