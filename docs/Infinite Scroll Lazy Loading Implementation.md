# Infinite Scroll Lazy Loading Implementation

## Overview

This document describes the implementation of infinite scroll lazy loading for chat lists in the DOST MCP application. The feature loads chats in pages of 20, automatically fetching more data as the user scrolls to the end of the list, using efficient cursor-based pagination instead of offset-based pagination.

## Architecture

### Backend (mcp-server-web)

#### Database Query Changes

- **File**: `crud/chat.py`
- **Function**: `get_user_chats(db, user_id, limit=20, cursor=None)`
- **Pagination**: Cursor-based using `updated_at` timestamp
- **Ordering**: `updated_at DESC` (most recently updated first)

```python
async def get_user_chats(db: AsyncSession, user_id: str, limit: int = 20, cursor: Optional[str] = None) -> List[ChatModel]:
    query = select(ChatModel).where(ChatModel.user_id == user_id)

    if cursor:
        cursor_dt = datetime.fromisoformat(cursor.replace('Z', '+00:00'))
        query = query.where(ChatModel.updated_at < cursor_dt)

    query = query.order_by(ChatModel.updated_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
```

#### API Endpoint Changes

- **File**: `routers/chat.py`
- **Endpoint**: `GET /chats/`
- **Query Parameters**:
    - `limit` (int, default: 20, min: 1, max: 100)
    - `cursor` (str, optional): ISO format timestamp
- **Response Model**: `PaginatedChats`

```python
@router.get("/", response_model=PaginatedChats)
async def get_user_chats(
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(protected_route)
):
    chats = await crud_chat.get_user_chats(db, current_user, limit, cursor)

    result = []
    for chat in chats:
        result.append(ChatMeta(...))

    next_cursor = result[-1].updated_at.isoformat() if result and len(result) == limit else None
    return PaginatedChats(chats=result, next_cursor=next_cursor)
```

#### Schema Changes

- **File**: `schemas/chat.py`
- **New Model**: `PaginatedChats`

```python
class PaginatedChats(BaseModel):
    chats: List[ChatMeta]
    next_cursor: Optional[str] = None
```

### Frontend (mcp-desktop-client)

#### API Changes

- **File**: `src/api/chat.js`
- **Function**: `getUserChats(limit = 20, cursor = null)`

```javascript
export const getUserChats = async (limit = 20, cursor = null) => {
	const params = new URLSearchParams();
	params.append("limit", limit);
	if (cursor) params.append("cursor", cursor);
	return apiHelpers.get(`/chats/?${params.toString()}`);
};
```

#### Query Changes

- **File**: `src/lib/tanstackQueries.js`
- **Hook**: `useInfiniteQuery` with cursor-based pagination

```javascript
export const chatQueryOptions = {
	list: ({ enabled = true, onSuccess } = {}) => ({
		queryKey: queryKeys.chats.all,
		queryFn: async ({ pageParam = null }) => {
			const response = await getUserChats(20, pageParam);
			return response || { chats: [], next_cursor: null };
		},
		enabled,
		onSuccess,
		getNextPageParam: (lastPage) => lastPage.next_cursor,
	}),
};
```

#### Component Changes

- **File**: `src/components/AppSidebar.jsx`
- **Features**:
    - Infinite query with automatic cursor management
    - Intersection Observer for scroll detection
    - Scrollable container with max height
    - Loading states for initial and subsequent loads

```javascript
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
	useInfiniteQuery(chatQueryOptions.list({ enabled: logged && !!token }));

const allChats = data?.pages?.flatMap((page) => page.chats) || [];

// Intersection Observer for automatic loading
useEffect(() => {
	if (sentinelRef.current && hasNextPage) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 1.0 },
		);
		observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

## API Flow

### First Request

```
GET /chats/?limit=20
Authorization: Bearer <token>
```

**Response:**

```json
{
  "chats": [
    {
      "id": "chat-uuid-1",
      "name": "Chat Name",
      "chat_model": {...},
      "created_at": "2024-04-09T10:00:00+00:00",
      "updated_at": "2024-04-09T10:30:00+00:00",
      "summary": null,
      "last_summarized_message_id": null
    }
  ],
  "next_cursor": "2024-04-09T10:30:00+00:00"
}
```

### Subsequent Requests

```
GET /chats/?limit=20&cursor=2024-04-09T10:30:00+00:00
```

## Performance Benefits

1. **Cursor-based vs Offset-based**: More efficient for large datasets, avoids skipping rows
2. **Lazy Loading**: Only loads data as needed, reducing initial load time
3. **Memory Efficient**: Frontend only holds currently loaded chats in memory
4. **Database Efficient**: Limits database queries and result sets

## UI/UX Features

- **Automatic Loading**: No manual "Load More" button needed
- **Loading Indicators**: Shows "Loading chats..." and "Loading more..." states
- **Scrollable Container**: Fixed height with overflow scrolling
- **Smooth Experience**: Seamless pagination without page refreshes

## Edge Cases Handled

- **No Chats**: Shows "No chats yet" message
- **End of Data**: `next_cursor` is `null` when no more data available
- **Network Errors**: TanStack Query handles retries and error states
- **Authentication**: Only loads for logged-in users with valid tokens

## Future Enhancements

- **Pull-to-Refresh**: Add swipe-to-refresh functionality
- **Search Integration**: Implement search within loaded chats
- **Real-time Updates**: WebSocket integration for new chat notifications
- **Virtual Scrolling**: For extremely large lists (1000+ items)
