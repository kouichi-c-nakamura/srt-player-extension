// Shared between overlay.js (content script) and popup.js (whitelist
// settings screen). Loaded as a plain script before both, so these
// are just globals within each execution context - no bundler/module
// system needed for a project this size.

const SRT_PLAYER_DEFAULT_WHITELIST = [
  "netflix.com",
  "primevideo.com",
  "amazon.com",
  "amazon.co.jp",
  "hulu.com",
  "disneyplus.com",
];

// True if `hostname` is exactly `domain`, or a subdomain of it
// (e.g. "www.netflix.com" matches domain "netflix.com").
function srtPlayerHostMatches(hostname, domain) {
  const h = hostname.toLowerCase();
  const d = domain.toLowerCase().trim();
  return h === d || h.endsWith("." + d);
}
