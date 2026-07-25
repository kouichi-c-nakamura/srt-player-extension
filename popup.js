// Step 1 goal: prove the file selector + SRT parser work reliably,
// with clear on-screen feedback (not just console.log) so failures
// are obvious without opening devtools.

const fileInput = document.getElementById("fileInput");
const statusEl = document.getElementById("status");
const cueListEl = document.getElementById("cueList");

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || "";
}

function renderCues(cues) {
  cueListEl.innerHTML = "";

  if (cues.length === 0) {
    cueListEl.textContent = "(no cues parsed)";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const cue of cues) {
    const cueEl = document.createElement("div");
    cueEl.className = "cue";

    const metaEl = document.createElement("div");
    metaEl.className = "meta";
    metaEl.textContent = `#${cue.index}  ${formatMs(cue.start)} -> ${formatMs(cue.end)}`;

    const textEl = document.createElement("div");
    textEl.className = "text";
    textEl.textContent = cue.text;

    cueEl.appendChild(metaEl);
    cueEl.appendChild(textEl);
    fragment.appendChild(cueEl);
  }

  cueListEl.appendChild(fragment);
}

function formatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const msRemainder = ms % 1000;
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msRemainder, 3)}`;
}

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) {
    setStatus("No file selected.");
    return;
  }

  setStatus(`Reading "${file.name}"...`);

  try {
    // Explicit UTF-8 read; SRT files are sometimes Shift-JIS but we
    // treat that as a known limitation to revisit later if it comes up.
    const rawText = await file.text();

    const cues = parseSrt(rawText);

    if (cues.length === 0) {
      setStatus(
        `Parsed "${file.name}" but found 0 cues. File may be malformed or in an unexpected encoding.`,
        "error"
      );
      console.warn("SRT parse produced 0 cues. Raw text preview:", rawText.slice(0, 300));
      renderCues([]);
      return;
    }

    setStatus(`Loaded "${file.name}": ${cues.length} cues parsed successfully.`, "ok");
    console.log(`Parsed ${cues.length} cues from ${file.name}:`, cues);

    renderCues(cues);
  } catch (err) {
    setStatus(`Failed to read/parse "${file.name}": ${err.message}`, "error");
    console.error("SRT parse error:", err);
  }
});
