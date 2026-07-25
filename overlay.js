// Step 2 goal: prove the overlay renders correctly on top of real
// pages (including inside fullscreen video), with the intended
// position/style. No timer, no SRT loading yet - just one hardcoded
// cue so we can focus purely on the visual layer.

(function () {
  const STATIC_CUE_TEXT = "複数行のテキスト\n2行目です"; // cue #2 from test-sample.srt

  function createOverlay() {
    const el = document.createElement("div");
    el.id = "srt-player-overlay";
    el.textContent = STATIC_CUE_TEXT;
    return el;
  }

  let overlayEl = createOverlay();
  document.documentElement.appendChild(overlayEl);

  // Fullscreen handling: entering fullscreen (e.g. clicking the
  // video's own fullscreen button) creates a new stacking context
  // rooted at the fullscreen element. A node appended to <html>
  // will NOT be visible over a fullscreen <video> in most browsers,
  // so we must re-parent the overlay into whatever element is
  // currently fullscreen, and move it back when fullscreen exits.
  //
  // This is exactly the kind of platform quirk that's worth
  // confirming visually in Step 2, before any timer logic is added.
  function handleFullscreenChange() {
    const fsEl = document.fullscreenElement;

    if (fsEl) {
      fsEl.appendChild(overlayEl);
    } else {
      document.documentElement.appendChild(overlayEl);
    }
  }

  document.addEventListener("fullscreenchange", handleFullscreenChange);
  // Older WebKit prefix, harmless if unsupported.
  document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
})();
