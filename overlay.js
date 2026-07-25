// SRT Player - main content script.
//
// Two visual pieces:
//   #srt-player-overlay -> subtitle text display (pointer-events: none)
//   #srt-player-panel   -> floating control panel (interactive)
//
// Core design principle (deliberate, per user's direction):
// This player is COMPLETELY INDEPENDENT of the page's <video> element.
// It never reads video.currentTime and never seeks the video. It is
// simply an internal stopwatch that drives which subtitle line is
// shown. The user manually keeps it roughly in sync using the
// offset/jump buttons. This trades "true sync" for "works identically
// on every platform, forever" - Netflix, Amazon, YouTube, whatever.
//
// (parseSrt / timecodeToMs are loaded from srt-parser.js, which runs
// before this file per manifest.json's content_scripts order.)

(function () {
  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------

  let subtitles = []; // sorted array of {index, start, end, text}
  let currentFileName = null;
  let isListExpanded = false;
  let lastRenderedAnchorIdx = null; // sentinel; forces a render the first time

  // Independent timer state. "elapsed" = current position on the
  // subtitle timeline, in milliseconds. This IS the only clock.
  let elapsedBaseMs = 0; // elapsed value as of the last play()/setElapsed()
  let startPerfMs = null; // performance.now() at last play()
  let isPlaying = false;

  function getElapsedMs() {
    if (isPlaying) {
      return elapsedBaseMs + (performance.now() - startPerfMs);
    }
    return elapsedBaseMs;
  }

  function setElapsedMs(newElapsed) {
    elapsedBaseMs = Math.max(0, newElapsed);
    if (isPlaying) {
      startPerfMs = performance.now();
    }
  }

  function play() {
    if (isPlaying) return;
    startPerfMs = performance.now();
    isPlaying = true;
  }

  function pause() {
    if (!isPlaying) return;
    elapsedBaseMs = getElapsedMs();
    isPlaying = false;
  }

  function adjustElapsed(deltaMs) {
    setElapsedMs(getElapsedMs() + deltaMs);
  }

  function getCurrentCueIndex(timeMs) {
    return subtitles.findIndex((c) => timeMs >= c.start && timeMs <= c.end);
  }

  // Index used as the "center" (offset 0) row for the nearby-lines
  // list, and as the pivot for previous-cue jumps while in a gap.
  // If we're inside a cue, that cue is the anchor. If we're in a
  // gap between cues, the anchor is the most recent cue that
  // already started (so the list still makes sense mid-gap).
  function getAnchorIndex(timeMs) {
    const idx = getCurrentCueIndex(timeMs);
    if (idx !== -1) return idx;

    let lastIdx = -1;
    for (let i = 0; i < subtitles.length; i++) {
      if (subtitles[i].start < timeMs) {
        lastIdx = i;
      } else {
        break;
      }
    }
    return lastIdx; // -1 if before the very first cue
  }

  function jumpToNextCue() {
    const t = getElapsedMs();
    const idx = getCurrentCueIndex(t);

    let target;
    if (idx !== -1) {
      // Currently inside a cue -> always advance to the next one,
      // regardless of how far into the current cue we are.
      target = subtitles[idx + 1];
    } else {
      // In a gap between cues -> the next upcoming cue.
      target = subtitles.find((c) => c.start > t);
    }

    if (target) setElapsedMs(target.start);
  }

  function jumpToPreviousCue() {
    const t = getElapsedMs();
    const idx = getCurrentCueIndex(t);

    let target = null;
    if (idx > 0) {
      // Currently inside a cue -> always go to the true previous
      // one, never just back to this same cue's own start.
      target = subtitles[idx - 1];
    } else if (idx === -1) {
      // In a gap between cues -> the most recent cue before now.
      const candidates = subtitles.filter((c) => c.start < t);
      target = candidates[candidates.length - 1] || null;
    }
    // idx === 0 (already on the first cue): nothing earlier to jump to.

    setElapsedMs(target ? target.start : 0);
  }

  function findCueAt(timeMs) {
    // Linear scan is fine for typical subtitle counts (hundreds to
    // low thousands of cues); revisit with binary search only if
    // profiling shows it matters.
    return subtitles.find((c) => timeMs >= c.start && timeMs <= c.end) || null;
  }

  // ---------------------------------------------------------------
  // Subtitle overlay (text display)
  // ---------------------------------------------------------------

  const overlayEl = document.createElement("div");
  overlayEl.id = "srt-player-overlay";
  document.documentElement.appendChild(overlayEl);

  function handleFullscreenChange() {
    const fsEl = document.fullscreenElement;
    const target = fsEl || document.documentElement;
    target.appendChild(overlayEl);
    target.appendChild(panelEl);
  }
  document.addEventListener("fullscreenchange", handleFullscreenChange);
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

  // ---------------------------------------------------------------
  // Control panel (UI)
  // ---------------------------------------------------------------

  const panelEl = document.createElement("div");
  panelEl.id = "srt-player-panel";
  panelEl.innerHTML = `
    <div class="panel-header">
      <span>SRT Player</span>
      <button type="button" data-action="toggle-collapse" title="最小化/展開">▾</button>
    </div>
    <div class="panel-body">
      <div class="panel-row">
        <button type="button" class="ctrl-btn" data-action="choose-file">SRTを選択</button>
        <span class="filename" data-role="filename">(未選択)</span>
      </div>
      <div class="panel-row">
        <button type="button" class="ctrl-btn" data-action="play-pause" data-role="play-pause-btn">再生</button>
        <span class="status-line" data-role="elapsed">00:00:00,000</span>
      </div>
      <div class="panel-row">
        <button type="button" class="ctrl-btn" data-action="prev-cue" title="前の字幕へ">◀◀</button>
        <button type="button" class="ctrl-btn" data-action="adjust" data-delta="-1000">-1s</button>
        <button type="button" class="ctrl-btn" data-action="adjust" data-delta="-100">-100ms</button>
        <button type="button" class="ctrl-btn" data-action="adjust" data-delta="100">+100ms</button>
        <button type="button" class="ctrl-btn" data-action="adjust" data-delta="1000">+1s</button>
        <button type="button" class="ctrl-btn" data-action="next-cue" title="次の字幕へ">▶▶</button>
      </div>
      <div class="status-line" data-role="cue-status">字幕ファイル未読み込み</div>
      <div class="panel-row">
        <button type="button" class="ctrl-btn" data-action="toggle-list" data-role="toggle-list-btn">近くの行を表示</button>
      </div>
      <div class="line-list" data-role="line-list" style="display: none;"></div>
    </div>
  `;
  document.documentElement.appendChild(panelEl);

  const fileInputEl = document.createElement("input");
  fileInputEl.type = "file";
  fileInputEl.accept = ".srt,text/plain";
  fileInputEl.style.display = "none";
  document.documentElement.appendChild(fileInputEl);

  const filenameLabelEl = panelEl.querySelector('[data-role="filename"]');
  const playPauseBtnEl = panelEl.querySelector('[data-role="play-pause-btn"]');
  const elapsedLabelEl = panelEl.querySelector('[data-role="elapsed"]');
  const cueStatusEl = panelEl.querySelector('[data-role="cue-status"]');
  const toggleListBtnEl = panelEl.querySelector('[data-role="toggle-list-btn"]');
  const lineListEl = panelEl.querySelector('[data-role="line-list"]');

  // ---------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------

  panelEl.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    switch (action) {
      case "toggle-collapse":
        panelEl.classList.toggle("collapsed");
        btn.textContent = panelEl.classList.contains("collapsed") ? "▸" : "▾";
        break;

      case "choose-file":
        fileInputEl.click();
        break;

      case "play-pause":
        if (isPlaying) {
          pause();
        } else {
          play();
        }
        updatePlayPauseLabel();
        break;

      case "adjust":
        adjustElapsed(parseInt(btn.dataset.delta, 10));
        break;

      case "prev-cue":
        jumpToPreviousCue();
        break;

      case "next-cue":
        jumpToNextCue();
        break;

      case "toggle-list":
        isListExpanded = !isListExpanded;
        lineListEl.style.display = isListExpanded ? "flex" : "none";
        toggleListBtnEl.textContent = isListExpanded ? "行リストを隠す" : "近くの行を表示";
        lastRenderedAnchorIdx = null; // force a fresh render on open
        renderLineList();
        break;
    }
  });

  // Delegated click handler for the nearby-lines list: clicking any
  // row with a data-start attribute jumps the internal timer there.
  lineListEl.addEventListener("click", (event) => {
    const row = event.target.closest(".line-row[data-start]");
    if (!row) return;
    setElapsedMs(parseFloat(row.dataset.start));
  });

  fileInputEl.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const cues = parseSrt(rawText);

      if (cues.length === 0) {
        cueStatusEl.textContent = `"${file.name}" を読み込みましたが、0件しかパースできませんでした。`;
        return;
      }

      subtitles = cues;
      currentFileName = file.name;
      filenameLabelEl.textContent = file.name;
      cueStatusEl.textContent = `${cues.length} 件の字幕を読み込みました。`;

      // Loading a new file resets the timeline, per "internal memory
      // until next time you load a new file" - this IS that reset.
      elapsedBaseMs = 0;
      isPlaying = false;
      lastRenderedAnchorIdx = null;
      updatePlayPauseLabel();
    } catch (err) {
      cueStatusEl.textContent = `読み込みエラー: ${err.message}`;
      console.error("[SRT Player] file read/parse error:", err);
    }
  });

  function updatePlayPauseLabel() {
    playPauseBtnEl.textContent = isPlaying ? "一時停止" : "再生";
  }

  function formatMs(ms) {
    const clamped = Math.max(0, Math.round(ms));
    const h = Math.floor(clamped / 3600000);
    const m = Math.floor((clamped % 3600000) / 60000);
    const s = Math.floor((clamped % 60000) / 1000);
    const msRemainder = clamped % 1000;
    const pad = (n, len = 2) => String(n).padStart(len, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(msRemainder, 3)}`;
  }

  function renderLineList() {
    if (!isListExpanded) return;

    const t = getElapsedMs();
    const anchorIdx = getAnchorIndex(t);

    // Skip the rebuild entirely if we're still centered on the same
    // cue as last time. Rebuilding on every animation frame (60/sec)
    // was destroying and recreating the row elements constantly,
    // which could swallow a click that started (mousedown) on a row
    // that got replaced before mouseup/click fired.
    if (anchorIdx === lastRenderedAnchorIdx) return;
    lastRenderedAnchorIdx = anchorIdx;

    lineListEl.innerHTML = "";

    for (let offset = -3; offset <= 3; offset++) {
      const idx = anchorIdx + offset;
      const row = document.createElement("div");
      row.className = "line-row" + (offset === 0 ? " current" : "");

      const offsetLabelEl = document.createElement("span");
      offsetLabelEl.className = "offset-label";
      offsetLabelEl.textContent = offset === 0 ? "現在" : offset > 0 ? `+${offset}` : `${offset}`;
      row.appendChild(offsetLabelEl);

      if (idx >= 0 && idx < subtitles.length) {
        const cue = subtitles[idx];
        row.dataset.start = String(cue.start);

        const timeEl = document.createElement("span");
        timeEl.className = "line-time";
        timeEl.textContent = formatMs(cue.start);
        row.appendChild(timeEl);

        const textEl = document.createElement("span");
        textEl.className = "line-text";
        textEl.textContent = cue.text.replace(/\n/g, " / ");
        row.appendChild(textEl);
      } else {
        row.classList.add("empty");
        const textEl = document.createElement("span");
        textEl.className = "line-text";
        textEl.textContent = "\u2014"; // em dash placeholder, out of range
        row.appendChild(textEl);
      }

      lineListEl.appendChild(row);
    }
  }

  // ---------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------

  function renderLoop() {
    const t = getElapsedMs();
    elapsedLabelEl.textContent = formatMs(t);

    const cue = findCueAt(t);
    overlayEl.textContent = cue ? cue.text : "";

    renderLineList();

    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);
})();
