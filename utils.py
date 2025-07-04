from typing import List
from date_utils import format_date
from portfolio_snapshot import PortfolioSnapshot

def format_currency(value: float, currency: str = "BRL") -> str:
    """Format a float value as currency string for BRL or USD."""
    if currency.upper() == "BRL":
        return f"R${value:,.4f}"
    elif currency.upper() == "USD":
        return f"${value:,.4f}"
    else:
        raise ValueError("Unsupported currency. Use 'BRL' or 'USD'.")

def print_portfolio_history(history: List[PortfolioSnapshot]) -> None:
    """Print the portfolio history in a formatted way."""
    print("\n==== Portfolio History ====")
    for snapshot in history:
        print(
            f"Date: {format_date(snapshot.operation.date)} | "
            f"Quantity: {snapshot.operation.get_symbol_type()}{snapshot.operation.quantity} | "
            f"Total Cost USD: {format_currency(snapshot.total_cost_usd, 'USD')} | "
            f"Average Price USD: {format_currency(snapshot.average_price_usd, 'USD')} | "
            f"Total Cost BRL: {format_currency(snapshot.total_cost_brl, 'BRL')} | "
            f"Average Price BRL: {format_currency(snapshot.average_price_brl, 'BRL')} | "
            f"Gross Profit BRL: {format_currency(snapshot.gross_profit_brl, 'BRL')}"
        )

def print_current_position(snapshot: PortfolioSnapshot) -> None:
    """Print the current portfolio position."""
    year = snapshot.operation.date.year
    print(f"\n==== (Portfolio Year: {year}) ====")
    print(f"Date: {format_date(snapshot.operation.date)}")
    print(f"Quantity in portfolio: {snapshot.total_quantity}")
    print(f"Total Cost USD: {format_currency(snapshot.total_cost_usd, 'USD')}")
    print(f"Average Price USD: {format_currency(snapshot.average_price_usd, 'USD')}")
    print(f"Total Cost BRL: {format_currency(snapshot.total_cost_brl, 'BRL')}")
    print(f"Average Price BRL: {format_currency(snapshot.average_price_brl, 'BRL')}")
    print(f"Gross Profit BRL: {format_currency(snapshot.gross_profit_brl, 'BRL')}")
