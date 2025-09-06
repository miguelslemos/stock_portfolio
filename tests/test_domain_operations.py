"""
Tests for domain operations.

This module contains unit tests for portfolio operations
to ensure they implement business rules correctly.
"""

import pytest
from decimal import Decimal
from datetime import datetime

from src.domain.entities import Money, StockQuantity, ProfitLoss, PortfolioPosition, ExchangeRate
from src.domain.operations import VestingOperation, TradeOperation


class TestVestingOperation:
    """Test cases for VestingOperation."""
    
    def create_sample_exchange_rate(self):
        """Create a sample exchange rate for testing."""
        return ExchangeRate('USD', 'BRL', Decimal('5.0'), datetime(2024, 1, 1))
    
    def create_empty_position(self):
        """Create an empty portfolio position."""
        return PortfolioPosition(
            quantity=StockQuantity(0),
            total_cost_usd=Money(Decimal('0'), 'USD'),
            total_cost_brl=Money(Decimal('0'), 'BRL'),
            average_price_usd=Money(Decimal('0'), 'USD'),
            average_price_brl=Money(Decimal('0'), 'BRL'),
            gross_profit_brl=ProfitLoss(Decimal('0'), 'BRL'),
            last_updated=datetime(2024, 1, 1)
        )
    
    def test_create_valid_vesting_operation(self):
        """Test creating valid vesting operation."""
        operation = VestingOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(100),
            price_per_share_usd=Money(Decimal('10.50'), 'USD')
        )
        
        assert operation.get_date() == datetime(2024, 1, 15)
        assert operation.quantity.value == 100
        assert operation.price_per_share_usd.amount == Decimal('10.50')
    
    def test_non_usd_price_raises_error(self):
        """Test that non-USD price raises error."""
        with pytest.raises(ValueError, match="Vesting price must be in USD"):
            VestingOperation(
                date=datetime(2024, 1, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.50'), 'BRL')
            )
    
    def test_vesting_operation_description(self):
        """Test vesting operation description."""
        operation = VestingOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(100),
            price_per_share_usd=Money(Decimal('10.50'), 'USD')
        )
        
        expected = "Vesting: +100 shares at $10.5000"
        assert operation.get_description() == expected
    
    def test_execute_vesting_on_empty_position(self):
        """Test executing vesting on empty position."""
        operation = VestingOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(100),
            price_per_share_usd=Money(Decimal('10'), 'USD')
        )
        
        empty_position = self.create_empty_position()
        exchange_rate = self.create_sample_exchange_rate()
        
        result = operation.execute(empty_position, exchange_rate)
        
        new_position = result.new_position
        assert new_position.quantity.value == 100
        assert new_position.total_cost_usd.amount == Decimal('1000')  # 100 * 10
        assert new_position.total_cost_brl.amount == Decimal('5000')  # 1000 * 5.0
        assert new_position.average_price_usd.amount == Decimal('10')
        assert new_position.average_price_brl.amount == Decimal('50')
        assert new_position.gross_profit_brl.amount == Decimal('0')  # No profit on vesting
        assert result.profit_loss_brl is None
    
    def test_execute_vesting_on_existing_position(self):
        """Test executing vesting on existing position."""
        # Start with existing position
        existing_position = PortfolioPosition(
            quantity=StockQuantity(50),
            total_cost_usd=Money(Decimal('500'), 'USD'),
            total_cost_brl=Money(Decimal('2500'), 'BRL'),
            average_price_usd=Money(Decimal('10'), 'USD'),
            average_price_brl=Money(Decimal('50'), 'BRL'),
            gross_profit_brl=ProfitLoss(Decimal('100'), 'BRL'),
            last_updated=datetime(2024, 1, 1)
        )
        
        operation = VestingOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(100),
            price_per_share_usd=Money(Decimal('12'), 'USD')
        )
        
        exchange_rate = self.create_sample_exchange_rate()
        result = operation.execute(existing_position, exchange_rate)
        
        new_position = result.new_position
        assert new_position.quantity.value == 150  # 50 + 100
        assert new_position.total_cost_usd.amount == Decimal('1700')  # 500 + (100 * 12)
        assert new_position.total_cost_brl.amount == Decimal('8500')  # 2500 + (1200 * 5.0)
        
        # Check new average prices
        expected_avg_usd = Decimal('1700') / Decimal('150')  # ≈ 11.3333
        expected_avg_brl = Decimal('8500') / Decimal('150')  # ≈ 56.6667
        
        assert abs(new_position.average_price_usd.amount - expected_avg_usd) < Decimal('0.0001')
        assert abs(new_position.average_price_brl.amount - expected_avg_brl) < Decimal('0.0001')
        
        # Gross profit should remain unchanged
        assert new_position.gross_profit_brl.amount == Decimal('100')


class TestTradeOperation:
    """Test cases for TradeOperation."""
    
    def create_sample_exchange_rate(self):
        """Create a sample exchange rate for testing."""
        return ExchangeRate('USD', 'BRL', Decimal('5.0'), datetime(2024, 1, 1))
    
    def create_sample_position(self):
        """Create a sample portfolio position with holdings."""
        return PortfolioPosition(
            quantity=StockQuantity(100),
            total_cost_usd=Money(Decimal('1000'), 'USD'),
            total_cost_brl=Money(Decimal('5000'), 'BRL'),
            average_price_usd=Money(Decimal('10'), 'USD'),
            average_price_brl=Money(Decimal('50'), 'BRL'),
            gross_profit_brl=ProfitLoss(Decimal('0'), 'BRL'),
            last_updated=datetime(2024, 1, 1)
        )
    
    def test_create_valid_trade_operation(self):
        """Test creating valid trade operation."""
        operation = TradeOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(50),
            price_per_share_usd=Money(Decimal('12.50'), 'USD')
        )
        
        assert operation.get_date() == datetime(2024, 1, 15)
        assert operation.quantity.value == 50
        assert operation.price_per_share_usd.amount == Decimal('12.50')
    
    def test_non_usd_price_raises_error(self):
        """Test that non-USD price raises error."""
        with pytest.raises(ValueError, match="Trade price must be in USD"):
            TradeOperation(
                date=datetime(2024, 1, 15),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('12.50'), 'BRL')
            )
    
    def test_trade_operation_description(self):
        """Test trade operation description."""
        operation = TradeOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(50),
            price_per_share_usd=Money(Decimal('12.50'), 'USD')
        )
        
        expected = "Trade: -50 shares at $12.5000"
        assert operation.get_description() == expected
    
    def test_execute_partial_trade(self):
        """Test executing partial trade (sell some shares)."""
        position = self.create_sample_position()
        
        operation = TradeOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(30),  # Sell 30 out of 100
            price_per_share_usd=Money(Decimal('12'), 'USD')
        )
        
        exchange_rate = self.create_sample_exchange_rate()
        result = operation.execute(position, exchange_rate)
        
        new_position = result.new_position
        assert new_position.quantity.value == 70  # 100 - 30
        
        # With proportional cost method: 30/100 = 0.3 fraction sold
        expected_cost_usd = Decimal('1000') * Decimal('0.7')  # 700
        expected_cost_brl = Decimal('5000') * Decimal('0.7')  # 3500
        
        assert new_position.total_cost_usd.amount == expected_cost_usd
        assert new_position.total_cost_brl.amount == expected_cost_brl
        
        # Average prices should remain the same
        assert new_position.average_price_usd.amount == Decimal('10')
        assert new_position.average_price_brl.amount == Decimal('50')
        
        # Check profit calculation
        # Sale: 30 shares * $12 * 5.0 = R$1800
        # Cost: 30 shares * R$50 = R$1500
        # Profit: R$1800 - R$1500 = R$300
        expected_profit = Decimal('300')
        assert result.profit_loss_brl.amount == expected_profit
        assert new_position.gross_profit_brl.amount == expected_profit
    
    def test_execute_full_trade(self):
        """Test executing full trade (sell all shares)."""
        position = self.create_sample_position()
        
        operation = TradeOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(100),  # Sell all 100
            price_per_share_usd=Money(Decimal('11'), 'USD')
        )
        
        exchange_rate = self.create_sample_exchange_rate()
        result = operation.execute(position, exchange_rate)
        
        new_position = result.new_position
        assert new_position.quantity.value == 0
        assert new_position.total_cost_usd.amount == Decimal('0')
        assert new_position.total_cost_brl.amount == Decimal('0')
        
        # Check profit calculation
        # Sale: 100 shares * $11 * 5.0 = R$5500
        # Cost: 100 shares * R$50 = R$5000
        # Profit: R$5500 - R$5000 = R$500
        expected_profit = Decimal('500')
        assert result.profit_loss_brl.amount == expected_profit
        assert new_position.gross_profit_brl.amount == expected_profit
    
    def test_sell_more_than_available_raises_error(self):
        """Test that selling more shares than available raises error."""
        position = self.create_sample_position()  # Has 100 shares
        
        operation = TradeOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(150),  # Try to sell 150
            price_per_share_usd=Money(Decimal('12'), 'USD')
        )
        
        exchange_rate = self.create_sample_exchange_rate()
        
        with pytest.raises(ValueError, match="Cannot sell 150 shares, only 100 available"):
            operation.execute(position, exchange_rate)
    
    def test_sell_from_empty_position_raises_error(self):
        """Test that selling from empty position raises error."""
        empty_position = PortfolioPosition(
            quantity=StockQuantity(0),
            total_cost_usd=Money(Decimal('0'), 'USD'),
            total_cost_brl=Money(Decimal('0'), 'BRL'),
            average_price_usd=Money(Decimal('0'), 'USD'),
            average_price_brl=Money(Decimal('0'), 'BRL'),
            gross_profit_brl=ProfitLoss(Decimal('0'), 'BRL'),
            last_updated=datetime(2024, 1, 1)
        )
        
        operation = TradeOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(10),
            price_per_share_usd=Money(Decimal('12'), 'USD')
        )
        
        exchange_rate = self.create_sample_exchange_rate()
        
        with pytest.raises(ValueError, match="Cannot sell 10 shares, only 0 available"):
            operation.execute(empty_position, exchange_rate)
