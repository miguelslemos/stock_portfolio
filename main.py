from typing import List
import argparse

from benefit_history import BenefitHistory
from exporters.csv_exporter import CSVExporter
from exporters.exporter_factory import ExporterFactory
from exporters.noop_exporter import NoopExporter
from exporters.xlsx_exporter import XLSXExporter
from data_provider import PDFDataProvider, StaticDataProvider, MultDataProvider
from operation import load_operations


def _parse_args():
    parser = argparse.ArgumentParser(description='Process benefit history and export data.')
    
    # Data source arguments
    parser.add_argument('--pdf', action='store_true', help='Process data from PDF confirmations')
    parser.add_argument('--json', type=str, help='Path to JSON file containing operations data')
    
    # PDF specific arguments
    pdf_group = parser.add_argument_group('PDF Processing Options')
    pdf_group.add_argument('--trade-confirmations', type=str, default='trade_confirmations/',
                          help='Directory containing trade confirmation PDFs (default: trade_confirmations/)')
    pdf_group.add_argument('--release-confirmations', type=str, default='release_confirmations/',
                          help='Directory containing release confirmation PDFs (default: release_confirmations/)')
    
    # Export options
    parser.add_argument('--export', choices=['csv', 'xlsx'], default='none',
                       help='Export format (csv or xlsx)')
    
    args = parser.parse_args()
    
    # Validate that at least one data source is provided
    if not args.pdf and not args.json:
        parser.error("At least one data source (--pdf or --json) must be provided")
    return args

def main():
    args = _parse_args()
    exporter_factory = _register_factory()
    exporter = _get_exporter(exporter_factory, args)
    
    try:
        providers = []
        # Add PDF provider if requested
        if args.pdf:
            providers.append(PDFDataProvider(
                trade_confirmations_path=args.trade_confirmations,
                release_confirmations_path=args.release_confirmations
            ))
        # Add JSON provider if requested
        if args.json:
            operations = load_operations(args.json)
            providers.append(StaticDataProvider(operations=operations))
        # Create benefit history with multiple providers
        benefit_history = BenefitHistory(data_provider=MultDataProvider(providers=providers))
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
