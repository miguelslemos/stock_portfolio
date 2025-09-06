"""
Edge case tests for year-end reset functionality.

This module contains tests for edge cases and special scenarios
that might occur with year-end profit resets.
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal

from src.domain.entities import Money, StockQuantity, PortfolioPosition, ProfitLoss
from src.domain.operations import VestingOperation, TradeOperation
from src.domain.services import PortfolioCalculationService
from src.infrastructure.exchange_rate import MockExchangeRateService


class TestYearEndEdgeCases:
    """Test edge cases for year-end reset functionality."""
    
    @pytest.fixture
    def calc_service(self):
        """Create a calculation service with mock exchange rates."""
        exchange_service = MockExchangeRateService()
        return PortfolioCalculationService(exchange_service)
    
    def test_leap_year_transition(self, calc_service):
        """Test year transition during leap year."""
        operations = [
            # 2024 is a leap year - February 29th
            VestingOperation(
                date=datetime(2024, 2, 29),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 12, 31),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            ),
            # 2025 - Regular year
            VestingOperation(
                date=datetime(2025, 1, 1),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Group by year
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        positions_2025 = [p for p in positions if p.last_updated.year == 2025]
        
        # 2024 should have profit
        assert positions_2024[-1].gross_profit_brl.amount > Decimal('0')
        
        # 2025 should reset
        assert positions_2025[0].gross_profit_brl.amount == Decimal('0')
    
    def test_microsecond_precision_year_boundary(self, calc_service):
        """Test year boundary with microsecond precision."""
        operations = [
            # Last microsecond of 2023
            VestingOperation(
                date=datetime(2023, 12, 31, 23, 59, 59, 999999),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 12, 31, 23, 59, 59, 999999),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('13.00'), 'USD')
            ),
            # First microsecond of 2024
            VestingOperation(
                date=datetime(2024, 1, 1, 0, 0, 0, 0),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('11.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Verify year detection works with microsecond precision
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        assert len(positions_2023) == 2
        assert len(positions_2024) == 1
        
        # 2023 should have profit from trade
        assert positions_2023[-1].gross_profit_brl.amount > Decimal('0')
        
        # 2024 should reset
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')
    
    def test_empty_portfolio_multiple_year_transitions(self, calc_service):
        """Test multiple year transitions with empty portfolio periods."""
        operations = [
            # 2022: Build and liquidate
            VestingOperation(
                date=datetime(2022, 1, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('8.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2022, 6, 20),
                quantity=StockQuantity(100),  # Sell all
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            
            # 2023: Empty year (no operations)
            # Portfolio remains empty but profit should reset
            
            # 2024: Start fresh
            VestingOperation(
                date=datetime(2024, 2, 10),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 8, 15),
                quantity=StockQuantity(50),  # Sell all again
                price_per_share_usd=Money(Decimal('20.00'), 'USD')
            ),
            
            # 2025: Another fresh start
            VestingOperation(
                date=datetime(2025, 3, 5),
                quantity=StockQuantity(75),
                price_per_share_usd=Money(Decimal('18.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Group by year
        positions_by_year = {}
        for pos in positions:
            year = pos.last_updated.year
            if year not in positions_by_year:
                positions_by_year[year] = []
            positions_by_year[year].append(pos)
        
        # 2022: Should end with profit and empty portfolio
        final_2022 = positions_by_year[2022][-1]
        assert final_2022.quantity.value == 0
        assert final_2022.gross_profit_brl.amount > Decimal('0')
        
        # 2024: Should reset and end with profit and empty portfolio
        final_2024 = positions_by_year[2024][-1]
        assert final_2024.quantity.value == 0
        assert final_2024.gross_profit_brl.amount > Decimal('0')
        
        # 2025: Should reset and have no profit (only vesting)
        final_2025 = positions_by_year[2025][-1]
        assert final_2025.quantity.value == 75
        assert final_2025.gross_profit_brl.amount == Decimal('0')
        
        # Verify profits are independent
        profit_2022 = final_2022.gross_profit_brl.amount
        profit_2024 = final_2024.gross_profit_brl.amount
        assert profit_2022 != profit_2024
    
    def test_single_operation_per_year(self, calc_service):
        """Test year transitions with only one operation per year."""
        operations = [
            # One operation per year
            VestingOperation(
                date=datetime(2020, 6, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('5.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2021, 7, 20),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('8.00'), 'USD')
            ),
            VestingOperation(
                date=datetime(2022, 8, 25),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('7.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 9, 30),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            VestingOperation(
                date=datetime(2024, 10, 5),
                quantity=StockQuantity(60),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Each position should be in a different year
        years = [p.last_updated.year for p in positions]
        assert years == [2020, 2021, 2022, 2023, 2024]
        
        # Check profit patterns
        profits = [p.gross_profit_brl.amount for p in positions]
        
        # 2020: Vesting - no profit
        assert profits[0] == Decimal('0')
        
        # 2021: Trade - profit (but reset from previous year)
        assert profits[1] > Decimal('0')
        
        # 2022: Vesting - reset to zero
        assert profits[2] == Decimal('0')
        
        # 2023: Trade - new profit (reset from previous year)
        assert profits[3] > Decimal('0')
        
        # 2024: Vesting - reset to zero
        assert profits[4] == Decimal('0')
        
        # Verify trade profits are independent
        assert profits[1] != profits[3]
    
    def test_massive_profit_reset(self, calc_service):
        """Test reset with very large profit amounts."""
        operations = [
            # 2023: Build massive profit
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(10000),
                price_per_share_usd=Money(Decimal('1.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 12, 20),
                quantity=StockQuantity(5000),
                price_per_share_usd=Money(Decimal('100.00'), 'USD')  # Massive gain
            ),
            
            # 2024: Should reset regardless of profit size
            VestingOperation(
                date=datetime(2024, 1, 10),
                quantity=StockQuantity(1000),
                price_per_share_usd=Money(Decimal('50.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Get positions by year
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # 2023 should have massive profit
        massive_profit = positions_2023[-1].gross_profit_brl.amount
        assert massive_profit > Decimal('100000')  # Very large profit
        
        # 2024 should still reset to zero despite massive previous profit
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')
    
    def test_negative_profit_reset(self, calc_service):
        """Test reset when previous year had losses (negative profit)."""
        operations = [
            # 2023: Build position and make a loss
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('20.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 12, 20),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')  # Loss
            ),
            
            # 2024: Should reset to zero (not carry forward loss)
            VestingOperation(
                date=datetime(2024, 1, 10),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Get positions by year
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # 2023 should have negative profit (loss)
        loss_2023 = positions_2023[-1].gross_profit_brl.amount
        assert loss_2023 < Decimal('0')
        
        # 2024 should reset to zero (not carry forward the loss)
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')
    
    def test_fractional_shares_year_reset(self, calc_service):
        """Test year reset with fractional calculations."""
        operations = [
            # 2023: Operations that might result in fractional calculations
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(333),  # Prime number for fractional averages
                price_per_share_usd=Money(Decimal('7.77'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 12, 20),
                quantity=StockQuantity(111),
                price_per_share_usd=Money(Decimal('13.33'), 'USD')
            ),
            
            # 2024: Should reset cleanly
            VestingOperation(
                date=datetime(2024, 1, 10),
                quantity=StockQuantity(77),
                price_per_share_usd=Money(Decimal('11.11'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Get positions by year
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # 2023 should have some profit (possibly fractional)
        profit_2023 = positions_2023[-1].gross_profit_brl.amount
        assert profit_2023 != Decimal('0')
        
        # 2024 should reset to exactly zero
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')
        
        # Verify other fields are preserved correctly
        final_2023 = positions_2023[-1]
        first_2024 = positions_2024[0]
        
        # Quantities should be preserved
        assert first_2024.quantity.value == final_2023.quantity.value + 77
        
        # Average prices should be recalculated but not zero
        assert first_2024.average_price_usd.amount > Decimal('0')
        assert first_2024.average_price_brl.amount > Decimal('0')
    
    def test_chronological_ordering_with_year_resets(self, calc_service):
        """Test that year resets work correctly even with unordered operations."""
        operations = [
            # Intentionally out of chronological order
            VestingOperation(
                date=datetime(2024, 6, 15),  # 2024 operation first
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            VestingOperation(
                date=datetime(2023, 1, 15),  # 2023 operation second
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 8, 20),  # Another 2023 operation
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 10, 25),  # Another 2024 operation
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('18.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Operations should be processed in chronological order
        dates = [p.last_updated for p in positions]
        assert dates == sorted(dates)
        
        # Group by year
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # 2023 should have profit from trade
        assert positions_2023[-1].gross_profit_brl.amount > Decimal('0')
        
        # 2024 should reset (first 2024 operation is vesting)
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')
        
        # 2024 should then accumulate profit from trade
        assert positions_2024[1].gross_profit_brl.amount > Decimal('0')
    
    def test_year_reset_with_initial_position(self, calc_service):
        """Test year reset when starting with an initial position from previous year."""
        # Create initial position from 2022 with some profit
        initial_position = PortfolioPosition(
            quantity=StockQuantity(50),
            total_cost_usd=Money(Decimal('500.00'), 'USD'),
            total_cost_brl=Money(Decimal('2500.00'), 'BRL'),
            average_price_usd=Money(Decimal('10.00'), 'USD'),
            average_price_brl=Money(Decimal('50.00'), 'BRL'),
            gross_profit_brl=ProfitLoss(Decimal('300.00'), 'BRL'),  # Previous year profit
            last_updated=datetime(2022, 12, 31),
            operation_quantity=StockQuantity(25),
            operation_type='trade'
        )
        
        # Operations starting in 2023
        operations = [
            VestingOperation(
                date=datetime(2023, 2, 15),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 8, 20),
                quantity=StockQuantity(20),
                price_per_share_usd=Money(Decimal('16.00'), 'USD')
            )
        ]
        
        # Execute operations with initial position
        positions = calc_service.execute_operations(operations, initial_position)
        
        # All positions should be from 2023 (year transition should have happened)
        assert all(p.last_updated.year == 2023 for p in positions)
        
        # First position should have reset profit (vesting after year transition)
        assert positions[0].gross_profit_brl.amount == Decimal('0')
        
        # Second position should have new profit (not including initial 300 BRL)
        new_profit = positions[1].gross_profit_brl.amount
        assert new_profit > Decimal('0')
        assert new_profit != Decimal('300.00')  # Should not be the initial profit
