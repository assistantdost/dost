- User types a query, createChat runs, returns chatId, opens /chat/:chatId, the query then goes to /api/chat locally

- as new chat is created, update the all Chats [invalidate]

- As AI calls are made, PATCH /api/chats/id is hit and messages are appended, a copy of the messages are maintained in store - chatStore
  {
  chatId : id,
  messages : [messages array],
  }

- in the AppSidebar content, all chats are available GET /api/chats

- clicking a chat in the AppSidebar loads the chat GET /api/chats/:chatId
