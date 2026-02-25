# Chat Summarization

## Overview

The summarization system automatically compresses old conversation history into a rolling summary when it exceeds a token threshold. This keeps the LLM context window manageable across long conversations without losing important context.

**Location:** `client/src/components/ChatWindow.jsx` → `prepareSendMessagesRequest()`  
**Trigger:** Token count of `messagesToSummarize` exceeds `SUMMARY_TRIGGER_TOKENS`  
**Endpoint:** `POST /api/summarize`

---

## Configuration

Controlled via `.env` (place in `mcp-desktop-client/.env`):

| Variable                          | Default | Description                                                  |
| --------------------------------- | ------- | ------------------------------------------------------------ |
| `VITE_SUMMARY_TRIGGER_TOKENS`     | `1000`  | Token limit for `messagesToSummarize` before summarizing     |
| `VITE_SUMMARY_WINDOW_CONVERSATIONS` | `2`   | Number of recent conversations to keep outside the summary   |

A **conversation** = one user message + one assistant response (a pair).

---

## Algorithm

### Step 1 — Inject existing summary

If a summary exists in the store (from a previous summarization cycle):
- Find `lastSummarizedMessageId` in the full messages array
- Slice to only messages **after** that ID
- Prepend the summary as a `system` message at index 0

```
messages:      [U1][A1][U2][A2][U3][A3][U4][A4][U5][A5][U6query]
                         ↑
               lastSummarizedMessageId = A2

→ recentMessages = [oldSummary][U3][A3][U4][A4][U5][A5][U6query]
```

> The `oldSummary` is intentionally included in `messagesToSummarize` (Step 2) so it gets merged into the new summary — no context is lost.

---

### Step 2 — Split into window + older

```
currentQuery        = recentMessages[-1]       ← current user input
historyWithoutQuery = recentMessages[0..-2]    ← everything before it
```

Walk **backwards** through `historyWithoutQuery` counting `user` messages.  
Stop when count reaches `SUMMARY_WINDOW_CONVERSATIONS` → that's `windowStartIndex`.

```
historyWithoutQuery:
[oldSummary][U3][A3][U4][A4][U5][A5]
                         ↑
               windowStartIndex (2nd user msg from end, with N=2)

messagesToSummarize = [oldSummary][U3][A3][U4][A4]   ← token checked + summarized
windowMessages      = [U5][A5]                        ← always kept as-is
```

> `summaryMessage` has `role: "system"` — it is **never counted** as a conversation in the walk, so it always ends up in `messagesToSummarize`.

---

### Step 3 — Token check

Token check is performed **only on `messagesToSummarize`** (not the full history).

```javascript
const withinTokenLimit =
    messagesToSummarize.length === 0 ||
    isWithinTokenLimit(convertedToSummarize, SUMMARY_TRIGGER_TOKENS);
```

Uses `gpt-tokenizer/model/gpt-4o`. Messages are converted from `parts` format to plain text before counting.

---

### Step 4 — Summarize or pass through

**If over token limit:**
```
POST /api/summarize { messages: messagesToSummarize }
→ newSummaryMessage

updateChatSummary(chatId, summaryText, newLastSummarizedId)   ← persist to backend
setSummary(summaryText, newLastSummarizedId)                   ← update store

recentMessages = [newSummary][U5][A5][U6query]
```

**If within token limit:**
```
recentMessages = [oldSummary][U3][A3][U4][A4][U5][A5][U6query]
                  (full history sent as-is)
```

---

## Data Flow Diagram

```
Full messages array
       │
       ▼
Step 1: Inject existing summary
[oldSummary?][Ux][Ax]...[Un][An][query]
       │
       ▼
Step 2: Split at windowStartIndex
       ├── messagesToSummarize = [oldSummary?][Ux][Ax]...[Un-N][An-N]
       └── windowMessages      = [Un-N+1][An-N+1]...[Un][An]
       │
       ▼
Step 3: Token check on messagesToSummarize
       │
       ├── OVER limit ──▶ POST /api/summarize ──▶ [newSummary][window][query]
       │
       └── WITHIN limit ─────────────────────────▶ [full history][query]
       │
       ▼
POST /api/chat { messages: recentMessages, chatId }
```

---

## Multi-cycle Example

### Cycle 1 — First summarization
```
Conversation so far (5 pairs):
[U1][A1][U2][A2][U3][A3][U4][A4][U5][A5]  +  [U6 query]

No existing summary yet.

historyWithoutQuery = [U1][A1][U2][A2][U3][A3][U4][A4][U5][A5]
windowStartIndex    = index of U4  (2 conversations from end = U5A5, U4A4)
messagesToSummarize = [U1][A1][U2][A2][U3][A3]
windowMessages      = [U4][A4][U5][A5]

Token check on messagesToSummarize → OVER limit
→ Summarize [U1A1 U2A2 U3A3] → S1
→ lastSummarizedId = A3.id

Sent to LLM: [S1][U4][A4][U5][A5][U6]
```

### Cycle 2 — Re-summarization (merges old summary)
```
New messages added: [U7][A7][U8][A8]
Current query: U9

Step 1: lastSummarizedId = A3.id
→ slice after A3 = [U4][A4][U5][A5][U6][A6][U7][A7][U8][A8]
→ recentMessages = [S1][U4][A4][U5][A5][U6][A6][U7][A7][U8][A8]

historyWithoutQuery = [S1][U4][A4][U5][A5][U6][A6][U7][A7][U8][A8]
windowStartIndex    = index of U7  (2 conversations from end = U8A8, U7A7)
messagesToSummarize = [S1][U4][A4][U5][A5][U6][A6]
windowMessages      = [U7][A7][U8][A8]

Token check → OVER limit
→ Summarize [S1 + U4A4 + U5A5 + U6A6] → S2  (old summary merged in ✅)
→ lastSummarizedId = A6.id

Sent to LLM: [S2][U7][A7][U8][A8][U9]
```

---

## Store Integration

The summary is persisted in two places:

| Store | Method | Purpose |
|-------|--------|---------|
| Backend DB | `updateChatSummary(chatId, text, lastId)` | Survives page refresh / app restart |
| Zustand | `setSummary(text, lastId)` | In-memory for current session |

Both are updated **atomically** (backend first, then store) to keep them in sync.

---

## Error Handling

`setSummarizing(true/false)` is wrapped in `try/finally` — the loading spinner always clears even if the summarize API throws.

```javascript
setSummarizing(true);
try {
    const result = await axios.post(`${API_URL}/api/summarize`, ...);
    // ...
} finally {
    setSummarizing(false);   // ← always runs
}
```
