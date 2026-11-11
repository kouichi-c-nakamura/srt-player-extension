# Manual Sync SRT Subtitles Player

A lightweight, distraction-free browser extension (Chrome & Firefox) that overlays custom `.srt` subtitles onto any streaming video using an **independent, manually synchronized stopwatch**.

---

## 💡 The Core Philosophy: "True Independence"

Most subtitle extensions try to attach to the webpage's `<video>` tag, read `video.currentTime`, and intercept player events. In practice, this breaks constantly across different streaming platforms (Netflix, Amazon Prime Video, Disney+, Hulu, YouTube, etc.) due to custom video players, DRM wrappers, shadow DOMs, or iframe isolation.

**Manual Sync SRT Subtitles Player takes a fundamentally different approach:**
* **Zero dependency on video elements:** It runs its own internal, high-precision clock (`performance.now()`).
* **Universal platform support:** Works identically across every video streaming site, forever.
* **Effortless manual adjustment:** Keep subtitles aligned with responsive ±100ms and ±1s step buttons, cue jump buttons, or direct clicks from an auto-scrolling cue list.

---

## ✨ Features

- **Platform-Agnostic Overlay:** Seamlessly floats subtitles over videos, persisting into native browser fullscreen.
- **Scrollable Subtitle Window:**
  - View upcoming and previous dialogue lines in a scrollable list.
  - Automatically highlights and centers the current line in real time.
  - Pauses auto-centering while you scroll manually so you can read ahead or back without being pulled away.
  - Click any subtitle line in the list to jump playback straight to that timestamp.
- **Micro-Adjustment Controls:**
  - Step forward/backward by `±100ms` and `±1s` for frame-accurate sync.
  - Jump directly to the previous (`◀◀`) or next (`▶▶`) subtitle cue.
- **Smart Auto-Hide:** The control panel automatically fades out after 3 seconds of inactivity and reappears as soon as the mouse moves.
- **Rich Text Support:** Renders standard SRT formatting tags such as `<i>...</i>` (italics) and `<b>...</b>` (bold).
- **Customizable Appearance:** Real-time settings for font family, font size, and subtitle color with a high-contrast text outline.
- **Site Whitelist Management:** Activate only on specified streaming domains or opt to enable everywhere via the extension popup.
- **Session Memory:** Remembers your loaded subtitle file, playback timestamp, and visual preferences across page reloads and browser sessions.

---

## 🚀 Installation

### Google Chrome / Chromium-based Browsers (Brave, Edge, Vivaldi)

1. Clone or download this repository to your local machine:
   ```bash
   git clone https://github.com/your-username/manual-sync-srt-player.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the upper-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the project folder containing `manifest.json`.
6. Pin the extension to your toolbar for easy access to the whitelist menu.

---

### Mozilla Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` from the project directory.

*(Note: To install permanently in standard Firefox, package the folder as a signed `.xpi` or load via Firefox Developer Edition / Nightly with signing disabled).*

---

## 🎮 How to Use

1. **Open a Video:** Navigate to any supported streaming website (e.g., Netflix, Amazon Prime, YouTube).
2. **Load Subtitles:** Click **SRTを選択** in the floating panel and select your local `.srt` file.
3. **Play & Sync:**
   - Hit **再生** (Play) when dialogue starts.
   - Fine-tune alignment using the `+100ms` / `-100ms` or `+1s` / `-1s` buttons.
4. **Browse Script & Jump:**
   - Click the `☰` icon in the panel header to expand the full subtitle script.
   - Scroll freely to inspect upcoming or past lines.
   - Click any row to jump the timer directly to that cue.
5. **Customize Display:**
   - Click the `🎨` icon to adjust font family, font size, or text color.

---

## ⚙️ Whitelist Configuration

By default, the overlay activates on standard streaming domains (Netflix, Prime Video, Hulu, Disney+). 

To add or manage domains:
1. Click the extension icon in your browser toolbar.
2. Click **このサイトを追加** (Add current site) to whitelist the tab you are currently viewing.
3. Or check **すべてのサイトで有効にする** (Enable on all sites) to run on every webpage.

---

## 🛠️ Project Structure

```text
├── manifest.json       # Extension manifest (Manifest V3)
├── config.js           # Whitelist rules and shared defaults
├── srt-parser.js       # Standalone SRT parser (BOM, CRLF, and timecode tolerant)
├── overlay.js          # Core content script (independent timer, UI, event loop)
├── overlay.css         # Styling for floating panel, overlay, and scroll list
├── popup.html          # Toolbar popup settings interface
├── popup.js            # Logic for managing whitelist domains
├── SRT_128.png         # Extension icon (128x128)
└── test-parser.js      # Unit tests for SRT timecode parser
```

---

## 🧪 Testing

Run the built-in parser tests with Node.js:

```bash
node test-parser.js
```

---

## 📄 License

MIT License. Feel free to use, modify, and contribute.

<br>

---
---

# Manual Sync SRT Subtitles Player (日本語版)

**独立したストップウォッチ方式（手動同期）** により、あらゆる動画ストリーミング配信サイト上に任意の `.srt` 字幕を重ねて表示できる、軽量で邪魔にならないブラウザ拡張機能（Chrome & Firefox 両対応）です。

---

## 💡 設計思想：「完全な独立性（True Independence）」

一般的な字幕拡張機能の多くは、Web ページ内の `<video>` 要素に直接アクセスし、`video.currentTime` を読み取ったり動画イベントを監視したりします。しかし、Netflix、Amazon Prime Video、Disney+、Hulu、YouTube などの主要プラットフォームは、カスタムプレイヤー、DRM 保護、Shadow DOM、iframe 分割などを採用しているため、仕様変更によって動作しなくなるトラブルが頻発します。

**Manual Sync SRT Subtitles Player は根本的に異なるアプローチを採用しています：**
* **動画要素への依存度ゼロ:** ページ側のプレイヤー構造を一切解析せず、拡張機能独自の高精度内部タイマー（`performance.now()`）で動作します。
* **恒久的な全サイト対応:** 動画プレイヤーの内部実装に左右されないため、あらゆる動画サイトで今後も変わらず同一に動作します。
* **直感的な手動アジャスト:** 動画のセリフ開始に合わせて再生ボタンを押し、±100ms / ±1s の微調整ボタンやキュー送り、あるいはスクロールリストのクリックで自在に同期できます。

---

## ✨ 主な機能

- **マルチプラットフォーム対応オーバーレイ:** 独自の字幕レイヤーを動画上にフロート表示。ブラウザネイティブの全画面（フルスクリーン）モードにも追従します。
- **スクロール可能な字幕ウインドウ:**
  - 全字幕リストを自由にスクロールして過去や未来のセリフを確認可能。
  - 現在時刻に合わせてアクティブ行をリアルタイムでハイライトし、中央に自動スクロール表示。
  - **手動スクロール中の自動追従一時停止:** ユーザーがスクロール操作している間は中央移動が自動抑制されるため、閲覧中に引き戻されるストレスがありません。
  - リスト内の任意のセリフをクリックすると、その字幕の開始時刻へ即座にタイマージャンプ。
- **フレーム単位の微調整機能:**
  - `±100ms` および `±1s` のワンクリック調整ボタンを搭載。
  - 前の字幕（`◀◀`）/ 次の字幕（`▶▶`）への頭出しスキップに対応。
- **スマート自動非表示:** 操作のない状態が3秒続くと操作パネルが滑らかにフェードアウトし、マウスを動かすと瞬時に再表示されます。
- **装飾タグのサポート:** `<i>...</i>`（斜体）や `<b>...</b>`（太字）などの一般的な SRT 書式タグを正しくレンダリング。
- **柔軟な見た目カスタマイズ:** フォントファミリー、文字サイズ、文字色をリアルタイムに変更可能。強力なアウトライン（縁取り）により、どんな背景でも高い視認性を保ちます。
- **ホワイトリスト管理:** ポップアップメニューから、指定した動画ドメインでのみ拡張機能を有効化可能（全サイト有効化も選択可）。
- **セッション記憶機能:** 最後に読み込んだ SRT ファイル、再生位置（ミリ秒）、字幕デザイン設定をストレージに保持し、リロード後も即座に再開できます。

---

## 🚀 インストール手順

### Google Chrome / Chromium 系ブラウザ (Brave, Edge, Vivaldi 等)

1. 本リポジトリをローカル環境にクローンまたはダウンロードします:
   ```bash
   git clone https://github.com/your-username/manual-sync-srt-player.git
   ```
2. Chrome を開き、アドレスバーに `chrome://extensions/` を入力して開きます。
3. 画面右上の **デベロッパーモード** を有効にします。
4. 左上に表示される **パッケージ化されていない拡張機能を読み込む** をクリックします。
5. `manifest.json` が含まれるプロジェクトフォルダを選択します。
6. ツールバーのパズルアイコンからピン留めしておくと、ホワイトリスト設定画面へ素早くアクセスできます。

---

### Mozilla Firefox

1. Firefox を開き、アドレスバーに `about:debugging#/runtime/this-firefox` を入力して開きます。
2. **一時的なアドオンを読み込む...** をクリックします。
3. プロジェクトフォルダ内の `manifest.json` を選択します。

*(※ 通常版 Firefox で恒久的に使用する場合は、署名付き `.xpi` ファイル化するか、Firefox Developer Edition / Nightly をご利用ください)。*

---

## 🎮 基本的な使い方

1. **動画を開く:** 対象のストリーミングサイト（Netflix、Amazon Prime、YouTube 等）で動画を再生します。
2. **字幕を読み込む:** 画面右上の操作パネルから **SRTを選択** を押し、手持ちの `.srt` ファイルを読み込みます。
3. **再生 & 同期:**
   - 最初のセリフが聞こえた瞬間に **再生** を押します。
   - ズレがある場合は `+100ms` / `-100ms` や `+1s` / `-1s` ボタンで位置を合わせます。
4. **セリフ一覧の閲覧・ジャンプ:**
   - パネルヘッダーの `☰` アイコンを押して字幕スクロールウインドウを展開します。
   - セリフをスクロールして確認し、任意の行をクリックすればその字幕へ瞬時にジャンプします。
5. **見た目の変更:**
   - `🎨` アイコンを押すと、フォントの種類、文字サイズ、色をリアルタイムに調節できます。

---

## ⚙️ ホワイトリスト設定

初期状態では、主要な動画配信ドメイン（Netflix、Prime Video、Hulu、Disney+）が登録されています。

ドメインの追加や管理を行うには:
1. ブラウザツールバーの拡張機能アイコンをクリックします。
2. **このサイトを追加** を押すと、現在開いているドメインが登録されます。
3. **すべてのサイトで有効にする** をオンにすると、ドメインを問わず全 Web ページで動作します。

---

## 🛠️ プロジェクト構成

```text
├── manifest.json       # 拡張機能のマニフェスト (Manifest V3)
├── config.js           # ホワイトリスト定義および共通設定
├── srt-parser.js       # スタンドアロン SRT パーサー (BOM, CRLF, タイムコード欠落耐性あり)
├── overlay.js          # メインコンテンツスクリプト (独立タイマー、UI、描画ループ)
├── overlay.css         # フローティングパネル、オーバーレイ、スクロール領域のスタイル
├── popup.html          # ツールバー設定ポップアップ画面
├── popup.js            # ホワイトリスト管理用ロジック
├── SRT_128.png         # 拡張機能アイコン (128x128)
└── test-parser.js      # SRT パーサー検証用単体テスト
```

---

## 🧪 単体テストの実行

Node.js を使用してパーサーのテストスイートを実行できます:

```bash
node test-parser.js
```

---

## 📄 ライセンス

MIT License