# Control Spotify Natively with DOST Spotify Integration

Have you ever wanted to play a focus track, skip an album, or switch playback devices without breaking your flow? DOST makes this possible using its remote cloud server connected to the Spotify Web API.

In this guide, we will walk through how DOST manages Spotify actions securely using OAuth2 and standard MCP JSON-RPC protocols.

## The Spotify Action Set

The DOST Spotify tool block supports the following native commands:
- **Play/Pause**: Toggle playback instantly.
- **Skip Track**: Move forward or backward in your queue.
- **Search Content**: Find songs, artists, albums, or public playlists.
- **Device Swapping**: Transfer active playback from your phone to your computer speakers or headphones.

## Security First: The OAuth2 Gateway

Unlike generic wrappers that require hardcoding API tokens or pasting cookies, DOST uses secure **OAuth2** authentication. 

1. When you authorize Spotify on your user profile or dashboard, you are redirected directly to Spotify's official auth screen.
2. The frontend web app exchanges the resulting code for a JSON Web Token (JWT) and a refresh token.
3. Tokens are kept securely on your backend and never sent to third-party tracking services.

Once connected, you can invoke your music agent naturally:
- *"Play some lo-fi music on Spotify"*
- *"Skip this track and set playback device to my Macbook"*

It's that simple. Get started in your [Dashboard](/dashboard) to authorize Spotify!
