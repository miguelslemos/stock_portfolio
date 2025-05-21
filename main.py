from typing import List

from benefit_history import BenefitHistory
from year_portfolio import YearPortfolio
from operation import VestingOperation, SellOperation
from utils import parse_date, print_current_position, print_portfolio_history
from data_provider import PDFDataProvider, StaticDataProvider, MultDataProvider

def main():
    try:
        #Reading data from PDFDataProvider and manual entries
        benecify_history = BenefitHistory(data_provider=MultDataProvider(providers=[
            PDFDataProvider(),
            StaticDataProvider(operations=[
                VestingOperation(
                    date=parse_date("01/06/2023"),
                    quantity=100,
                    price=15
                ),
                SellOperation(
                    date=parse_date("02/26/2023"),
                    quantity=50,
                    price=12
                ),
                SellOperation(
                    date=parse_date("02/27/2023"),
                    quantity=30,
                    price=10
                ),     
                VestingOperation(
                    date=parse_date("07/01/2023"),
                    quantity=100,
                    price=20
                ),
                VestingOperation(
                    date=parse_date("03/27/2023"),
                    quantity=50,
                    price=15
                )
        ])]))
    # Reading operations only from PDF confirmations
    # benecify_history = BenefitHistory(data_provider=PDFDataProvider())
    except ValueError as e:
        print(f"Error processing operations: {e}")
        return

if __name__ == "__main__":
    main()