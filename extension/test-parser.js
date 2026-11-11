const fs = require("fs");
const path = require("path");
const { parseSrt, timecodeToMs } = require("./srt-parser.js");

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label}\n  expected: ${e}\n  actual:   ${a}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

// --- timecodeToMs unit checks ---
assertEqual(timecodeToMs("00:00:01,000"), 1000, "timecodeToMs basic seconds");
assertEqual(timecodeToMs("00:01:00,500"), 60500, "timecodeToMs minutes+ms");
assertEqual(timecodeToMs("01:00:00,000"), 3600000, "timecodeToMs hours");

// --- full file parse ---
const raw = fs.readFileSync(path.join(__dirname, "test-sample.srt"), "utf8");
const cues = parseSrt(raw);

assertEqual(cues.length, 3, "cue count");
assertEqual(cues[0].start, 1000, "cue 1 start");
assertEqual(cues[0].end, 4000, "cue 1 end");
assertEqual(cues[0].text, "こんにちは、これは字幕です", "cue 1 text (Japanese)");

assertEqual(cues[1].text, "複数行のテキスト\n2行目です", "cue 2 multi-line text");

assertEqual(cues[2].index, 3, "cue 3 index");

// --- edge cases: BOM, CRLF, missing sequence number ---
const edgeCaseRaw =
  "\uFEFF00:00:00,000 --> 00:00:02,000\r\nNo sequence number here\r\n\r\n2\r\n00:00:03,000 --> 00:00:05,000\r\nSecond cue\r\n";
const edgeCues = parseSrt(edgeCaseRaw);

assertEqual(edgeCues.length, 2, "edge case cue count");
assertEqual(edgeCues[0].index, 1, "edge case auto-assigned index for missing seq");
assertEqual(edgeCues[0].text, "No sequence number here", "edge case text with BOM/CRLF stripped");
assertEqual(edgeCues[1].start, 3000, "edge case second cue start");

console.log("\nDone.");
