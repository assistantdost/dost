# Chat Conversation Cursor Pagination

## Overview

This document explains how conversation message pagination works for chat retrieval.

- Endpoint behavior is cursor-based.
- Messages are fetched in bounded pages (default limit is 30).
- Cursor format is `created_at::message_id`.
- Message ordering is stabilized using `(created_at, id)`.

## Why Cursor Pagination

Cursor pagination is used to keep payload size and memory usage bounded.

- The server never loads the whole conversation for normal page fetches.
- The client can load older messages incrementally when scrolling up.
- Pagination remains stable even when multiple messages share the same timestamp.

## Cursor Format

Cursor token:

- `<iso_datetime>::<message_id>`

Example:

- `2026-04-06T18:52:51.711897+00:00::01KNJ27TGXTZC1NKJE2NRWG2A4`

## Sort and Comparison Rules

Messages are sorted in descending order when fetched from DB:

- `created_at DESC, id DESC`

To fetch strictly older rows than a cursor boundary:

- `created_at < cursor_dt`
- or (`created_at == cursor_dt` and `id < cursor_id`)

This tuple comparison prevents duplicates or skips across pages.

## Page Fetch Algorithm

1. Resolve and validate the chat by `chat_id` and `user_id`.
2. Build base message query for that chat.
3. If cursor exists, apply the "older than cursor" predicate.
4. Fetch `limit + 1` rows.
5. `has_more_older = len(rows) > limit`.
6. Keep first `limit` rows as current page.
7. Build `next_cursor` from the oldest message in returned page.
8. Reverse page in memory for API output order (chronological).

## First-Load Summary Boundary Rule

On first load only (no cursor), we optionally expand the page using `last_summarized_message_id`.

Rule:

- Start with latest `limit` rows.
- If summary boundary is older than the oldest loaded row, expand up to that boundary.

Examples (negative index from latest):

- Boundary at `-17` => return `-30` (keep default 30 window).
- Boundary at `-35` => return `-35` (expanded page includes boundary).

## Response Fields

The paginated chat response includes:

- `messages`: Chronological messages for current page.
- `next_cursor`: Cursor token for loading older messages.
- `has_more_older`: Whether another older page exists.
- Chat metadata (`id`, `name`, `chat_model`, `summary`, etc.).

## Notes

- Cursor should always be generated from the oldest returned message in the page.
- Frontend should treat cursor as an opaque token.
- If first-load expansion is enabled, page size may exceed the default limit in that specific scenario.

## Query Cost (Before vs Now)

The current implementation saves database queries in common paths by:

- Decoding `last_summarized_message_id` timestamp from ULID (no summary-row lookup query).
- Using `limit + 1` to derive `has_more_older` (no separate "older exists" query).

### Cursor page (scroll-up load)

- Before: 2 queries
    - page query
    - `has_more_older` existence query
- Now: 1 query
    - page query with `limit + 1`

Saved: **1 query per scroll-up page**

### First load, no boundary expansion

- Before: 3 queries
    - page query
    - summary boundary lookup query
    - `has_more_older` existence query
- Now: 1 query
    - page query with `limit + 1`

Saved: **2 queries**

### First load, boundary expansion triggered

- Before: 4 queries
    - page query
    - summary boundary lookup query
    - expansion query
    - `has_more_older` existence query
- Now: 2 queries
    - page query with `limit + 1`
    - expansion query

Saved: **2 queries**
