"""
Tests for year-end reset functionality of gross_profit_brl.

This module contains comprehensive tests to ensure that gross_profit_brl
is correctly reset to zero at the beginning of each new fiscal year.
"""

import pytest
from datetime import datetime
from decimal import Decimal

from src.domain.entities import Money, StockQuantity, PortfolioPosition
from src.domain.operations import VestingOperation, TradeOperation
from src.domain.services import PortfolioCalculationService
from src.infrastructure.exchange_rate import MockExchangeRateService


class TestYearEndReset:
    """Test cases for year-end reset functionality."""
    
    @pytest.fixture
    def calc_service(self):
        """Create a calculation service with mock exchange rates."""
        exchange_service = MockExchangeRateService()
        return PortfolioCalculationService(exchange_service)
    
    def test_gross_profit_reset_on_year_change(self, calc_service):
        """Test that gross_profit_brl resets when year changes."""
        operations = [
            # 2023: Build up some profit
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 6, 20),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            ),
            # 2024: Should reset profit
            VestingOperation(
                date=datetime(2024, 1, 10),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Check 2023 positions
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        assert len(positions_2023) == 2
        
        # First 2023 position (vesting) should have zero profit
        assert positions_2023[0].gross_profit_brl.amount == Decimal('0')
        
        # Second 2023 position (trade) should have profit
        assert positions_2023[1].gross_profit_brl.amount > Decimal('0')
        profit_2023 = positions_2023[1].gross_profit_brl.amount
        
        # Check 2024 positions
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        assert len(positions_2024) == 1
        
        # 2024 position should have reset profit (zero after vesting)
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')
    
    def test_multiple_year_transitions(self, calc_service):
        """Test multiple year transitions with profit accumulation."""
        operations = [
            # 2022
            VestingOperation(
                date=datetime(2022, 12, 1),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('8.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2022, 12, 15),
                quantity=StockQuantity(20),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            # 2023 - Reset should happen
            VestingOperation(
                date=datetime(2023, 2, 10),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 8, 20),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('14.00'), 'USD')
            ),
            # 2024 - Another reset
            VestingOperation(
                date=datetime(2024, 3, 5),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('11.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 9, 12),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('16.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Group positions by year
        by_year = {}
        for pos in positions:
            year = pos.last_updated.year
            if year not in by_year:
                by_year[year] = []
            by_year[year].append(pos)
        
        # Verify 2022 profit accumulation
        assert by_year[2022][0].gross_profit_brl.amount == Decimal('0')  # After vesting
        assert by_year[2022][1].gross_profit_brl.amount > Decimal('0')   # After trade
        profit_2022 = by_year[2022][1].gross_profit_brl.amount
        
        # Verify 2023 reset and new accumulation
        assert by_year[2023][0].gross_profit_brl.amount == Decimal('0')  # Reset after vesting
        assert by_year[2023][1].gross_profit_brl.amount > Decimal('0')   # New profit after trade
        profit_2023 = by_year[2023][1].gross_profit_brl.amount
        
        # Verify 2024 reset and new accumulation
        assert by_year[2024][0].gross_profit_brl.amount == Decimal('0')  # Reset after vesting
        assert by_year[2024][1].gross_profit_brl.amount > Decimal('0')   # New profit after trade
        profit_2024 = by_year[2024][1].gross_profit_brl.amount
        
        # Each year's profit should be independent
        assert profit_2022 != profit_2023
        assert profit_2023 != profit_2024
        assert profit_2022 != profit_2024
    
    def test_no_reset_within_same_year(self, calc_service):
        """Test that profit accumulates normally within the same year."""
        operations = [
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 3, 20),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            VestingOperation(
                date=datetime(2023, 6, 10),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('11.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 9, 15),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # All positions should be in 2023
        assert all(p.last_updated.year == 2023 for p in positions)
        
        # Profit should accumulate (not reset)
        profits = [p.gross_profit_brl.amount for p in positions]
        
        # First position (vesting) - zero profit
        assert profits[0] == Decimal('0')
        
        # Second position (trade) - some profit
        assert profits[1] > Decimal('0')
        
        # Third position (vesting) - profit should remain from previous trade
        assert profits[2] == profits[1]  # Vesting doesn't change profit
        
        # Fourth position (trade) - profit should increase
        assert profits[3] > profits[2]
    
    def test_year_transition_with_only_vesting(self, calc_service):
        """Test year transition when new year starts with vesting only."""
        operations = [
            # 2023: Build profit
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 6, 20),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('13.00'), 'USD')
            ),
            # 2024: Only vesting operations
            VestingOperation(
                date=datetime(2024, 2, 10),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('11.00'), 'USD')
            ),
            VestingOperation(
                date=datetime(2024, 8, 15),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Get positions by year
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # 2023 should have profit from trade
        assert positions_2023[1].gross_profit_brl.amount > Decimal('0')
        
        # 2024 positions should all have zero profit (only vesting)
        for pos in positions_2024:
            assert pos.gross_profit_brl.amount == Decimal('0')
    
    def test_year_transition_with_only_trades(self, calc_service):
        """Test year transition when new year starts with trade operations."""
        operations = [
            # 2023: Setup position
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(200),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 6, 20),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            # 2024: Only trades (should reset then accumulate)
            TradeOperation(
                date=datetime(2024, 3, 10),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 8, 15),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('18.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Get positions by year
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # 2023 should have accumulated profit
        profit_2023 = positions_2023[1].gross_profit_brl.amount
        assert profit_2023 > Decimal('0')
        
        # 2024 first trade should start fresh (reset happened before trade)
        first_2024_profit = positions_2024[0].gross_profit_brl.amount
        assert first_2024_profit >= Decimal('0')  # Should be new profit, not carried over
        assert first_2024_profit != profit_2023  # Should not equal 2023 profit
        
        # 2024 second trade should accumulate on top of first
        second_2024_profit = positions_2024[1].gross_profit_brl.amount
        assert second_2024_profit > first_2024_profit
    
    def test_empty_portfolio_year_transition(self, calc_service):
        """Test year transition with empty portfolio."""
        operations = [
            # 2023: Build and empty portfolio
            VestingOperation(
                date=datetime(2023, 1, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 6, 20),
                quantity=StockQuantity(100),  # Sell all
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            ),
            # 2024: Start fresh
            VestingOperation(
                date=datetime(2024, 2, 10),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            )
        ]
        
        positions = calc_service.execute_operations(operations)
        
        # Check final 2023 position
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        final_2023 = positions_2023[-1]
        assert final_2023.quantity.value == 0  # Empty portfolio
        assert final_2023.gross_profit_brl.amount > Decimal('0')  # But has profit
        
        # Check 2024 position
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        first_2024 = positions_2024[0]
        assert first_2024.quantity.value == 50  # New position
        assert first_2024.gross_profit_brl.amount == Decimal('0')  # Reset profit
    
    def test_reset_gross_profit_for_new_year_method(self, calc_service):
        """Test the _reset_gross_profit_for_new_year method directly."""
        # Create a position with some profit
        original_position = PortfolioPosition(
            quantity=StockQuantity(100),
            total_cost_usd=Money(Decimal('1000.00'), 'USD'),
            total_cost_brl=Money(Decimal('5000.00'), 'BRL'),
            average_price_usd=Money(Decimal('10.00'), 'USD'),
            average_price_brl=Money(Decimal('50.00'), 'BRL'),
            gross_profit_brl=Money(Decimal('500.00'), 'BRL'),  # Some profit
            last_updated=datetime(2023, 12, 31),
            operation_quantity=StockQuantity(25),
            operation_type='trade'
        )
        
        # Reset for new year
        new_year_date = datetime(2024, 1, 1)
        reset_position = calc_service._reset_gross_profit_for_new_year(
            original_position, new_year_date
        )
        
        # Verify only gross_profit_brl was reset
        assert reset_position.quantity == original_position.quantity
        assert reset_position.total_cost_usd == original_position.total_cost_usd
        assert reset_position.total_cost_brl == original_position.total_cost_brl
        assert reset_position.average_price_usd == original_position.average_price_usd
        assert reset_position.average_price_brl == original_position.average_price_brl
        assert reset_position.last_updated == original_position.last_updated
        assert reset_position.operation_quantity == original_position.operation_quantity
        assert reset_position.operation_type == original_position.operation_type
        
        # Only gross_profit_brl should be reset
        assert reset_position.gross_profit_brl.amount == Decimal('0')
        assert original_position.gross_profit_brl.amount == Decimal('500.00')
