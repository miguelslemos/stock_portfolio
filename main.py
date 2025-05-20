from datetime import datetime
from typing import List

from portfolio import Portfolio
from transaction import BuyTransaction, SellTransaction, Transaction
from utils import parse_date, print_current_position, print_gross_losse, print_portfolio_history


def create_sample_transactions() -> List[Transaction]:
    """Create a list of sample transactions for demonstration."""
    transactions = [
        BuyTransaction(
            date=parse_date("1/2/2024"),
            quantity=2500,
            price=9
        ),
        BuyTransaction(
            date=parse_date("1/3/2024"),
            quantity=100,
            price=8.13
        ),
        BuyTransaction(
            date=parse_date("4/1/2024"),
            quantity=120,
            price=11.82
        ),
        BuyTransaction(
            date=parse_date("7/1/2024"),
            quantity=130,
            price=12.36
        ),
        BuyTransaction(
            date=parse_date("10/1/2024"),
            quantity=150,
            price=13.43
        ),
        SellTransaction(
            date=parse_date("2/26/2024"),
            quantity=200,
            price=10.50
        ),
        SellTransaction(
            date=parse_date("6/4/2024"),
            quantity=100,
            price=11.25
        ),
        SellTransaction(
            date=parse_date("9/27/2024"),
            quantity=300,
            price=13.80
        ),
        SellTransaction(
            date=parse_date("12/6/2024"),
            quantity=400,
            price=12.0
        )
        # BuyTransaction(
        #     date=parse_date("1/1/2024"),
        #     quantity=100,
        #     price=10
        # ),
        # BuyTransaction(
        #     date=parse_date("7/1/2024"),
        #     quantity=100,
        #     price=20
        # ),
        # SellTransaction(
        #     date=parse_date("2/26/2024"),
        #     quantity=50,
        #     price=15
        # )
    ]
    return transactions

def main():
    # Create and sort transactions by date

    # Initialize portfolio with transactions (Portfolio processes them in __init__)
    try:
        portfolio = Portfolio(create_sample_transactions())
    except ValueError as e:
        print(f"Error processing transactions: {e}")
        return

    # Print results
    if portfolio.history:
        print_portfolio_history(portfolio.history)
        print_current_position(portfolio.get_current_position())
        print_gross_losse(portfolio.get_buy_operations_before_sell())
    else:
        print("No transactions were processed.")

if __name__ == "__main__":
    main() 