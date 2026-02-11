# Flet MCP Chat Client

A modern, cross-platform AI chat interface built with Flet that seamlessly connects to MCP (Model Context Protocol) servers. Experience powerful AI conversations with real-time tool integration, rich markdown rendering, and intuitive server management.

## ✨ Features

- 🖥️ **Cross-Platform Support**: Native desktop apps, web browsers, and mobile devices
- 🔧 **Multi-Server MCP Integration**: Connect to multiple MCP servers simultaneously (stdio, HTTP, SSE)
- 💬 **Advanced Chat UI**:
  - Markdown rendering with syntax highlighting
  - Real-time tool call visualization
  - Token usage tracking and cost estimation
  - Message threading and conversation history
- 🎨 **Modern UI/UX**:
  - Dark/light theme support
  - Responsive design
  - Smooth animations and transitions
- ⚙️ **Flexible Configuration**:
  - Dynamic server management
  - Model selection with tiered recommendations
  - Customizable system prompts
  - Persistent settings
- 🔐 **Security First**:
  - Secure API key management
  - Password-masked inputs
  - Environment variable support
- 🚀 **Performance Optimized**:
  - Asynchronous operations
  - Efficient state management
  - Background processing

## 📋 Prerequisites

- Python 3.8 or higher
- Groq API key (for AI models)
- MCP servers (local or remote)

## 🛠️ Installation

1. **Navigate to the project directory**:

   ```bash
   cd flet_client
   ```

2. **Create a virtual environment** (recommended):

   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:

   - **Windows**:
     ```bash
     .\venv\Scripts\activate
     ```
   - **Linux/Mac**:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## 🚀 Usage

### Environment Setup

Create a `.env` file in the `flet_client` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### Running the Application

#### Desktop Mode (Default)

```bash
python app.py
```

#### Web Mode

Edit `app.py` and uncomment the web mode line:

```python
ft.app(target=main, view=ft.WEB_BROWSER)
```

Then run:

```bash
python app.py
```

#### Mobile Mode

For mobile deployment, use Flet's mobile packaging features.

### Building Standalone Executables

1. **Install Flet build tools**:

   ```bash
   pip install flet[all]
   ```

2. **Build for current platform**:

   ```bash
   flet pack app.py --name "MCP Chat Client"
   ```

3. **Build for specific platforms**:

   ```bash
   # Windows
   flet pack app.py --name "MCP Chat Client" --product-name "MCP Chat"

   # macOS
   flet pack app.py --name "MCP Chat Client" --product-name "MCP Chat" --bundle-id "com.example.mcpchat"

   # Linux
   flet pack app.py --name "MCP Chat Client" --product-name "MCP Chat" --linux-package-type "deb"
   ```

## ⚙️ Configuration

### MCP Server Configuration

Edit `server_config.json` to configure your MCP servers:

```json
{
  "desktop_server": {
    "command": "python",
    "args": ["../mcp-server-package/server.py"],
    "transport": "stdio",
    "enabled": true,
    "description": "Local desktop automation server"
  },
  "remote_server": {
    "url": "http://127.0.0.1:8000/remote_mcp/mcp",
    "transport": "streamable_http",
    "enabled": true,
    "description": "Remote MCP server (calendar, gmail, etc.)"
  },
  "custom_server": {
    "command": "node",
    "args": ["path/to/custom/server.js"],
    "transport": "stdio",
    "enabled": false,
    "description": "Custom MCP server"
  }
}
```

### Supported Transports

- **stdio**: Standard input/output (local servers)
- **streamable_http**: HTTP streaming (remote servers)
- **sse**: Server-sent events (real-time updates)

## 🤖 Supported Models

The client supports various AI models organized by performance tiers:

### Tier 1: Heavyweights (Complex/Multi-Step Tasks)

- `openai/gpt-oss-120b`
- `meta-llama/llama-3.3-70b-versatile`
- `qwen/qwen3-32b`

### Tier 2: Next-Gen Efficient (Balanced Performance)

- `meta-llama/llama-4-maverick-17b-128e-instruct`
- `meta-llama/llama-4-scout-17b-16e-instruct`
- `moonshotai/kimi-k2-instruct`
- `moonshotai/kimi-k2-instruct-0905`

### Tier 3: Fast & Lightweight (Quick Responses)

- `meta-llama/llama-3.1-8b-instant`
- `meta-llama/llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`
- `gemma2-9b-it`

## 📁 Project Structure

```
flet_client/
├── app.py                 # Main application entry point
├── requirements.txt       # Python dependencies
├── server_config.json     # MCP server configuration
├── README.md             # This documentation
├── .env                  # Environment variables (create this)
└── __pycache__/          # Python bytecode cache (ignored)
```

## 🔧 Development

### Code Style

- Follow PEP 8 Python style guidelines
- Use type hints where possible
- Maintain async/await patterns for UI responsiveness

### Adding New Features

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Testing

```bash
# Run basic functionality tests
python -c "import app; print('Import successful')"

# Test with different MCP servers
# Ensure all configured servers are accessible
```

## 🐛 Troubleshooting

### Common Issues

**Application won't start**

- Verify Python version (3.8+)
- Check virtual environment activation
- Ensure all dependencies are installed

**MCP server connection fails**

- Verify server configuration in `server_config.json`
- Check server logs for errors
- Ensure correct transport type

**API key issues**

- Confirm `.env` file exists and contains valid keys
- Check API key permissions
- Verify network connectivity

**UI rendering problems**

- Update Flet to latest version
- Clear `__pycache__` directory
- Restart the application

### Debug Mode

Enable debug logging by setting environment variable:

```bash
export FLET_LOG_LEVEL=debug
python app.py
```

## 📊 Performance Tips

- Use appropriate model tiers for your use case
- Limit concurrent server connections
- Regularly update dependencies
- Monitor token usage for cost optimization

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- [Flet](https://flet.dev/) - Cross-platform UI framework
- [LangChain](https://www.langchain.com/) - LLM framework
- [Model Context Protocol](https://modelcontextprotocol.io/) - Interoperability standard
- [Groq](https://groq.com/) - Fast AI inference

---

**Happy chatting with MCP! 🚀**
