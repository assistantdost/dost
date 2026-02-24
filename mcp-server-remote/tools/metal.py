import requests
import json
import difflib
from typing import Dict, Tuple, Optional, Any


# Supported precious metals with their common names and symbols
METAL_DATABASE = {
    "gold": {"symbol": "XAU", "name": "Gold", "unit": "troy ounce"},
    "silver": {"symbol": "XAG", "name": "Silver", "unit": "troy ounce"},
    "platinum": {"symbol": "XPT", "name": "Platinum", "unit": "troy ounce"},
    "palladium": {"symbol": "XPD", "name": "Palladium", "unit": "troy ounce"},
}

# CoinGecko uses these as vs_currencies
COINGECKO_METAL_CURRENCIES = {"gold": "xau", "silver": "xag"}


class MetalPriceFetcher:
    """
    Precious metal price fetcher.
    Derives gold and silver prices from CoinGecko's BTC/XAU and BTC/XAG ratios.
    For platinum and palladium, uses metals.dev free API as fallback.
    """

    COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
    METALS_DEV_URL = "https://api.metals.dev/v1/latest"
    HEADERS = {
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
        "Accept": "application/json",
    }

    def __init__(self):
        self.metal_db = METAL_DATABASE
        # Build reverse lookups
        self._symbol_to_key = {v["symbol"].lower(): k for k, v in self.metal_db.items()}

    def smart_lookup(self, user_input: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Smart lookup for metal by name or symbol.

        Returns:
            Tuple of (metal_key, display_name) or (None, None) if not found
        """
        if not user_input or not user_input.strip():
            return None, None

        query = user_input.lower().strip()

        # 1. Exact key match (e.g., "gold")
        if query in self.metal_db:
            return query, self.metal_db[query]["name"]

        # 2. Exact symbol match (e.g., "xau")
        if query in self._symbol_to_key:
            key = self._symbol_to_key[query]
            return key, self.metal_db[key]["name"]

        # 3. Substring match in names
        for key, info in self.metal_db.items():
            if query in key or query in info["name"].lower():
                return key, info["name"]

        # 4. Fuzzy match on names
        name_list = list(self.metal_db.keys())
        best = difflib.get_close_matches(query, name_list, n=1, cutoff=0.5)
        if best:
            key = best[0]
            return key, self.metal_db[key]["name"]

        # 5. Fuzzy match on symbols
        sym_list = list(self._symbol_to_key.keys())
        best = difflib.get_close_matches(query, sym_list, n=1, cutoff=0.5)
        if best:
            key = self._symbol_to_key[best[0]]
            return key, self.metal_db[key]["name"]

        return None, None

    def _fetch_via_coingecko(self) -> Dict[str, float]:
        """
        Derive metal prices from CoinGecko.
        BTC price in USD / BTC price in XAU = price of 1 XAU in USD.
        """
        params = {
            "ids": "bitcoin",
            "vs_currencies": "usd,xau,xag",
        }
        response = requests.get(
            self.COINGECKO_URL, headers=self.HEADERS, params=params, timeout=15
        )
        response.raise_for_status()
        data = response.json()

        btc = data.get("bitcoin", {})
        btc_usd = btc.get("usd", 0)
        btc_xau = btc.get("xau", 0)
        btc_xag = btc.get("xag", 0)

        prices = {}
        if btc_usd and btc_xau:
            prices["gold"] = round(btc_usd / btc_xau, 2)
        if btc_usd and btc_xag:
            prices["silver"] = round(btc_usd / btc_xag, 2)

        return prices

    def _fetch_via_metals_dev(self) -> Dict[str, Any]:
        """
        Fetch all metal prices from metals.dev free API (no key needed for basic endpoint).
        Returns raw response with gold, silver, platinum, palladium prices.
        """
        try:
            # metals.dev has a free endpoint that doesn't require a key
            url = "https://api.metals.dev/v1/latest?api_key=demo&currency=USD&unit=toz"
            response = requests.get(url, headers=self.HEADERS, timeout=15)
            response.raise_for_status()
            return response.json()
        except Exception:
            return {}

    def _get_all_prices(self) -> Dict[str, Dict[str, Any]]:
        """Get prices from all available sources, preferring CoinGecko."""
        prices = {}

        # Primary: CoinGecko for gold and silver
        try:
            cg_prices = self._fetch_via_coingecko()
            for metal, usd_price in cg_prices.items():
                prices[metal] = {
                    "price_usd": usd_price,
                    "source": "CoinGecko (derived from BTC ratios)",
                }
        except Exception:
            pass

        # Secondary: metals.dev for all metals (fills gaps for platinum, palladium)
        try:
            metals_data = self._fetch_via_metals_dev()
            metal_prices = metals_data.get("metals", {})

            metal_key_map = {
                "gold": "gold",
                "silver": "silver",
                "platinum": "platinum",
                "palladium": "palladium",
            }

            for api_key, our_key in metal_key_map.items():
                if our_key not in prices and api_key in metal_prices:
                    prices[our_key] = {
                        "price_usd": round(metal_prices[api_key], 2),
                        "source": "metals.dev",
                    }
        except Exception:
            pass

        return prices

    def standardize_response(self, metal_key: str, price_info: Dict[str, Any]) -> Dict[str, Any]:
        """Standardize metal price into a clean response format."""
        info = self.metal_db[metal_key]
        usd_price = price_info.get("price_usd", 0)

        # Approximate INR conversion (using a rough rate; CoinGecko gives BTC/INR too)
        try:
            params = {"ids": "bitcoin", "vs_currencies": "usd,inr"}
            resp = requests.get(
                self.COINGECKO_URL, headers=self.HEADERS, params=params, timeout=10
            )
            resp.raise_for_status()
            btc_data = resp.json().get("bitcoin", {})
            usd_rate = btc_data.get("usd", 1)
            inr_rate = btc_data.get("inr", 0)
            inr_price = round(usd_price * (inr_rate / usd_rate), 2) if usd_rate else 0
        except Exception:
            inr_price = 0

        return {
            "name": info["name"],
            "symbol": info["symbol"],
            "unit": info["unit"],
            "price_usd": f"${usd_price:,.2f}",
            "price_inr": f"₹{inr_price:,.2f}" if inr_price else "N/A",
            "currency": "USD",
            "source": price_info.get("source", "unknown"),
        }

    def get_metal_price(self, user_input: str) -> Dict[str, Any]:
        """
        Fetches real-time precious metal prices.
        Use this to check prices of gold, silver, platinum, or palladium by providing the metal name or symbol (e.g., 'Gold', 'XAU', 'Silver').
        """
        try:
            metal_key, display_name = self.smart_lookup(user_input)

            if not metal_key:
                return {
                    "error": "No matching metal found. Supported: Gold (XAU), Silver (XAG), Platinum (XPT), Palladium (XPD)",
                    "input": user_input,
                    "success": False,
                }

            all_prices = self._get_all_prices()

            if metal_key not in all_prices:
                return {
                    "error": f"Could not fetch price for {display_name}. API may be temporarily unavailable.",
                    "input": user_input,
                    "success": False,
                }

            result = self.standardize_response(metal_key, all_prices[metal_key])

            # Add match info
            if display_name and display_name.lower() != user_input.lower():
                result["matched_metal"] = display_name
                result["match_type"] = "fuzzy"
            else:
                result["match_type"] = "exact"

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


# Module-level convenience function for MCP registration
_metal_fetcher = None


def get_metal_price(metal_name: str) -> Dict[str, Any]:
    """
    Fetches real-time precious metal prices.
    Use this to check prices of gold, silver, platinum, or palladium by providing the metal name or symbol (e.g., 'Gold', 'XAU', 'Silver').
    """
    global _metal_fetcher
    if _metal_fetcher is None:
        _metal_fetcher = MetalPriceFetcher()
    return _metal_fetcher.get_metal_price(metal_name)


# Interactive testing
if __name__ == "__main__":
    fetcher = MetalPriceFetcher()

    print("Metal Price Fetcher - Interactive Mode")
    print("Enter metal name or symbol (or 'exit' to quit)")

    while True:
        user_input = input("> ").strip()
        if not user_input or user_input.lower() == "exit":
            break

        result = fetcher.get_metal_price(user_input)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("-" * 50)
