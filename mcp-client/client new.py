from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
import asyncio
from langgraph.checkpoint.memory import MemorySaver
import os
import sys
import traceback
from dotenv import load_dotenv

# Unused imports removed:
# - ConversationSummaryBufferMemory: LangChain memory (use MemorySaver with LangGraph instead)
# - BaseChatMessageHistory, BaseMessage: Abstract classes (not directly used)
# - List from typing: Type hint (not used in current implementation)

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("❌ Error: GROQ_API_KEY not found in environment variables")
    print("Please set GROQ_API_KEY in your .env file")
    sys.exit(1)

try:
    client = MultiServerMCPClient(
        {
            "stdio_test": {
                "command": "python",
                "args": ["../mcp-server-package/server.py"],
                "transport": "stdio",
            },
            "remote_server_test": {
                "url": "http://127.0.0.1:8000/mcp",
                "transport": "streamable_http",
            }
        }
    )
    print("✅ MCP client initialized successfully")
except Exception as e:
    print(f"❌ Error initializing MCP client: {e}")
    print("Make sure your MCP servers are running and accessible")
    sys.exit(1)


async def main():
    try:
        print("🔄 Connecting to MCP servers and retrieving tools...")
        tools = await client.get_tools()
        print(f"✅ Successfully retrieved {len(tools)} tools")
        # print("Tools retrieved:", tools)
    except Exception as e:
        print(f"❌ Failed to retrieve tools from MCP servers: {e}")
        print("This could be due to:")
        print("  - MCP servers not running")
        print("  - Network connectivity issues")
        print("  - Invalid server configuration")
        return

    # Memory Configuration Options
    MAX_MESSAGES = 20  # Keep last 20 messages (10 exchanges)
    SUMMARY_TRIGGER = 15  # When to start summarizing (keep this many recent messages)

    async def summarize_messages(messages):
        """
        Summarize a list of messages using the LLM.
        Returns a summary string.
        """
        try:
            # Only summarize user and AI messages, not system/tool messages
            text_content = []
            for m in messages:
                if isinstance(m, (HumanMessage, AIMessage)):
                    role = "User" if isinstance(m, HumanMessage) else "AI"
                    text_content.append(f"{role}: {m.content}")

            if not text_content:
                return "No conversation to summarize."

            text = "\n".join(text_content)
            # Use a simpler model for summarization to save tokens
            summary_model = ChatGroq(
                model="llama-3.1-8b-instant",  # Faster, cheaper model for summaries
                api_key=GROQ_API_KEY,
                max_tokens=1000
            )

            prompt = (f"Summarize the following conversation concisely in 3-5 sentences, "
                      f"focusing on key topics and decisions:\n\n{text}")
            summary_response = await summary_model.ainvoke([HumanMessage(content=prompt)])

            return summary_response.content if hasattr(summary_response, "content") else str(summary_response)
        except Exception as e:
            print(f"⚠️ Warning: Failed to generate summary: {e}")
            return "Summary unavailable due to error."

    try:
        # Create memory saver for persistent conversation
        # Option 1: In-memory (not recommended - lost on restart, has bugs)
        memory = MemorySaver()

        # Thread versioning system for clean summarization
        thread_base = "conversation-1"
        thread_gen = 1  # bump this whenever you summarize
        max_threads_to_keep = 3  # Only keep last 3 threads in memory

        def make_config():
            return {"configurable": {"thread_id": f"{thread_base}::v{thread_gen}"}}

        async def reset_thread_with(messages):
            """Start a fresh thread and seed it with messages, cleaning up old threads"""
            nonlocal thread_gen

            # Get current thread config before incrementing
            old_config = make_config()
            old_thread_id = old_config['configurable']['thread_id']

            # Delete old thread to free memory
            try:
                # Try to clear the old thread's state
                await memory.adelete(old_config)
                print(f"🗑️ Deleted old thread: {old_thread_id}")
            except Exception as e:
                print(f"⚠️ Warning: Could not delete old thread {old_thread_id}: {e}")

            # Also cleanup really old threads (keep only last few)
            if thread_gen > max_threads_to_keep:
                very_old_gen = thread_gen - max_threads_to_keep
                very_old_config = {"configurable": {"thread_id": f"{thread_base}::v{very_old_gen}"}}
                try:
                    await memory.adelete(very_old_config)
                    print(f"🗑️ Cleaned up very old thread: v{very_old_gen}")
                except Exception:
                    # It's okay if it doesn't exist anymore
                    pass

            # Create new thread
            thread_gen += 1
            new_config = make_config()
            await agent.aupdate_state(new_config, {"messages": messages})
            print(f"🔄 Started fresh thread: {new_config['configurable']['thread_id']} (memory optimized)")
            return new_config

        print("✅ Memory system with thread versioning initialized")
    except Exception as e:
        print(f"❌ Failed to initialize memory system: {e}")
        return

    async def trim_memory_if_needed():
        """Trim conversation memory and summarize older messages if needed"""
        try:
            config = make_config()
            state = await agent.aget_state(config)
            messages = state.values.get('messages', [])

            if len(messages) > MAX_MESSAGES:
                # Split messages: older ones to summarize, recent ones to keep
                to_summarize = messages[:-SUMMARY_TRIGGER]
                recent_messages = messages[-SUMMARY_TRIGGER:]

                if to_summarize:
                    print(f"📝 Summarizing {len(to_summarize)} older messages...")
                    summary_text = await summarize_messages(to_summarize)

                    # Create a summary message and combine with recent messages
                    summary_msg = AIMessage(
                        content=f"[CONVERSATION SUMMARY]: {summary_text}",
                        additional_kwargs={"type": "summary"}
                    )
                    trimmed_messages = [summary_msg] + recent_messages

                    # Use fresh thread approach - create new thread with summary + recent messages
                    config = await reset_thread_with(trimmed_messages)
                    print(f"✅ Summarized {len(to_summarize)} messages, kept {len(recent_messages)} recent messages")
                else:
                    # Just trim without summary if no old messages
                    trimmed_messages = messages[-MAX_MESSAGES:]
                    config = await reset_thread_with(trimmed_messages)
                    print(f"🗂️ Memory trimmed: kept last {MAX_MESSAGES} messages")

                return True
            return False
        except Exception as e:
            print(f"❌ Error in memory management: {e}")
            print(f"Error details: {traceback.format_exc()}")
            return False

    # Create LangGraph agent with memory
    try:
        agent = create_react_agent(
            # model=ChatGroq(model="openai/gpt-oss-20b", api_key=GROQ_API_KEY),
            model=ChatGroq(
                model="openai/gpt-oss-120b",
                api_key=GROQ_API_KEY,
                max_tokens=3000,
                reasoning_effort="medium"
            ),
            tools=tools,
            checkpointer=memory,  # Add memory checkpoint
            prompt=(
                "You are a helpful assistant. You can use multiple tools in sequence to solve complex tasks. "
                "If a tool's output suggests another tool should be used, do so. "
                "Always explain your reasoning and show intermediate steps. "
                "Keep reasoning small and focused until asked for more. "
                "Try to answer quickly and using fewer tokens. "
                "If you see a [CONVERSATION SUMMARY] message, use it as context for the conversation history."
            )
        )
        print("✅ LangGraph agent created successfully")
    except Exception as e:
        print(f"❌ Failed to create agent: {e}")
        print("This could be due to:")
        print("  - Invalid Groq API key")
        print("  - Model not available")
        print("  - Tools configuration issues")
        return

    print("Agent ready! Type 'exit' to quit.")
    print("💡 Conversation history maintained by MemorySaver with smart summarization")
    print(f"📏 Memory limit: {MAX_MESSAGES} messages maximum")
    print(f"📝 Summarization: Older messages auto-summarized when > {SUMMARY_TRIGGER} recent messages")
    print("🔍 Type 'history' to see conversation history from memory")
    print("🗑️  Type 'clear' to clear conversation history")
    print("✂️  Type 'trim' to manually trim memory to limit")
    print("📝 Type 'summarize' to manually trigger summarization")

    while True:
        try:
            query = input("\nYou: ")
            if query.lower() in ["exit", "quit"]:
                print("👋 Goodbye!")
                break

            if query.lower() == "history":
                # Get actual conversation history from LangGraph memory
                try:
                    config = make_config()
                    # Get the actual state from LangGraph
                    state = await agent.aget_state(config)
                    actual_messages = state.values.get('messages', [])

                    print(
                        f"\n📜 Conversation History from MemorySaver ({len(actual_messages)} messages):")
                    print(f"🔍 Memory Type: {type(memory).__name__}")
                    print(f"🆔 Thread ID: {config['configurable']['thread_id']}")
                    print(f"📏 Memory Limit: {MAX_MESSAGES} messages")
                    print(f"📊 State Keys: {list(state.values.keys())}")

                    for i, msg in enumerate(actual_messages, 1):
                        if isinstance(msg, HumanMessage):
                            role = "🧑 User"
                        elif isinstance(msg, AIMessage):
                            if msg.additional_kwargs.get("type") == "summary":
                                role = "📝 Summary"
                            else:
                                role = "🤖 AI"
                        else:
                            role = "🛠️ System"

                        content = msg.content[:100] + \
                            "..." if len(msg.content) > 100 else msg.content
                        print(f"  {i}. {role}: {content}")

                    if len(actual_messages) > MAX_MESSAGES:
                        print("⚠️  Memory exceeds limit! Consider trimming.")
                except Exception as e:
                    print(f"❌ Error accessing memory: {e}")
                    print("Memory may be corrupted or inaccessible")
                continue

            if query.lower() == "trim":
                # Manually trim memory
                try:
                    await trim_memory_if_needed()
                except Exception as e:
                    print(f"❌ Error during manual trim: {e}")
                continue

            if query.lower() == "summarize":
                # Manually trigger summarization - force summarize regardless of current count
                try:
                    config = make_config()
                    state = await agent.aget_state(config)
                    messages = state.values.get('messages', [])

                    if len(messages) < 3:  # Need at least some messages to summarize
                        print(f"ℹ️ Not enough messages to summarize (need at least 3, have {len(messages)})")
                    else:
                        print(f"🔍 Current messages in memory: {len(messages)}")
                        # Force summarization by taking all but the last few messages
                        to_summarize = messages[:-3]  # Keep only last 3 messages
                        recent_messages = messages[-3:]

                        if to_summarize:
                            print(f"📝 Manually summarizing {len(to_summarize)} messages and kept {len(recent_messages)} recent messages...")       # noqa
                            summary_text = await summarize_messages(to_summarize)

                            # Create summary message and combine with recent messages
                            summary_msg = AIMessage(
                                content=f"[CONVERSATION SUMMARY]: {summary_text}",
                                additional_kwargs={"type": "summary"}
                            )
                            new_messages = [summary_msg] + recent_messages
                            print(f"🔍 New messages count after summarization: {len(new_messages)}")

                            # Use fresh thread approach - create new thread with summary + recent messages
                            config = await reset_thread_with(new_messages)
                            print(f"✅ Summarized {len(to_summarize)} messages, "
                                  f"kept {len(recent_messages)} recent messages")

                            print("🕵️  Verifying state immediately after fresh thread...")
                            state_after_update = await agent.aget_state(config)
                            messages_after_update = state_after_update.values.get('messages', [])
                            print(f"🕵️  Messages in fresh thread: {len(messages_after_update)}")
                        else:
                            print("ℹ️ No older messages to summarize")
                except Exception as e:
                    print(f"❌ Error during manual summarization: {e}")
                continue

            if query.lower() == "clear":
                # Clear LangGraph memory properly - start completely fresh thread
                try:
                    config = await reset_thread_with([])  # Empty messages
                    print("🗑️  Started fresh conversation thread with cleared history!")
                except Exception as e:
                    print(f"❌ Error clearing memory: {e}")
                continue

            if not query.strip():
                continue

            # Send message to agent with thread context (this maintains memory)
            user_message = HumanMessage(content=query)
            config = make_config()

            # # Debug: Show what's being sent
            # print(f"🔍 Sending to agent: Current message only")
            # print(f"📝 MemorySaver maintains the REAL history in thread memory")

            try:
                print("🤔 Thinking...")
                response = await agent.ainvoke(
                    {"messages": [user_message]},  # Only send current message
                    config=config  # Thread maintains history
                )

                # Process output: show AI message and reasoning in green
                messages = response.get('messages', [])
                # Find last AIMessage
                ai_msg = None
                for msg in reversed(messages):
                    if msg.__class__.__name__ == "AIMessage":
                        ai_msg = msg
                        break

                if ai_msg:
                    # Show token usage and other metadata in orange
                    meta = getattr(ai_msg, 'response_metadata', {})
                    usage = meta.get('token_usage', {})
                    if usage:
                        print(f"\033[33mToken usage: {usage}\033[0m")
                    if 'model_name' in meta:
                        print(f"\033[33mModel: {meta['model_name']}\033[0m")
                    if 'finish_reason' in meta:
                        print(f"\033[33mFinish reason: {meta['finish_reason']}\033[0m")
                    reasoning = ai_msg.additional_kwargs.get('reasoning_content', '')
                    if reasoning:
                        print(f"\033[92mAI reasoning: {reasoning}\033[0m")
                    # ANSI blue for AI message, green for reasoning
                    print(f"\033[94mAI: {getattr(ai_msg, 'content', '')}\033[0m")
                else:
                    print("⚠️ No AI response found in the output")
                    print(f"Raw response: {response}")

            except Exception as e:
                print(f"❌ Failed to process your request: {e}")
                print("This could be due to:")
                print("  - Network connectivity issues")
                print("  - API rate limits or quota exceeded")
                print("  - Tool execution errors")
                print("  - Model or server issues")
                print(f"Error details: {traceback.format_exc()}")
                continue

            # Auto-trim memory after each response to maintain limit
            try:
                await trim_memory_if_needed()
            except Exception as e:
                print(f"⚠️ Warning: Auto-trim failed: {e}")

        except KeyboardInterrupt:
            print("\n\n👋 Interrupted by user. Goodbye!")
            break
        except EOFError:
            print("\n\n👋 End of input. Goodbye!")
            break
        except Exception as e:
            print(f"❌ Unexpected error in main loop: {e}")
            print(f"Error details: {traceback.format_exc()}")
            print("Continuing...")
            continue

try:
    asyncio.run(main())
except KeyboardInterrupt:
    print("\n\n👋 Program interrupted by user. Goodbye!")
except Exception as e:
    print(f"\n❌ Fatal error: {e}")
    print(f"Error details: {traceback.format_exc()}")
    sys.exit(1)
