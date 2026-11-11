// Whitelist settings screen. Unlike the on-page control panel, this
// popup has no persistent state of its own - it only reads/writes
// browser.storage.local, so it doesn't matter that the popup's JS
// context is destroyed every time it closes.

const storageArea =
  typeof browser !== "undefined" && browser.storage
    ? browser.storage.local
    : typeof chrome !== "undefined" && chrome.storage
    ? chrome.storage.local
    : null;

async function storageGet(key) {
  if (!storageArea) return undefined;
  const result = await storageArea.get(key);
  return result ? result[key] : undefined;
}

async function storageSet(key, value) {
  if (!storageArea) return;
  await storageArea.set({ [key]: value });
}

const currentHostEl = document.querySelector('[data-role="current-host"]');
const addCurrentBtnEl = document.querySelector('[data-role="add-current-btn"]');
const allSitesCheckboxEl = document.querySelector('[data-role="all-sites-checkbox"]');
const domainListEl = document.querySelector('[data-role="domain-list"]');
const newDomainInputEl = document.querySelector('[data-role="new-domain-input"]');
const addDomainBtnEl = document.querySelector('[data-role="add-domain-btn"]');

let whitelist = [];
let currentHostname = null;

async function getActiveTabHostname() {
  const tabApi = typeof browser !== "undefined" ? browser.tabs : chrome.tabs;
  try {
    const tabs = await tabApi.query({ active: true, currentWindow: true });
    const url = tabs && tabs[0] && tabs[0].url;
    if (!url) return null;
    return new URL(url).hostname;
  } catch (err) {
    console.error("[SRT Player] could not read active tab URL:", err);
    return null;
  }
}

function renderDomainList() {
  domainListEl.innerHTML = "";

  if (whitelist.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "(リストは空です)";
    empty.style.color = "#888";
    domainListEl.appendChild(empty);
    return;
  }

  for (const domain of whitelist) {
    const row = document.createElement("div");
    row.className = "domain-row";

    const label = document.createElement("span");
    label.textContent = domain;
    row.appendChild(label);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "small";
    removeBtn.textContent = "削除";
    removeBtn.addEventListener("click", () => removeDomain(domain));
    row.appendChild(removeBtn);

    domainListEl.appendChild(row);
  }
}

function normalizeDomainInput(raw) {
  let value = raw.trim().toLowerCase();
  // Be forgiving of pasted URLs or "www." prefixes.
  value = value.replace(/^https?:\/\//, "").replace(/^www\./, "");
  value = value.split("/")[0];
  return value;
}

async function addDomain(rawDomain) {
  const domain = normalizeDomainInput(rawDomain);
  if (!domain) return;
  if (whitelist.includes(domain)) return;

  whitelist.push(domain);
  whitelist.sort();
  await storageSet("srtPlayerWhitelist", whitelist);
  renderDomainList();
}

async function removeDomain(domain) {
  whitelist = whitelist.filter((d) => d !== domain);
  await storageSet("srtPlayerWhitelist", whitelist);
  renderDomainList();
}

addDomainBtnEl.addEventListener("click", () => {
  addDomain(newDomainInputEl.value);
  newDomainInputEl.value = "";
});

newDomainInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    addDomain(newDomainInputEl.value);
    newDomainInputEl.value = "";
  }
});

addCurrentBtnEl.addEventListener("click", () => {
  if (currentHostname) addDomain(currentHostname);
});

allSitesCheckboxEl.addEventListener("change", () => {
  storageSet("srtPlayerEnableAllSites", allSitesCheckboxEl.checked);
});

async function init() {
  whitelist = (await storageGet("srtPlayerWhitelist")) || SRT_PLAYER_DEFAULT_WHITELIST.slice();
  allSitesCheckboxEl.checked = (await storageGet("srtPlayerEnableAllSites")) === true;

  renderDomainList();

  currentHostname = await getActiveTabHostname();
  currentHostEl.textContent = currentHostname || "(このページのURLを取得できません)";
  addCurrentBtnEl.disabled = !currentHostname;
}

init();
