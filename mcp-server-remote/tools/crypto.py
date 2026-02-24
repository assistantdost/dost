import requests
import json
import difflib
from typing import Dict, Tuple, Optional, Any


# Top cryptocurrencies: id -> {symbol, name}
COIN_DATABASE = {
    "bitcoin": {"symbol": "BTC", "name": "Bitcoin"},
    "ethereum": {"symbol": "ETH", "name": "Ethereum"},
    "tether": {"symbol": "USDT", "name": "Tether"},
    "binancecoin": {"symbol": "BNB", "name": "BNB"},
    "solana": {"symbol": "SOL", "name": "Solana"},
    "ripple": {"symbol": "XRP", "name": "XRP"},
    "usd-coin": {"symbol": "USDC", "name": "USD Coin"},
    "staked-ether": {"symbol": "STETH", "name": "Lido Staked Ether"},
    "cardano": {"symbol": "ADA", "name": "Cardano"},
    "dogecoin": {"symbol": "DOGE", "name": "Dogecoin"},
    "avalanche-2": {"symbol": "AVAX", "name": "Avalanche"},
    "tron": {"symbol": "TRX", "name": "TRON"},
    "wrapped-bitcoin": {"symbol": "WBTC", "name": "Wrapped Bitcoin"},
    "polkadot": {"symbol": "DOT", "name": "Polkadot"},
    "chainlink": {"symbol": "LINK", "name": "Chainlink"},
    "toncoin": {"symbol": "TON", "name": "Toncoin"},
    "shiba-inu": {"symbol": "SHIB", "name": "Shiba Inu"},
    "matic-network": {"symbol": "MATIC", "name": "Polygon"},
    "dai": {"symbol": "DAI", "name": "Dai"},
    "litecoin": {"symbol": "LTC", "name": "Litecoin"},
    "bitcoin-cash": {"symbol": "BCH", "name": "Bitcoin Cash"},
    "uniswap": {"symbol": "UNI", "name": "Uniswap"},
    "cosmos": {"symbol": "ATOM", "name": "Cosmos"},
    "stellar": {"symbol": "XLM", "name": "Stellar"},
    "monero": {"symbol": "XMR", "name": "Monero"},
    "ethereum-classic": {"symbol": "ETC", "name": "Ethereum Classic"},
    "okb": {"symbol": "OKB", "name": "OKB"},
    "filecoin": {"symbol": "FIL", "name": "Filecoin"},
    "internet-computer": {"symbol": "ICP", "name": "Internet Computer"},
    "hedera-hashgraph": {"symbol": "HBAR", "name": "Hedera"},
    "aptos": {"symbol": "APT", "name": "Aptos"},
    "arbitrum": {"symbol": "ARB", "name": "Arbitrum"},
    "near": {"symbol": "NEAR", "name": "NEAR Protocol"},
    "optimism": {"symbol": "OP", "name": "Optimism"},
    "vechain": {"symbol": "VET", "name": "VeChain"},
    "the-graph": {"symbol": "GRT", "name": "The Graph"},
    "render-token": {"symbol": "RNDR", "name": "Render"},
    "injective-protocol": {"symbol": "INJ", "name": "Injective"},
    "sui": {"symbol": "SUI", "name": "Sui"},
    "aave": {"symbol": "AAVE", "name": "Aave"},
    "pepe": {"symbol": "PEPE", "name": "Pepe"},
    "fetch-ai": {"symbol": "FET", "name": "Fetch.ai"},
    "kaspa": {"symbol": "KAS", "name": "Kaspa"},
    "algorand": {"symbol": "ALGO", "name": "Algorand"},
    "fantom": {"symbol": "FTM", "name": "Fantom"},
    "the-sandbox": {"symbol": "SAND", "name": "The Sandbox"},
    "decentraland": {"symbol": "MANA", "name": "Decentraland"},
    "theta-token": {"symbol": "THETA", "name": "Theta Network"},
    "maker": {"symbol": "MKR", "name": "Maker"},
}


class CryptoDataFetcher:
    """
    Cryptocurrency price fetcher using CoinGecko API (free, no key required).
    Supports fuzzy matching by name or symbol.
    """

    BASE_URL = "https://api.coingecko.com/api/v3"
    HEADERS = {
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
        "Accept": "application/json",
    }

    def __init__(self):
        self.coin_db = COIN_DATABASE
        # Build reverse lookups
        self._symbol_to_id = {v["symbol"].lower(): k for k, v in self.coin_db.items()}
        self._name_to_id = {v["name"].lower(): k for k, v in self.coin_db.items()}

    def smart_lookup(self, user_input: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Smart lookup for cryptocurrency by name, symbol, or CoinGecko ID.

        Returns:
            Tuple of (coingecko_id, display_name) or (None, None) if not found
        """
        if not user_input or not user_input.strip():
            return None, None

        query = user_input.lower().strip()

        # 1. Exact CoinGecko ID match
        if query in self.coin_db:
            return query, self.coin_db[query]["name"]

        # 2. Exact symbol match
        if query in self._symbol_to_id:
            cid = self._symbol_to_id[query]
            return cid, self.coin_db[cid]["name"]

        # 3. Exact name match
        if query in self._name_to_id:
            cid = self._name_to_id[query]
            return cid, self.coin_db[cid]["name"]

        # 4. Substring match in names
        for name_lower, cid in self._name_to_id.items():
            if query in name_lower:
                return cid, self.coin_db[cid]["name"]

        # 5. Substring match in symbols
        for sym_lower, cid in self._symbol_to_id.items():
            if query in sym_lower:
                return cid, self.coin_db[cid]["name"]

        # 6. Fuzzy match on names
        name_list = list(self._name_to_id.keys())
        best = difflib.get_close_matches(query, name_list, n=1, cutoff=0.6)
        if best:
            cid = self._name_to_id[best[0]]
            return cid, self.coin_db[cid]["name"]

        # 7. Fuzzy match on symbols
        sym_list = list(self._symbol_to_id.keys())
        best = difflib.get_close_matches(query, sym_list, n=1, cutoff=0.6)
        if best:
            cid = self._symbol_to_id[best[0]]
            return cid, self.coin_db[cid]["name"]

        return None, None

    def _fetch_coin_data(self, coin_id: str) -> Dict[str, Any]:
        """Fetch detailed coin data from CoinGecko."""
        url = f"{self.BASE_URL}/coins/{coin_id}"
        params = {
            "localization": "false",
            "tickers": "false",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false",
        }
        response = requests.get(url, headers=self.HEADERS, params=params, timeout=15)
        response.raise_for_status()
        return response.json()

    def standardize_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Standardize CoinGecko response into a clean format."""
        market = data.get("market_data", {})
        current_usd = market.get("current_price", {}).get("usd", 0)
        current_inr = market.get("current_price", {}).get("inr", 0)

        standardized = {
            "name": data.get("name", ""),
            "symbol": data.get("symbol", "").upper(),
            "current_price_usd": f"${current_usd:,.2f}" if current_usd else "",
            "current_price_inr": f"₹{current_inr:,.2f}" if current_inr else "",
            "market_cap_rank": data.get("market_cap_rank", ""),
            "change_24h": f"{market.get('price_change_percentage_24h', 0):.2f}%",
            "change_7d": f"{market.get('price_change_percentage_7d', 0):.2f}%",
            "change_30d": f"{market.get('price_change_percentage_30d', 0):.2f}%",
            "market_cap_usd": f"${market.get('market_cap', {}).get('usd', 0):,.0f}",
            "total_volume_usd": f"${market.get('total_volume', {}).get('usd', 0):,.0f}",
            "day_range": {
                "high": f"${market.get('high_24h', {}).get('usd', 0):,.2f}",
                "low": f"${market.get('low_24h', {}).get('usd', 0):,.2f}",
            },
            "ath": {
                "price": f"${market.get('ath', {}).get('usd', 0):,.2f}",
                "change_percent": f"{market.get('ath_change_percentage', {}).get('usd', 0):.2f}%",
                "date": market.get("ath_date", {}).get("usd", ""),
            },
            "circulating_supply": f"{market.get('circulating_supply', 0):,.0f}",
            "max_supply": f"{market.get('max_supply', 0):,.0f}" if market.get("max_supply") else "Unlimited",
            "last_updated": data.get("last_updated", ""),
        }
        return standardized

    def get_crypto_price(self, user_input: str) -> Dict[str, Any]:
        """
        Fetches real-time cryptocurrency price and market data.
        Use this to check crypto prices, market cap, 24h change, or other metrics
        by providing a coin name or ticker symbol (e.g., 'BTC', 'Ethereum', 'SOL').
        """
        try:
            coin_id, display_name = self.smart_lookup(user_input)

            if not coin_id:
                return {
                    "error": "No matching cryptocurrency found",
                    "input": user_input,
                    "success": False,
                }

            raw_data = self._fetch_coin_data(coin_id)
            result = self.standardize_response(raw_data)

            # Add match info
            if display_name and display_name.lower() != user_input.lower():
                result["matched_coin"] = display_name
                result["match_type"] = "fuzzy"
            else:
                result["match_type"] = "exact"

            result["coingecko_id"] = coin_id
            result["success"] = True
            return result

        except requests.exceptions.RequestException as e:
            return {
                "error": f"Network error: {str(e)}",
                "input": user_input,
                "success": False,
            }
        except Exception as e:
            return {
                "error": f"Unexpected error: {str(e)}",
                "input": user_input,
                "success": False,
            }

    def get_crypto_history(
        self, user_input: str, days: int = 7, currency: str = "usd"
    ) -> Dict[str, Any]:
        """
        Fetches historical price data for a cryptocurrency, suitable for charts.
        Returns timestamped arrays of prices, market caps, and volumes.
        Use days=1 for hourly data, days=7/14/30 for daily data,
        days=365 for full year, or days=max for all-time history.
        """
        try:
            coin_id, display_name = self.smart_lookup(user_input)

            if not coin_id:
                return {
                    "error": "No matching cryptocurrency found",
                    "input": user_input,
                    "success": False,
                }

            # Validate days
            valid_days = [1, 7, 14, 30, 90, 180, 365]
            if days not in valid_days and days != 0:
                # Snap to nearest valid value
                days = min(valid_days, key=lambda x: abs(x - days))

            url = f"{self.BASE_URL}/coins/{coin_id}/market_chart"
            params = {
                "vs_currency": currency.lower(),
                "days": days,
            }
            response = requests.get(
                url, headers=self.HEADERS, params=params, timeout=15
            )
            response.raise_for_status()
            data = response.json()

            # Format the data points: [[timestamp_ms, value], ...]
            prices = data.get("prices", [])
            volumes = data.get("total_volumes", [])

            # Convert to more readable format
            from datetime import datetime, timezone

            def _fmt(points):
                return [
                    {
                        "date": datetime.fromtimestamp(
                            p[0] / 1000, tz=timezone.utc
                        ).strftime("%Y-%m-%d %H:%M"),
                        "value": round(p[1], 2),
                    }
                    for p in points
                ]

            formatted_prices = _fmt(prices)

            # Summary stats
            price_values = [p[1] for p in prices]
            high = max(price_values) if price_values else 0
            low = min(price_values) if price_values else 0
            start = price_values[0] if price_values else 0
            end = price_values[-1] if price_values else 0
            change_pct = (
                ((end - start) / start * 100) if start else 0
            )

            cur = currency.upper()
            return {
                "name": display_name or coin_id,
                "symbol": self.coin_db.get(coin_id, {}).get(
                    "symbol", ""
                ).upper(),
                "coingecko_id": coin_id,
                "currency": cur,
                "days": days,
                "data_points": len(formatted_prices),
                "summary": {
                    "high": f"{high:,.2f} {cur}",
                    "low": f"{low:,.2f} {cur}",
                    "start": f"{start:,.2f} {cur}",
                    "end": f"{end:,.2f} {cur}",
                    "change_percent": f"{change_pct:+.2f}%",
                },
                "prices": formatted_prices,
                "volumes": _fmt(volumes),
                "success": True,
            }

        except requests.exceptions.RequestException as e:
            return {
                "error": f"Network error: {str(e)}",
                "input": user_input,
                "success": False,
            }
        except Exception as e:
            return {
                "error": f"Unexpected error: {str(e)}",
                "input": user_input,
                "success": False,
            }


# Module-level convenience functions for MCP registration
_crypto_fetcher = None


def _get_fetcher() -> CryptoDataFetcher:
    global _crypto_fetcher
    if _crypto_fetcher is None:
        _crypto_fetcher = CryptoDataFetcher()
    return _crypto_fetcher


def get_crypto_price(coin_name: str) -> Dict[str, Any]:
    """
    Fetches real-time cryptocurrency price and market data.
    Use this to check crypto prices, market cap, 24h change, or other metrics
    by providing a coin name or ticker symbol (e.g., 'BTC', 'Ethereum', 'SOL').
    """
    return _get_fetcher().get_crypto_price(coin_name)


def get_crypto_history(
    coin_name: str, days: int = 7, currency: str = "usd"
) -> Dict[str, Any]:
    """
    Fetches historical price data for a cryptocurrency, suitable for charts.
    Returns timestamped price and volume arrays plus a summary with
    high, low, start, end, and percent change.
    Use days=1 for hourly, 7/14/30 for daily, 365 for yearly history.
    Example: get_crypto_history('bitcoin', days=30)
    """
    return _get_fetcher().get_crypto_history(coin_name, days, currency)


# Interactive testing
if __name__ == "__main__":
    fetcher = CryptoDataFetcher()

    print("Crypto Price Fetcher - Interactive Mode")
    print("Enter coin name or symbol (or 'exit' to quit)")

    while True:
        user_input = input("> ").strip()
        if not user_input or user_input.lower() == "exit":
            break

        result = fetcher.get_crypto_price(user_input)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("-" * 50)
