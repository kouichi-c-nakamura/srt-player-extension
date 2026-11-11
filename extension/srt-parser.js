/**
 * SRT parser - pure logic, no DOM/browser dependency.
 *
 * Output format (array of cues), sorted by start time ascending:
 *   { index: number, start: number, end: number, text: string }
 * start/end are in milliseconds.
 *
 * Design notes:
 * - Deliberately tolerant of minor format quirks (CRLF vs LF, BOM,
 *   trailing blank lines, missing sequence numbers) since SRT files
 *   found "in the wild" are not always strictly well-formed.
 * - Text keeps internal newlines as "\n"; caller decides how to render
 *   (e.g. convert to <br> for HTML display).
 */

/**
 * Convert an SRT timecode "HH:MM:SS,mmm" (comma OR period as separator)
 * into milliseconds.
 */
function timecodeToMs(timecode) {
  const match = timecode
    .trim()
    .match(/^(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})$/);

  if (!match) {
    throw new Error(`Invalid SRT timecode: "${timecode}"`);
  }

  const [, hh, mm, ss, ms] = match;
  const millis = ms.padEnd(3, "0"); // handle 1-2 digit ms just in case

  return (
    parseInt(hh, 10) * 3600000 +
    parseInt(mm, 10) * 60000 +
    parseInt(ss, 10) * 1000 +
    parseInt(millis, 10)
  );
}

/**
 * Parse raw SRT file text into an array of cue objects.
 * Throws on cues whose timecode line cannot be parsed; skips
 * cues that are empty/malformed in ways that are safe to ignore
 * (e.g. a stray blank block).
 */
function parseSrt(rawText) {
  if (typeof rawText !== "string") {
    throw new Error("parseSrt expects a string");
  }

  // Strip UTF-8 BOM if present, normalize line endings.
  const text = rawText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");

  // Blocks are separated by one or more blank lines.
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  const cues = [];
  let autoIndex = 1;

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim());

    // A block is either:
    //   [seq]
    //   timecode line
    //   text...
    // or (seq missing):
    //   timecode line
    //   text...
    let cursor = 0;
    let seq = null;

    if (/^\d+$/.test(lines[cursor])) {
      seq = parseInt(lines[cursor], 10);
      cursor += 1;
    }

    const timecodeLine = lines[cursor];
    if (!timecodeLine || !timecodeLine.includes("-->")) {
      // Not a recognizable cue block; skip it rather than aborting
      // the whole file over one bad block.
      continue;
    }

    const [startRaw, endRaw] = timecodeLine.split("-->").map((s) => s.trim());
    // endRaw may have trailing text like "X1:... line:..." (rare
    // positioning metadata) - only take the first token.
    const endToken = endRaw.split(/\s+/)[0];

    let start, end;
    try {
      start = timecodeToMs(startRaw);
      end = timecodeToMs(endToken);
    } catch (e) {
      // Skip unparsable cue rather than failing the whole file.
      continue;
    }

    const textLines = lines.slice(cursor + 1);
    const cueText = textLines.join("\n").trim();

    cues.push({
      index: seq !== null ? seq : autoIndex,
      start,
      end,
      text: cueText,
    });

    autoIndex += 1;
  }

  // Ensure sorted by start time - required for the binary-search /
  // next-previous lookups used later in the timer logic.
  cues.sort((a, b) => a.start - b.start);

  return cues;
}

// Expose for both plain <script> usage (popup.html) and potential
// future module/bundler usage.
if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseSrt, timecodeToMs };
}
