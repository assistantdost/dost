"""
Calculator tools for MCP Remote Server.

Provides: basic_math, evaluate_expression, statistics_calc,
          unit_converter, date_calculator, base_converter
"""

import ast
import math
import operator
import statistics as stats_lib
from datetime import datetime, timedelta
from typing import Any, Dict


# ────────────────────────── Safe Expression Evaluator ──────────────────────────
_SAFE_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

_SAFE_FUNCS = {
    "sqrt": math.sqrt,
    "abs": abs,
    "round": round,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "ceil": math.ceil,
    "floor": math.floor,
    "factorial": math.factorial,
    "pow": pow,
    "pi": math.pi,
    "e": math.e,
}


def _safe_eval_node(node):
    """Recursively evaluate an AST node using only whitelisted operations."""
    if isinstance(node, ast.Expression):
        return _safe_eval_node(node.body)

    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant: {node.value!r}")

    if isinstance(node, ast.UnaryOp):
        op_func = _SAFE_OPS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported unary op: {type(node.op).__name__}")
        return op_func(_safe_eval_node(node.operand))

    if isinstance(node, ast.BinOp):
        op_func = _SAFE_OPS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"Unsupported binary op: {type(node.op).__name__}")
        left = _safe_eval_node(node.left)
        right = _safe_eval_node(node.right)
        return op_func(left, right)

    if isinstance(node, ast.Call):
        if isinstance(node.func, ast.Name) and node.func.id in _SAFE_FUNCS:
            func = _SAFE_FUNCS[node.func.id]
            args = [_safe_eval_node(a) for a in node.args]
            return func(*args)
        raise ValueError(f"Unsupported function: {ast.dump(node.func)}")

    if isinstance(node, ast.Name):
        if node.id in _SAFE_FUNCS:
            val = _SAFE_FUNCS[node.id]
            if isinstance(val, (int, float)):
                return val
        raise ValueError(f"Unknown variable: {node.id}")

    raise ValueError(f"Unsupported expression node: {type(node).__name__}")


# ────────────────────────── Unit Conversion Tables ─────────────────────────────

# Each dict maps unit -> factor to convert to the base unit.
# Temperature is handled separately.

_LENGTH = {  # base: meter
    "mm": 0.001, "cm": 0.01, "m": 1, "km": 1000,
    "in": 0.0254, "inch": 0.0254, "inches": 0.0254,
    "ft": 0.3048, "foot": 0.3048, "feet": 0.3048,
    "yd": 0.9144, "yard": 0.9144, "yards": 0.9144,
    "mi": 1609.344, "mile": 1609.344, "miles": 1609.344,
    "nm": 1852, "nautical_mile": 1852,
}

_WEIGHT = {  # base: gram
    "mg": 0.001, "g": 1, "kg": 1000,
    "oz": 28.3495, "ounce": 28.3495, "ounces": 28.3495,
    "lb": 453.592, "lbs": 453.592, "pound": 453.592, "pounds": 453.592,
    "ton": 907185, "tonne": 1_000_000,
}

_AREA = {  # base: sq meter
    "sqmm": 1e-6, "sqcm": 1e-4, "sqm": 1, "sqkm": 1e6,
    "sqin": 6.4516e-4, "sqft": 0.092903, "sqyd": 0.836127,
    "sqmi": 2.59e6, "acre": 4046.86, "hectare": 10000,
}

_VOLUME = {  # base: liter
    "ml": 0.001, "cl": 0.01, "l": 1, "liter": 1, "litre": 1,
    "gal": 3.78541, "gallon": 3.78541, "qt": 0.946353,
    "pt": 0.473176, "cup": 0.236588, "floz": 0.0295735,
    "tbsp": 0.0147868, "tsp": 0.00492892,
    "m3": 1000, "cubicm": 1000,
}

_SPEED = {  # base: m/s
    "m/s": 1, "mps": 1, "km/h": 1 / 3.6, "kmh": 1 / 3.6, "kph": 1 / 3.6,
    "mph": 0.44704, "knot": 0.514444, "knots": 0.514444,
    "ft/s": 0.3048, "fps": 0.3048,
}

_DATA = {  # base: byte
    "bit": 0.125, "b": 1, "byte": 1, "bytes": 1,
    "kb": 1024, "mb": 1024**2, "gb": 1024**3, "tb": 1024**4, "pb": 1024**5,
    "kib": 1024, "mib": 1024**2, "gib": 1024**3, "tib": 1024**4,
}

_TIME = {  # base: second
    "ms": 0.001, "millisecond": 0.001,
    "s": 1, "sec": 1, "second": 1, "seconds": 1,
    "min": 60, "minute": 60, "minutes": 60,
    "h": 3600, "hr": 3600, "hour": 3600, "hours": 3600,
    "day": 86400, "days": 86400,
    "week": 604800, "weeks": 604800,
    "month": 2_592_000, "months": 2_592_000,  # ~30 days
    "year": 31_536_000, "years": 31_536_000,  # 365 days
}

_UNIT_CATEGORIES = {
    "length": _LENGTH,
    "weight": _WEIGHT,
    "area": _AREA,
    "volume": _VOLUME,
    "speed": _SPEED,
    "data": _DATA,
    "time": _TIME,
}


def _find_unit_category(unit: str):
    """Find which category a unit belongs to and return (category_name, table)."""
    u = unit.lower().strip()
    for cat_name, table in _UNIT_CATEGORIES.items():
        if u in table:
            return cat_name, table
    return None, None


def _convert_temperature(value: float, from_u: str, to_u: str) -> float:
    """Handle temperature conversions separately."""
    f, t = from_u.lower(), to_u.lower()
    temp_aliases = {"c": "c", "celsius": "c", "f": "f", "fahrenheit": "f", "k": "k", "kelvin": "k"}
    f = temp_aliases.get(f)
    t = temp_aliases.get(t)
    if not f or not t:
        return None

    # Convert to Celsius first
    if f == "c":
        c = value
    elif f == "f":
        c = (value - 32) * 5 / 9
    else:
        c = value - 273.15

    # Convert from Celsius to target
    if t == "c":
        return round(c, 6)
    elif t == "f":
        return round(c * 9 / 5 + 32, 6)
    else:
        return round(c + 273.15, 6)


# ────────────────────────── Public Tool Functions ──────────────────────────────


def basic_math(numbers: list[float], operation: str) -> Dict[str, Any]:
    """
    Arithmetic on a list of numbers. Operations: sum, product, min, max, power (a^b), factorial, modulo (a%b), percentage (a/b*100).
    """
    if not numbers:
        return {"error": "No numbers provided."}

    op = operation.lower().strip()

    if op == "sum":
        result = sum(numbers)
    elif op == "product":
        result = 1
        for n in numbers:
            result *= n
    elif op == "min":
        result = min(numbers)
    elif op == "max":
        result = max(numbers)
    elif op == "power":
        if len(numbers) < 2:
            return {"error": "Power requires at least 2 numbers (base, exponent)."}
        result = numbers[0] ** numbers[1]
    elif op == "factorial":
        n = int(numbers[0])
        if n < 0:
            return {"error": "Factorial is not defined for negative numbers."}
        result = math.factorial(n)
    elif op == "modulo":
        if len(numbers) < 2:
            return {"error": "Modulo requires at least 2 numbers."}
        if numbers[1] == 0:
            return {"error": "Cannot modulo by zero."}
        result = numbers[0] % numbers[1]
    elif op == "percentage":
        if len(numbers) < 2 or numbers[1] == 0:
            return {"error": "Percentage requires 2 numbers, second cannot be zero."}
        result = (numbers[0] / numbers[1]) * 100
    else:
        return {"error": f"Unsupported operation: {operation}. Supported: sum, product, min, max, power, factorial, modulo, percentage."}

    return {"operation": op, "numbers": numbers, "result": result}


def evaluate_expression(expression: str) -> Dict[str, Any]:
    """
    Evaluate a math expression string.
    Supports +, -, *, /, //, %, **, parentheses, and functions (sqrt, sin, cos, tan, log, log2, log10, ceil, floor, abs, round, factorial, pow).
    Constants: pi, e.
    Examples: '(2+3)*4', 'sqrt(144)', 'sin(pi/2)', 'log(100, 10)'.
    """
    if not expression or not expression.strip():
        return {"error": "No expression provided."}
    try:
        tree = ast.parse(expression.strip(), mode="eval")
        result = _safe_eval_node(tree)
        return {"expression": expression.strip(), "result": result}
    except ZeroDivisionError:
        return {"error": "Division by zero."}
    except Exception as e:
        return {"error": f"Could not evaluate expression: {str(e)}"}


def statistics_calc(numbers: list[float], operation: str) -> Dict[str, Any]:
    """
    Compute statistics on a list of numbers. Operations: mean/average, median, mode, stdev/std, variance, range. Needs 2+ numbers for stdev/variance.
    """
    if not numbers:
        return {"error": "No numbers provided."}

    op = operation.lower().strip()

    try:
        if op in ("mean", "average"):
            result = stats_lib.mean(numbers)
        elif op == "median":
            result = stats_lib.median(numbers)
        elif op == "mode":
            result = stats_lib.mode(numbers)
        elif op in ("stdev", "std", "standard_deviation"):
            if len(numbers) < 2:
                return {"error": "Standard deviation requires at least 2 numbers."}
            result = stats_lib.stdev(numbers)
        elif op == "variance":
            if len(numbers) < 2:
                return {"error": "Variance requires at least 2 numbers."}
            result = stats_lib.variance(numbers)
        elif op == "range":
            result = max(numbers) - min(numbers)
        else:
            return {"error": f"Unsupported operation: {operation}. Supported: mean, median, mode, stdev, variance, range."}
    except stats_lib.StatisticsError as e:
        return {"error": str(e)}

    return {"operation": op, "numbers": numbers, "result": result}


def unit_converter(value: float, from_unit: str, to_unit: str) -> Dict[str, Any]:
    """
    Convert between units. Categories: length, weight, area, volume, speed, data, time, temperature.
    Pass from_unit and to_unit as short codes (e.g. 'km', 'lb', 'F', 'gb', 'mph'). Auto-detects category.
    """
    fu = from_unit.lower().strip()
    tu = to_unit.lower().strip()

    # Check temperature first (special handling)
    temp_names = {"c", "celsius", "f", "fahrenheit", "k", "kelvin"}
    if fu in temp_names or tu in temp_names:
        result = _convert_temperature(value, fu, tu)
        if result is not None:
            return {
                "value": value, "from_unit": from_unit, "to_unit": to_unit,
                "result": result,
                "formatted": f"{value} {from_unit} = {result} {to_unit}",
            }
        return {"error": f"Invalid temperature units: {from_unit} -> {to_unit}"}

    # Standard linear conversion
    from_cat, from_table = _find_unit_category(fu)
    to_cat, to_table = _find_unit_category(tu)

    if from_table is None:
        return {"error": f"Unknown unit: '{from_unit}'"}
    if to_table is None:
        return {"error": f"Unknown unit: '{to_unit}'"}
    if from_cat != to_cat:
        return {"error": f"Cannot convert between different categories: {from_cat} and {to_cat}."}

    base_value = value * from_table[fu]
    result = round(base_value / to_table[tu], 10)

    return {
        "value": value, "from_unit": from_unit, "to_unit": to_unit,
        "category": from_cat,
        "result": result,
        "formatted": f"{value} {from_unit} = {result} {to_unit}",
    }


def date_calculator(
    operation: str,
    date1: str = "",
    date2: str = "",
    days: int = 0,
) -> Dict[str, Any]:
    """
    Date calculations. Dates in YYYY-MM-DD format.
    Operations: days_between (date1, date2), add_days (date1 + days), day_of_week (date1), today.
    """
    op = operation.lower().strip()
    fmt = "%Y-%m-%d"

    try:
        if op == "today":
            today = datetime.now()
            return {
                "date": today.strftime(fmt),
                "day_of_week": today.strftime("%A"),
                "iso": today.isoformat(),
            }

        if op == "days_between":
            if not date1 or not date2:
                return {"error": "days_between requires both date1 and date2."}
            d1 = datetime.strptime(date1, fmt)
            d2 = datetime.strptime(date2, fmt)
            delta = (d2 - d1).days
            return {
                "date1": date1, "date2": date2,
                "days": delta, "abs_days": abs(delta),
                "weeks": round(abs(delta) / 7, 2),
            }

        if op == "add_days":
            if not date1:
                return {"error": "add_days requires date1."}
            d1 = datetime.strptime(date1, fmt)
            result_date = d1 + timedelta(days=days)
            return {
                "original_date": date1,
                "days_added": days,
                "result_date": result_date.strftime(fmt),
                "day_of_week": result_date.strftime("%A"),
            }

        if op == "day_of_week":
            if not date1:
                return {"error": "day_of_week requires date1."}
            d1 = datetime.strptime(date1, fmt)
            return {
                "date": date1,
                "day_of_week": d1.strftime("%A"),
                "day_number": d1.isoweekday(),  # 1=Monday, 7=Sunday
            }

        return {"error": f"Unsupported operation: {operation}. Supported: days_between, add_days, day_of_week, today."}

    except ValueError as e:
        return {"error": f"Invalid date format (use YYYY-MM-DD): {str(e)}"}


def base_converter(number: str, from_base: str, to_base: str) -> Dict[str, Any]:
    """
    Convert a number between bases. Bases: decimal/dec, binary/bin, octal/oct, hex. Number as string (e.g. '255', 'FF', '11111111').
    """
    base_map = {
        "decimal": 10, "dec": 10, "10": 10,
        "binary": 2, "bin": 2, "2": 2,
        "octal": 8, "oct": 8, "8": 8,
        "hexadecimal": 16, "hex": 16, "16": 16,
    }

    fb = base_map.get(from_base.lower().strip())
    tb = base_map.get(to_base.lower().strip())

    if fb is None:
        return {"error": f"Unsupported source base: '{from_base}'. Use: decimal, binary, octal, hex."}
    if tb is None:
        return {"error": f"Unsupported target base: '{to_base}'. Use: decimal, binary, octal, hex."}

    try:
        # Parse to integer first
        clean = number.strip()
        decimal_value = int(clean, fb)

        # Convert to target base
        if tb == 10:
            result = str(decimal_value)
        elif tb == 2:
            result = bin(decimal_value)[2:]  # strip '0b'
        elif tb == 8:
            result = oct(decimal_value)[2:]  # strip '0o'
        else:
            result = hex(decimal_value)[2:]  # strip '0x'

        return {
            "input": number,
            "from_base": from_base,
            "to_base": to_base,
            "decimal_value": decimal_value,
            "result": result,
            "formatted": f"{number} (base {fb}) = {result} (base {tb})",
        }

    except ValueError as e:
        return {"error": f"Invalid number '{number}' for base {fb}: {str(e)}"}
