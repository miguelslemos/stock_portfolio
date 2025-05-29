import csv
import os
from typing import List
from exporters.file_exporter import FileExporter
from portfolio_snapshot import PortfolioSnapshot


class CSVExporter(FileExporter):
    """Exporter for CSV format."""
    
    @staticmethod
    def get_exporter_type() -> str:
        return "csv"
    
    def _write_row(self, writer, row_data):
        writer.writerow(row_data)

    def export(self, history: List[PortfolioSnapshot], yearly_summaries: List) -> None:
        """Export portfolio history and yearly summaries to CSV files."""
        portfolio_filename: str = "portfolio_history.csv"
        yearly_filename: str = "yearly_summary.csv"
        with open(portfolio_filename, 'w', newline='') as f:
            writer = csv.writer(f)
            self._write_portfolio_history(writer, history)
        with open(yearly_filename, 'w', newline='') as f:
            writer = csv.writer(f)
            self._write_yearly_summary(writer, yearly_summaries)
        portfolio_absolute_path = os.path.abspath(portfolio_filename)
        yearly_absolute_path = os.path.abspath(yearly_filename)
        print(f"\nPortfolio data exported to:")
        print(f"  - Portfolio History: {portfolio_absolute_path} ({len(history)} transactions)")
        print(f"  - Yearly Summary: {yearly_absolute_path} ({len(yearly_summaries)} years)") 