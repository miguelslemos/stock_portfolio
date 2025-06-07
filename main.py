from typing import List
import argparse

from benefit_history import BenefitHistory
from exporters.base_exporter import BaseExporter
from exporters.csv_exporter import CSVExporter
from exporters.exporter_factory import ExporterFactory
from exporters.noop_exporter import NoopExporter
from exporters.xlsx_exporter import XLSXExporter
from operation import VestingOperation, SellOperation
from utils import parse_date, print_current_position, print_portfolio_history
from data_provider import PDFDataProvider, StaticDataProvider, MultDataProvider


def parse_args():
    parser = argparse.ArgumentParser(description='Process benefit history and export data.')
    parser.add_argument('--export', choices=['csv', 'xlsx'], default='none', help='Export format (csv or xlsx).')
    return parser.parse_args()

def main():
    args = parse_args()
    exporter_factory = _register_factory()
    exporter = _get_exporter(exporter_factory, args)
    try:
        benefit_history = BenefitHistory(data_provider=MultDataProvider(providers=[
            PDFDataProvider()]))
    except ValueError as e:
        print(f"Error processing operations: {e}")
        return
    exporter.export(benefit_history.get_transaction_snapshots(), benefit_history.get_yearly_summaries())

def _register_factory():
    exporter_factory = ExporterFactory()
    exporter_factory.register_exporter([CSVExporter, XLSXExporter, NoopExporter])
    return exporter_factory

def _get_exporter(exporter_factory: ExporterFactory, args: argparse.Namespace):
    return exporter_factory.get_exporter(args.export)

if __name__ == "__main__":
    main()
