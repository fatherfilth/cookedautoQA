/**
 * Game configuration for launch monitoring tests.
 *
 * Defaults are placeholders only — actual game IDs should be determined by
 * inspecting the live site and overridden via environment variables.
 *
 * Categories:
 * - slot: High-frequency revenue generator (e.g., Le Bandit, Book of Dead)
 * - table: Classic casino games (e.g., Blackjack, Roulette)
 * - live: Live dealer games with video streams (discovered dynamically from /games/live-casino)
 *
 * After live site inspection, set these in .env:
 * GAME_SLOT_ID=actual-slot-game-slug
 * GAME_TABLE_ID=actual-table-game-slug
 * GAME_LIVE_ID=actual-live-dealer-slug
 */
export const gameConfig = {
  slot: {
    id: process.env.GAME_SLOT_ID || 'le-bandit',
    name: process.env.GAME_SLOT_NAME || 'Le Bandit',
  },
  table: {
    id: process.env.GAME_TABLE_ID || 'blackjack-147',
    name: process.env.GAME_TABLE_NAME || 'Blackjack',
  },
  live: {
    id: process.env.GAME_LIVE_ID || 'live-roulette',
    name: process.env.GAME_LIVE_NAME || 'Live Roulette',
  },
} as const;
