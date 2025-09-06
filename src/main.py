"""
Main entry point for the Stock Portfolio Management System.

This module provides a simplified command-line interface that follows
Clean Architecture principles and provides easy-to-use functionality
for portfolio management.
"""

import argparse
import logging
import sys
from typing import Optional

from .application.use_cases import (
    ProcessPortfolioUseCase, 
    ProcessPortfolioRequest
)
from .domain.services import PortfolioCalculationService, PortfolioAnalyticsService
from .infrastructure.exchange_rate import BCBExchangeRateService, CachedExchangeRateService
from .infrastructure.repositories import (
    JSONOperationRepository, 
    PDFOperationRepository, 
    CompositeOperationRepository
)
from .infrastructure.presentation import ConsolePortfolioReporter, SilentPortfolioReporter
from .infrastructure.export import ExporterFactory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class PortfolioApplication:
    """
    Main application class that orchestrates the portfolio management system.
    
    This class follows the Dependency Injection pattern and provides
    a clean interface for running portfolio operations.
    """
    
    def __init__(self):
        """Initialize the application with default dependencies."""
        # Initialize core services
        exchange_rate_service = CachedExchangeRateService(BCBExchangeRateService())
        self._calculation_service = PortfolioCalculationService(exchange_rate_service)
        self._analytics_service = PortfolioAnalyticsService()
    
    def run(self, args: argparse.Namespace) -> int:
        """
        Run the portfolio application with the provided arguments.
        
        Args:
            args: Parsed command line arguments
            
        Returns:
            Exit code (0 for success, non-zero for error)
        """
        try:
            logger.info("Starting Stock Portfolio Management System")
            
            # Create repositories based on input sources
            repositories = self._create_repositories(args)
            if not repositories:
                logger.error("No valid data sources provided")
                return 1
            
            # Create composite repository
            operation_repository = CompositeOperationRepository(repositories)
            
            # Create services
            reporting_service = self._create_reporting_service(args)
            export_service = self._create_export_service(args)
            
            # Create and execute use case
            use_case = ProcessPortfolioUseCase(
                operation_repository=operation_repository,
                calculation_service=self._calculation_service,
                analytics_service=self._analytics_service,
                reporting_service=reporting_service,
                export_service=export_service
            )
            
            request = ProcessPortfolioRequest(
                include_reporting=not args.quiet,
                export_data=args.export != 'none'
            )
            
            response = use_case.execute(request)
            
            # Log summary
            logger.info(f"Processing completed successfully")
            logger.info(f"Total operations: {response.total_operations}")
            logger.info(f"Final position: {response.final_position.quantity.value} shares")
            logger.info(f"Total return: R${response.total_return_brl.amount:,.2f}")
            
            return 0
            
        except Exception as e:
            logger.error(f"Application error: {e}")
            if args.debug:
                raise
            return 1
    
    def _create_repositories(self, args: argparse.Namespace) -> list:
        """Create repositories based on command line arguments."""
        repositories = []
        
        # Add JSON repository if specified
        if args.json:
            try:
                json_repo = JSONOperationRepository(args.json)
                repositories.append(json_repo)
                logger.info(f"Added JSON repository: {args.json}")
            except Exception as e:
                logger.error(f"Failed to create JSON repository: {e}")
        
        # Add PDF repository if specified
        if args.pdf:
            try:
                pdf_repo = PDFOperationRepository(
                    trade_confirmations_dir=args.trade_confirmations,
                    release_confirmations_dir=args.release_confirmations
                )
                repositories.append(pdf_repo)
                logger.info(f"Added PDF repository: trade={args.trade_confirmations}, release={args.release_confirmations}")
            except Exception as e:
                logger.error(f"Failed to create PDF repository: {e}")
        
        return repositories
    
    def _create_reporting_service(self, args: argparse.Namespace) -> Optional[ConsolePortfolioReporter]:
        """Create reporting service based on arguments."""
        if args.quiet:
            return SilentPortfolioReporter()
        else:
            return ConsolePortfolioReporter()
    
    def _create_export_service(self, args: argparse.Namespace) -> Optional:
        """Create export service based on arguments."""
        if args.export == 'none':
            return None
        
        try:
            return ExporterFactory.create_exporter(args.export, args.output_dir)
        except Exception as e:
            logger.error(f"Failed to create exporter: {e}")
            return None


def create_argument_parser() -> argparse.ArgumentParser:
    """Create and configure the command line argument parser."""
    parser = argparse.ArgumentParser(
        description='Stock Portfolio Management System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --pdf                          # Process PDF files with console output
  %(prog)s --json operations.json         # Process JSON file
  %(prog)s --pdf --export csv             # Process PDFs and export to CSV
  %(prog)s --json ops.json --quiet        # Process JSON silently
  %(prog)s --pdf --json ops.json --export xlsx  # Use both sources, export XLSX
        """
    )
    
    # Data source arguments
    source_group = parser.add_argument_group('Data Sources (at least one required)')
    source_group.add_argument(
        '--pdf', 
        action='store_true',
        help='Process data from PDF confirmation files'
    )
    source_group.add_argument(
        '--json', 
        type=str, 
        metavar='FILE',
        help='Process data from JSON file containing operations'
    )
    
    # PDF-specific options
    pdf_group = parser.add_argument_group('PDF Processing Options')
    pdf_group.add_argument(
        '--trade-confirmations', 
        type=str, 
        default='trade_confirmations/',
        metavar='DIR',
        help='Directory containing trade confirmation PDFs (default: trade_confirmations/)'
    )
    pdf_group.add_argument(
        '--release-confirmations', 
        type=str, 
        default='release_confirmations/',
        metavar='DIR',
        help='Directory containing release confirmation PDFs (default: release_confirmations/)'
    )
    
    # Output options
    output_group = parser.add_argument_group('Output Options')
    output_group.add_argument(
        '--export', 
        choices=['csv', 'xlsx', 'none'], 
        default='none',
        help='Export format for portfolio data (default: none)'
    )
    output_group.add_argument(
        '--output-dir', 
        type=str, 
        default='.',
        metavar='DIR',
        help='Directory for exported files (default: current directory)'
    )
    output_group.add_argument(
        '--quiet', 
        action='store_true',
        help='Suppress console output (only show errors)'
    )
    
    # Debug options
    parser.add_argument(
        '--debug', 
        action='store_true',
        help='Enable debug mode with detailed error information'
    )
    
    return parser


def validate_arguments(args: argparse.Namespace) -> None:
    """Validate command line arguments."""
    if not args.pdf and not args.json:
        raise ValueError("At least one data source (--pdf or --json) must be provided")


def main() -> int:
    """Main entry point."""
    parser = create_argument_parser()
    args = parser.parse_args()
    
    # Set logging level based on arguments
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    elif args.quiet:
        logging.getLogger().setLevel(logging.ERROR)
    
    try:
        validate_arguments(args)
        
        app = PortfolioApplication()
        return app.run(args)
        
    except ValueError as e:
        parser.error(str(e))
        return 1
    except KeyboardInterrupt:
        logger.info("Operation cancelled by user")
        return 1
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        if args.debug:
            raise
        return 1


if __name__ == "__main__":
    sys.exit(main())
