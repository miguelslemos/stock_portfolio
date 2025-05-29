from typing import List

from benefit_history import BenefitHistory
from exporters.base_exporter import BaseExporter
from exporters.csv_exporter import CSVExporter
from exporters.exporter_factory import ExporterFactory
from exporters.xlsx_exporter import XLSXExporter
from operation import VestingOperation, SellOperation
from utils import parse_date, print_current_position, print_portfolio_history
from data_provider import PDFDataProvider, StaticDataProvider, MultDataProvider

def main():
    exporter_factory = ExporterFactory()
    exporter_factory.register_exporter([CSVExporter, XLSXExporter])
    exporter = exporter_factory.get_exporter("csv")
    try:
        #Reading data from PDFDataProvider and manual entries
        benefit_history = BenefitHistory(data_provider=MultDataProvider(providers=[
            # PDFDataProvider(),
            # Add manual entries here
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
        exporter.export(benefit_history.get_transaction_snapshots(), benefit_history.get_yearly_summaries())
    except ValueError as e:
        print(f"Error processing operations: {e}")
        return

if __name__ == "__main__":
    main()
