# Introducing DOST: One Assistant, Real Actions

Welcome to DOST, the open-source personal agentic AI assistant framework built on top of the standardized **Model Context Protocol (MCP)**. 

Unlike traditional chat interfaces that are designed solely for reading and answering questions, DOST is built for **execution**. It bridges the gap between language models and your local desktop or cloud-connected environments, turning natural language requests into direct, secure outcomes.

## The Core Philosophy: Flat & Snappy

DOST operates on the principle of **Flat Intelligence**. We believe that agent interfaces should be fast, lightweight, and focused. Rather than heavy graphics or complex animation sequences, DOST focuses on visual clarity, instant state feedback (sub-100ms response times), and direct command execution.

## How It Works

DOST splits its capabilities into two specialized servers:
1. **Desktop Server (Local Actions)**: Communicates directly with your operating system to launch programs, manage active windows, copy and write clipboard data, modify system volume or brightness, and run command-line scripts in a secure sandbox.
2. **Remote Server (Cloud Integrations)**: Syncs via OAuth2 with online APIs (such as Google Workspace and Spotify) and pulls live data feeds (stocks, weather, crypto rates, metal pricing, and currency conversions) in real-time.

By using the standardized JSON-RPC-based Model Context Protocol, any compatible AI model or client can hook into DOST. You can run DOST through our visual desktop app, the terminal CLI client, or standard third-party tools like Cursor and Claude Desktop.

Start automating your daily workflow today. Read our documentation in the [Docs](/docs) page to learn how to add custom MCP servers!
