"""
Infrastructure adapters for presentation and reporting.

This module contains concrete implementations of presentation services
that handle user interface and reporting functionality.
"""

from typing import List
import logging

from ..domain.entities import PortfolioPosition
from ..application.use_cases import PortfolioReportingService

logger = logging.getLogger(__name__)


class ConsolePortfolioReporter(PortfolioReportingService):
    """
    Console-based portfolio reporting service.
    
    This service generates formatted reports and displays them
    on the console for user viewing.
    """
    
    def generate_portfolio_report(self, positions: List[PortfolioPosition]) -> None:
        """Generate and display portfolio report on console."""
        if not positions:
            print("\n==== No Portfolio Data Available ====")
            return
        
        print("\n" + "="*60)
        print("PORTFOLIO HISTORY REPORT")
        print("="*60)
        
        # Group positions by year for better organization
        positions_by_year = self._group_positions_by_year(positions)
        
        for year in sorted(positions_by_year.keys()):
            year_positions = positions_by_year[year]
            self._print_year_section(year, year_positions)
        
        # Print final summary
        final_position = positions[-1]
        self._print_final_summary(final_position)
    
    def _group_positions_by_year(self, positions: List[PortfolioPosition]) -> dict:
        """Group positions by year."""
        positions_by_year = {}
        
        for position in positions:
            year = position.last_updated.year
            if year not in positions_by_year:
                positions_by_year[year] = []
            positions_by_year[year].append(position)
        
        return positions_by_year
    
    def _print_year_section(self, year: int, positions: List[PortfolioPosition]) -> None:
        """Print positions for a specific year."""
        print(f"\n--- Year {year} ---")
        
        for position in positions:
            date_str = position.last_updated.strftime("%d/%m/%Y")
            print(f"Date: {date_str}")
            print(f"  Quantity: {position.quantity.value}")
            print(f"  Total Cost USD: ${position.total_cost_usd.amount:,.4f}")
            print(f"  Average Price USD: ${position.average_price_usd.amount:,.4f}")
            print(f"  Total Cost BRL: R${position.total_cost_brl.amount:,.4f}")
            print(f"  Average Price BRL: R${position.average_price_brl.amount:,.4f}")
            print(f"  Gross Profit BRL: R${position.gross_profit_brl.amount:,.4f}")
            print()
        
        # Print year-end summary
        final_position = positions[-1]
        print(f"=== End of {year} Summary ===")
        print(f"Final Quantity: {final_position.quantity.value}")
        print(f"Total Return BRL: R${final_position.gross_profit_brl.amount:,.4f}")
        print()
    
    def _print_final_summary(self, final_position: PortfolioPosition) -> None:
        """Print final portfolio summary."""
        print("="*60)
        print("FINAL PORTFOLIO POSITION")
        print("="*60)
        print(f"Date: {final_position.last_updated.strftime('%d/%m/%Y')}")
        print(f"Total Shares: {final_position.quantity.value}")
        print(f"Total Investment USD: ${final_position.total_cost_usd.amount:,.4f}")
        print(f"Average Cost USD: ${final_position.average_price_usd.amount:,.4f}")
        print(f"Total Investment BRL: R${final_position.total_cost_brl.amount:,.4f}")
        print(f"Average Cost BRL: R${final_position.average_price_brl.amount:,.4f}")
        print(f"Total Realized Profit BRL: R${final_position.gross_profit_brl.amount:,.4f}")
        print("="*60)


class SilentPortfolioReporter(PortfolioReportingService):
    """
    Silent portfolio reporter that doesn't output anything.
    
    This is useful for automated processing where console output
    is not desired.
    """
    
    def generate_portfolio_report(self, positions: List[PortfolioPosition]) -> None:
        """Generate report silently (no output)."""
        logger.info(f"Silent report generated for {len(positions)} positions")
        pass
