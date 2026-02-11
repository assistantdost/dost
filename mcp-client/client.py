from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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


async def main():
    tools = await client.get_tools()
    # print("Tools retrieved:", tools)

    # Initialize conversation history
    conversation_history = []

    # Create LangGraph agent
    agent = create_react_agent(
        # model=ChatGroq(model="qwen/qwen3-32b", api_key=GROQ_API_KEY),
        model=ChatGroq(model="openai/gpt-oss-20b",
                       api_key=GROQ_API_KEY, max_tokens=3000, reasoning_effort="medium"),
        tools=tools,
        prompt=(
            "You are a helpful assistant. You can use multiple tools in sequence to solve complex tasks. "
            "If a tool's output suggests another tool should be used, do so. "
            "Always explain your reasoning and show intermediate steps."
            "Keep reasoning small and focused until asked for more."
            "Try to answer quickly and using less tokens"
        )
    )

    print("Agent ready! Type 'exit' to quit.")
    while True:
        query = input("\nYou: ")
        if query.lower() in ["exit", "quit"]:
            break
        response = await agent.ainvoke({"messages": [{"role": "user", "content": query}]})
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
            print(response)

asyncio.run(main())
