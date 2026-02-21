import requests
import json
import difflib
import os
from typing import Dict, Tuple, Optional, Any


class StockDataFetcher:
    """
    A modularized stock data fetcher that can be used as an MCP tool.
    Supports smart lookup with fuzzy matching and standardized responses.
    """

    def __init__(self):
        """
        Initialize the stock data fetcher.
        """

        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.symbol_data_path = os.path.join(current_dir, "data", "symbol_name.json")
        self.name_to_info = self._load_symbol_data()

    def _load_symbol_data(self) -> Dict[str, Dict[str, str]]:
        """Load symbol-name mapping from JSON file."""
        try:
            with open(self.symbol_data_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Symbol data file not found: {self.symbol_data_path}")
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON in symbol data file: {self.symbol_data_path}")

    def smart_lookup(self, user_input: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """
        Smart lookup function that handles case-insensitive matching,
        partial matches, and fuzzy matching for both symbols and company names.

        Args:
            user_input: Stock symbol or company name to search for

        Returns:
            Tuple of (symbol, exchange, matched_name) or (None, None, None) if not found
        """
        if not user_input or not user_input.strip():
            return None, None, None

        user_input_lower = user_input.lower().strip()

        # 1. Try direct symbol match (case-insensitive)
        for info in self.name_to_info.values():
            if user_input_lower == info["Symbol"].lower():
                return info["Symbol"], info["Exchange"], None

        # 2. Try direct name match (case-insensitive)
        for name, info in self.name_to_info.items():
            if user_input_lower == name.lower():
                return info["Symbol"], info["Exchange"], name

        # 3. Try substring match in names (case-insensitive)
        for name, info in self.name_to_info.items():
            if user_input_lower in name.lower():
                return info["Symbol"], info["Exchange"], name

        # 4. Try substring match in symbols (case-insensitive)
        for info in self.name_to_info.values():
            if user_input_lower in info["Symbol"].lower():
                return info["Symbol"], info["Exchange"], None

        # 5. Use difflib for fuzzy name match
        best_match = difflib.get_close_matches(
            user_input_lower, [n.lower() for n in self.name_to_info.keys()],
            n=1, cutoff=0.6
        )
        if best_match:
            # Find the original name (case preserved)
            matched_name = next(name for name in self.name_to_info if name.lower() == best_match[0])
            return self.name_to_info[matched_name]["Symbol"], self.name_to_info[matched_name]["Exchange"], matched_name

        # 6. Use difflib for fuzzy symbol match
        symbol_list = [info["Symbol"].lower() for info in self.name_to_info.values()]
        best_match = difflib.get_close_matches(user_input_lower, symbol_list, n=1, cutoff=0.6)
        if best_match:
            matched_symbol = best_match[0]
            for info in self.name_to_info.values():
                if info["Symbol"].lower() == matched_symbol:
                    return info["Symbol"], info["Exchange"], None

        return None, None, None

    def _fetch_indian_stock(self, symbol: str) -> Dict[str, Any]:
        """Fetch stock data from NSE (Indian exchange)."""
        api_url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol}"
        referer_url = f"https://www.nseindia.com/get-quotes/equity?symbol={symbol}"

        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                           "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
            "Accept": "application/json, text/plain, */*",
            "Referer": referer_url,
        }

        session = requests.Session()
        # Get cookies by visiting the main page
        session.get(referer_url, headers=headers, timeout=10)
        # Get the actual API data
        response = session.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def _fetch_foreign_stock(self, symbol: str) -> Dict[str, Any]:
        """Fetch stock data from NASDAQ (Foreign exchange)."""
        url = f"https://api.nasdaq.com/api/quote/{symbol}/info?assetclass=stocks"
        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                           "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://www.nasdaq.com/",
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    def standardize_response(self, data: Dict[str, Any], exchange: str, symbol: str) -> Dict[str, Any]:
        """
        Standardizes the response from different exchanges into a common format.

        Args:
            data: Raw API response data
            exchange: Exchange type ("indian" or "foreign")
            symbol: Stock symbol

        Returns:
            Standardized stock data dictionary
        """
        standardized = {
            "symbol": symbol,
            "exchange": exchange,
            "company_name": "",
            "current_price": "",
            "change": "",
            "change_percent": "",
            "currency": "",
            "market_status": "",
            "last_updated": "",
            "day_range": {
                "high": "",
                "low": ""
            },
            "52_week_range": {
                "high": "",
                "low": ""
            },
            "volume": "",
            "market_cap": ""
        }

        try:
            if exchange.lower() == "indian":
                # NSE (Indian) response structure
                info = data.get("info", {})
                price_info = data.get("priceInfo", {})

                standardized["company_name"] = info.get("companyName", "")
                standardized["current_price"] = f"₹{price_info.get('lastPrice', 0)}"
                standardized["change"] = price_info.get("change", 0)
                standardized["change_percent"] = f"{price_info.get('pChange', 0):.2f}%"
                standardized["currency"] = "INR"

                # Market status from trading status
                security_info = data.get("securityInfo", {})
                trading_status = security_info.get("tradingStatus", "")
                standardized["market_status"] = trading_status if trading_status else "Unknown"

                # Day range
                intraday = price_info.get("intraDayHighLow", {})
                if intraday.get("max") and intraday.get("min"):
                    standardized["day_range"]["high"] = f"₹{intraday.get('max', 0)}"
                    standardized["day_range"]["low"] = f"₹{intraday.get('min', 0)}"

                # 52 week range
                week_range = price_info.get("weekHighLow", {})
                if week_range.get("max") and week_range.get("min"):
                    standardized["52_week_range"]["high"] = f"₹{week_range.get('max', 0)}"
                    standardized["52_week_range"]["low"] = f"₹{week_range.get('min', 0)}"

                # Volume from preOpenMarket
                pre_open = data.get("preOpenMarket", {})
                standardized["volume"] = str(pre_open.get("totalTradedVolume", "0"))

            else:
                # NASDAQ (Foreign) response structure
                stock_data = data.get("data", {})
                primary_data = stock_data.get("primaryData", {})
                key_stats = stock_data.get("keyStats", {})

                standardized["company_name"] = stock_data.get("companyName", "")
                standardized["current_price"] = primary_data.get("lastSalePrice", "")
                standardized["change"] = primary_data.get("netChange", "")
                standardized["change_percent"] = primary_data.get("percentageChange", "")
                standardized["currency"] = "USD"
                standardized["market_status"] = stock_data.get("marketStatus", "")
                standardized["last_updated"] = primary_data.get("lastTradeTimestamp", "")

                # Day range
                day_range = key_stats.get("dayrange", {})
                if day_range and day_range.get("value") != "NA":
                    range_parts = day_range.get("value", "").split(" - ")
                    if len(range_parts) == 2:
                        standardized["day_range"]["low"] = range_parts[0]
                        standardized["day_range"]["high"] = range_parts[1]

                # 52 week range
                week_range = key_stats.get("fiftyTwoWeekHighLow", {})
                if week_range and week_range.get("value"):
                    range_parts = week_range.get("value", "").split(" - ")
                    if len(range_parts) == 2:
                        standardized["52_week_range"]["low"] = range_parts[0]
                        standardized["52_week_range"]["high"] = range_parts[1]

                # Volume
                standardized["volume"] = primary_data.get("volume", "")

        except Exception as e:
            # Log the error but don't raise - return partial data
            standardized["error"] = f"Error standardizing response: {str(e)}"

        return standardized

    def get_stock_data(self, user_input: str) -> Dict[str, Any]:
        """
        Fetches real-time or historical stock market data for a company.
        Use this to check stock prices, market cap, or financial metrics by providing a company name or ticker symbol (e.g., 'AAPL', 'Tesla').
        """
        try:
            # Smart lookup to find symbol and exchange
            symbol, exchange, matched_name = self.smart_lookup(user_input)

            if not symbol:
                return {
                    "error": "No matching company or symbol found",
                    "input": user_input,
                    "success": False
                }

            # Fetch raw data from appropriate exchange
            if exchange.lower() == "indian":
                raw_data = self._fetch_indian_stock(symbol)
            else:
                raw_data = self._fetch_foreign_stock(symbol)

            # Standardize the response
            standardized_data = self.standardize_response(raw_data, exchange, symbol)

            # Add match information
            if matched_name and matched_name.lower() != user_input.lower():
                standardized_data["matched_company"] = matched_name
                standardized_data["match_type"] = "company_name"
            elif not matched_name and symbol.lower() != user_input.lower():
                standardized_data["match_type"] = "symbol"
            else:
                standardized_data["match_type"] = "exact"

            standardized_data["success"] = True
            return standardized_data

        except requests.exceptions.RequestException as e:
            return {
                "error": f"Network error: {str(e)}",
                "input": user_input,
                "success": False
            }
        except Exception as e:
            return {
                "error": f"Unexpected error: {str(e)}",
                "input": user_input,
                "success": False
            }


# Convenience functions for direct usage
_stock_fetcher = None


def get_stock_data(stock_name: str) -> Dict[str, Any]:
    """
    Fetches real-time or historical stock market data for a company.
    Use this to check stock prices, market cap, or financial metrics by providing a company name or ticker symbol (e.g., 'AAPL', 'Tesla').
    """
    global _stock_fetcher
    if _stock_fetcher is None:
        _stock_fetcher = StockDataFetcher()
    return _stock_fetcher.get_stock_data(stock_name)


# For backward compatibility and testing
if __name__ == "__main__":
    # Interactive mode for testing
    fetcher = StockDataFetcher()

    print("Stock Data Fetcher - Interactive Mode")
    print("Enter stock symbol or company name (or 'exit' to quit)")

    while True:
        user_input = input("> ").strip()
        if not user_input or user_input.lower() == "exit":
            break

        result = fetcher.get_stock_data(user_input)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("-" * 50)
