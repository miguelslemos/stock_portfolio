from typing import List

from benefit_history import BenefitHistory
from year_portfolio import YearPortfolio
from transaction import BuyTransaction
from utils import parse_date, print_current_position, print_portfolio_history
from data_provider import PDFDataProvider, StaticDataProvider, MultDataProvider

def main():
    try:
        benecify_history = BenefitHistory(data_provider=MultDataProvider(providers=[PDFDataProvider(), StaticDataProvider(transactions=[
            BuyTransaction(date=parse_date("12/07/2023"), quantity=15464, price=0.43),
            BuyTransaction(date=parse_date("06/01/2023"), quantity=15477, price=0.43),
            BuyTransaction(date=parse_date("04/19/2022"), quantity=20000, price=0.4283),
        ])]))
        # portfolio = Portfolio(StaticDataProvider(transactions=[]), initial_quantity=100, initial_total_cost_usd=1000, total_cost_brl=5000, average_price_usd=10, average_price_brl=50)
    except ValueError as e:
        print(f"Error processing transactions: {e}")
        return

    # if portfolio.history:
    #     print_portfolio_history(portfolio.history)
    #     print_current_position(portfolio.get_current_position())
    # else:
    #     print("No transactions were processed.")

if __name__ == "__main__":
    main() 