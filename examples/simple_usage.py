#!/usr/bin/env python3
"""
Simple usage example of the Stock Portfolio Management System.

This example demonstrates how to use the system programmatically
without the command-line interface.
"""

import sys
import os
from datetime import datetime
from decimal import Decimal

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from src.domain.entities import Money, StockQuantity
from src.domain.operations import VestingOperation, TradeOperation
from src.domain.services import PortfolioCalculationService, PortfolioAnalyticsService
from src.infrastructure.exchange_rate import MockExchangeRateService
from src.infrastructure.repositories import JSONOperationRepository
from src.application.use_cases import ProcessPortfolioUseCase, ProcessPortfolioRequest


def create_sample_operations():
    """Create sample operations for demonstration."""
    return [
        VestingOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(100),
            price_per_share_usd=Money(Decimal('10.50'), 'USD')
        ),
        VestingOperation(
            date=datetime(2024, 2, 15),
            quantity=StockQuantity(50),
            price_per_share_usd=Money(Decimal('12.00'), 'USD')
        ),
        TradeOperation(
            date=datetime(2024, 3, 15),
            quantity=StockQuantity(30),
            price_per_share_usd=Money(Decimal('15.00'), 'USD')
        )
    ]


class SimpleOperationRepository:
    """Simple in-memory repository for demonstration."""
    
    def __init__(self, operations):
        self.operations = operations
    
    def get_all_operations(self):
        return self.operations


def main():
    """Demonstrate simple usage of the portfolio system."""
    print("Stock Portfolio Management System - Simple Usage Example")
    print("=" * 60)
    
    # 1. Create sample operations
    operations = create_sample_operations()
    print(f"Created {len(operations)} sample operations:")
    for i, op in enumerate(operations, 1):
        print(f"  {i}. {op.get_description()} on {op.get_date().strftime('%Y-%m-%d')}")
    
    # 2. Set up services with mock exchange rate
    exchange_rate_service = MockExchangeRateService(default_rate=5.25)  # USD/BRL = 5.25
    calculation_service = PortfolioCalculationService(exchange_rate_service)
    analytics_service = PortfolioAnalyticsService()
    
    # 3. Create repository
    repository = SimpleOperationRepository(operations)
    
    # 4. Create use case (without reporting/export for simplicity)
    use_case = ProcessPortfolioUseCase(
        operation_repository=repository,
        calculation_service=calculation_service,
        analytics_service=analytics_service,
        reporting_service=None,
        export_service=None
    )
    
    # 5. Execute portfolio processing
    request = ProcessPortfolioRequest(
        include_reporting=False,
        export_data=False
    )
    
    response = use_case.execute(request)
    
    # 6. Display results
    print(f"\nProcessing Results:")
    print(f"Total operations processed: {response.total_operations}")
    
    final_position = response.final_position
    print(f"\nFinal Portfolio Position:")
    print(f"  Shares: {final_position.quantity.value}")
    print(f"  Total Cost USD: ${final_position.total_cost_usd.amount:,.2f}")
    print(f"  Average Price USD: ${final_position.average_price_usd.amount:,.2f}")
    print(f"  Total Cost BRL: R${final_position.total_cost_brl.amount:,.2f}")
    print(f"  Average Price BRL: R${final_position.average_price_brl.amount:,.2f}")
    print(f"  Realized Profit BRL: R${final_position.gross_profit_brl.amount:,.2f}")
    
    # 7. Show position history
    print(f"\nPosition History ({len(response.position_history)} snapshots):")
    for i, position in enumerate(response.position_history, 1):
        print(f"  {i}. {position.last_updated.strftime('%Y-%m-%d')}: "
              f"{position.quantity.value} shares, "
              f"R${position.gross_profit_brl.amount:,.2f} profit")
    
    print("\nExample completed successfully!")


if __name__ == "__main__":
    main()
