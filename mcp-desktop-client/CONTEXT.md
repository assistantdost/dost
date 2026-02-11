Got it. You want the **distilled, compiled version** — no explanations, no theory, just the **algorithm you implement**.

Here it is.

Context is always rebuilt, never stored.

---

## Context Management Algorithm (Distilled)

### Persisted State

```ts
Chat {
  messages[]                  // immutable
  summary                     // incremental
  lastSummarizedMessageId
}
```

---

## On Every AI Call

```ts
function buildContext(chat):
  context = []

  context.push(SYSTEM_PROMPT)

  if chat.summary exists:
    context.push({
      role: "system",
      content: chat.summary
    })

  context.push(lastN(chat.messages))   // token-based window

  return context
```

---

## After Each AI Response

```ts
append(chat.messages, userMessage);
append(chat.messages, assistantMessage);
```

---

## Summarization Trigger

```ts
if tokens(messages since lastSummarized) > THRESHOLD
   OR chat inactive
   OR background job:
     summarize(chat)
```

---

## Incremental Summarization

```ts
function summarize(chat):
  msgs = messages after chat.lastSummarizedMessageId

  newSummary = LLM(
    existingSummary = chat.summary,
    newMessages = msgs
  )

  chat.summary = newSummary
  chat.lastSummarizedMessageId = last(msgs).id
```

---

## Resume After Days

```ts
context = buildContext(chat);
```

No special handling.

---

## Hard Rules

- Never store transformed context
- Never regenerate summaries on read
- Never mutate message history
- Always rebuild context per request

---

## One-Line Mental Model

**Context = System Prompt + Summary + Recent Messages**

That’s the whole algorithm.
