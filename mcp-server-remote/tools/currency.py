import requests
import json
import difflib
from typing import Dict, Optional, Any


# Common currency codes and their full names
CURRENCY_DATABASE = {
    "USD": "US Dollar",
    "EUR": "Euro",
    "GBP": "British Pound",
    "JPY": "Japanese Yen",
    "INR": "Indian Rupee",
    "AUD": "Australian Dollar",
    "CAD": "Canadian Dollar",
    "CHF": "Swiss Franc",
    "CNY": "Chinese Yuan",
    "SEK": "Swedish Krona",
    "NZD": "New Zealand Dollar",
    "MXN": "Mexican Peso",
    "SGD": "Singapore Dollar",
    "HKD": "Hong Kong Dollar",
    "NOK": "Norwegian Krone",
    "KRW": "South Korean Won",
    "TRY": "Turkish Lira",
    "RUB": "Russian Ruble",
    "BRL": "Brazilian Real",
    "ZAR": "South African Rand",
    "DKK": "Danish Krone",
    "PLN": "Polish Zloty",
    "THB": "Thai Baht",
    "IDR": "Indonesian Rupiah",
    "HUF": "Hungarian Forint",
    "CZK": "Czech Koruna",
    "ILS": "Israeli Shekel",
    "CLP": "Chilean Peso",
    "PHP": "Philippine Peso",
    "AED": "UAE Dirham",
    "SAR": "Saudi Riyal",
    "MYR": "Malaysian Ringgit",
    "BGN": "Bulgarian Lev",
    "RON": "Romanian Leu",
    "ISK": "Icelandic Krona",
    "HRK": "Croatian Kuna",
    "PKR": "Pakistani Rupee",
    "EGP": "Egyptian Pound",
    "BDT": "Bangladeshi Taka",
    "LKR": "Sri Lankan Rupee",
    "NGN": "Nigerian Naira",
    "KES": "Kenyan Shilling",
}

# Aliases: common names -> currency code
CURRENCY_ALIASES = {
    "dollar": "USD", "dollars": "USD", "usd": "USD", "us dollar": "USD",
    "euro": "EUR", "euros": "EUR", "eur": "EUR",
    "pound": "GBP", "pounds": "GBP", "gbp": "GBP", "sterling": "GBP",
    "yen": "JPY", "jpy": "JPY",
    "rupee": "INR", "rupees": "INR", "inr": "INR", "indian rupee": "INR",
    "yuan": "CNY", "renminbi": "CNY", "rmb": "CNY", "cny": "CNY",
    "won": "KRW", "krw": "KRW",
    "dirham": "AED", "aed": "AED",
    "riyal": "SAR", "sar": "SAR",
    "real": "BRL", "brl": "BRL",
    "lira": "TRY", "try": "TRY",
    "franc": "CHF", "chf": "CHF",
    "ringgit": "MYR", "myr": "MYR",
    "baht": "THB", "thb": "THB",
    "peso": "MXN", "mxn": "MXN",
    "rand": "ZAR", "zar": "ZAR",
    "taka": "BDT", "bdt": "BDT",
}


class CurrencyConverter:
    """
    Currency converter using Frankfurter API (free, no key, ECB rates).
    Supports conversion between 30+ currencies with fuzzy matching.
    """

    BASE_URL = "https://api.frankfurter.dev/v1"
    HEADERS = {
        "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/120.0.0.0 Safari/537.36"),
        "Accept": "application/json",
    }

    def __init__(self):
        self.currencies = CURRENCY_DATABASE
        self.aliases = CURRENCY_ALIASES
        # Add all codes as aliases too
        for code in self.currencies:
            self.aliases[code.lower()] = code

    def resolve_currency(self, user_input: str) -> Optional[str]:
        """Resolve user input to a valid currency code."""
        if not user_input or not user_input.strip():
            return None

        query = user_input.lower().strip()

        # 1. Direct alias/code match
        if query in self.aliases:
            return self.aliases[query]

        # 2. Match against full currency names
        for code, name in self.currencies.items():
            if query == name.lower() or query in name.lower():
                return code

        # 3. Fuzzy match on aliases
        alias_list = list(self.aliases.keys())
        best = difflib.get_close_matches(query, alias_list, n=1, cutoff=0.6)
        if best:
            return self.aliases[best[0]]

        # 4. Fuzzy match on currency names
        name_list = [(name.lower(), code) for code, name in self.currencies.items()]
        names_only = [n for n, _ in name_list]
        best = difflib.get_close_matches(query, names_only, n=1, cutoff=0.6)
        if best:
            for name_lower, code in name_list:
                if name_lower == best[0]:
                    return code

        return None

    def convert_currency(
        self, amount: float, from_currency: str, to_currency: str
    ) -> Dict[str, Any]:
        """
        Converts an amount from one currency to another using live exchange rates.
        Use this to convert between currencies like USD to INR, EUR to GBP, etc.
        Provide the amount, source currency, and target currency
        (e.g., amount=100, from_currency='USD', to_currency='INR').
        """
        try:
            # Resolve currency codes
            from_code = self.resolve_currency(from_currency)
            to_code = self.resolve_currency(to_currency)

            if not from_code:
                return {
                    "error": f"Could not resolve source currency: '{from_currency}'",
                    "success": False,
                }
            if not to_code:
                return {
                    "error": f"Could not resolve target currency: '{to_currency}'",
                    "success": False,
                }

            if from_code == to_code:
                return {
                    "from": from_code,
                    "to": to_code,
                    "amount": amount,
                    "converted": amount,
                    "rate": 1.0,
                    "success": True,
                }

            # Fetch conversion rate
            url = f"{self.BASE_URL}/latest"
            params = {"base": from_code, "symbols": to_code}
            response = requests.get(
                url, headers=self.HEADERS, params=params, timeout=10
            )
            response.raise_for_status()
            data = response.json()

            rate = data.get("rates", {}).get(to_code, 0)
            if not rate:
                return {
                    "error": f"No exchange rate found for {from_code} -> {to_code}",
                    "success": False,
                }

            converted = round(amount * rate, 2)

            return {
                "from": from_code,
                "from_name": self.currencies.get(from_code, from_code),
                "to": to_code,
                "to_name": self.currencies.get(to_code, to_code),
                "amount": amount,
                "converted": converted,
                "rate": rate,
                "formatted": f"{amount:,.2f} {from_code} = {converted:,.2f} {to_code}",
                "date": data.get("date", ""),
                "source": "European Central Bank (via Frankfurter)",
                "success": True,
            }

        except requests.exceptions.RequestException as e:
            return {
                "error": f"Network error: {str(e)}",
                "success": False,
            }
        except Exception as e:
            return {
                "error": f"Unexpected error: {str(e)}",
                "success": False,
            }


# Module-level convenience function for MCP registration
_converter = None


def convert_currency(
    amount: float, from_currency: str, to_currency: str
) -> Dict[str, Any]:
    """
    Converts an amount from one currency to another using live exchange rates.
    Use this to convert between currencies like USD to INR, EUR to GBP, etc.
    Provide the amount, source currency, and target currency
    (e.g., amount=100, from_currency='USD', to_currency='INR').
    """
    global _converter
    if _converter is None:
        _converter = CurrencyConverter()
    return _converter.convert_currency(amount, from_currency, to_currency)


# Interactive testing
if __name__ == "__main__":
    converter = CurrencyConverter()

    print("Currency Converter - Interactive Mode")
    print("Format: <amount> <from> <to>  (e.g., '100 USD INR')")
    print("Or just type 'exit' to quit")

    while True:
        user_input = input("> ").strip()
        if not user_input or user_input.lower() == "exit":
            break

        parts = user_input.split()
        if len(parts) != 3:
            print("Usage: <amount> <from_currency> <to_currency>")
            continue

        try:
            amt = float(parts[0])
        except ValueError:
            print("Amount must be a number")
            continue

        result = converter.convert_currency(amt, parts[1], parts[2])
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print("-" * 50)
