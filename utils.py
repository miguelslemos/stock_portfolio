from datetime import datetime
from typing import List
from models import PortfolioSnapshot

def parse_date(date_str: str) -> datetime:
    """Parse a date string in MM/DD/YYYY format."""
    try:
        return datetime.strptime(date_str, "%m/%d/%Y")
    except ValueError:
        raise ValueError("Invalid date! Please use MM/DD/YYYY format.")

def format_date(date: datetime) -> str:
    """Format a datetime object to DD/MM/YYYY string."""
    return date.strftime("%d/%m/%Y")

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
            f"Date: {format_date(snapshot.date)} | "
            f"Quantity: {snapshot.quantity} | "
            f"Total Cost USD: {format_currency(snapshot.total_cost, 'USD')} | "
            f"Average Price USD: {format_currency(snapshot.average_price, 'USD')} | "
            f"Total Cost BRL: {format_currency(snapshot.total_cost_brl, 'BRL')} | "
            f"Average Price BRL: {format_currency(snapshot.average_price_brl, 'BRL')}"
        )

def print_current_position(snapshot: PortfolioSnapshot) -> None:
    """Print the current portfolio position."""
    print("\n==== Current Position ====")
    print(f"Date: {format_date(snapshot.date)}")
    print(f"Quantity in portfolio: {snapshot.quantity}")
    print(f"Total Cost USD: {format_currency(snapshot.total_cost, 'USD')}")
    print(f"Average Price USD: {format_currency(snapshot.average_price, 'USD')}")
    print(f"Total Cost BRL: {format_currency(snapshot.total_cost_brl, 'BRL')}")
    print(f"Average Price BRL: {format_currency(snapshot.average_price_brl, 'BRL')}")
    
def print_gross_losse(content: dict) -> None:
    """Print the current portfolio position."""
    sum_gross_losse = 0
    for sell, (buys, sell_rate) in content.items():
        sum_brl = 0
        sum_qtd = 0
        for buy, usd_brl_ptax in buys:
            buy_brl = buy.quantity * buy.price * usd_brl_ptax
            sum_brl += buy_brl
            sum_qtd += buy.quantity
        stock_price = sell.price * sell_rate
        avg_price_until_date = sum_brl/sum_qtd
        gross_losse = sell.quantity * (stock_price - avg_price_until_date)
        sum_gross_losse += gross_losse
        print(f"Data: {format_date(sell.date)} QTD: {sell.quantity} PM: {format_currency(avg_price_until_date)} Sell Rate: {format_currency(stock_price)} Ganho ou perda {format_currency(gross_losse)}")
    print(f"Total Ganho ou perda {format_currency(sum_gross_losse)}")