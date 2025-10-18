"""
Tests for domain entities.

This module contains unit tests for the core domain entities
to ensure they behave correctly according to business rules.
"""

import pytest
from decimal import Decimal
from datetime import datetime

from src.domain.entities import Money, StockQuantity, ExchangeRate, PortfolioPosition


class TestMoney:
    """Test cases for Money value object."""
    
    def test_create_valid_money(self):
        """Test creating valid money instances."""
        money = Money(Decimal('100.50'), 'USD')
        assert money.amount == Decimal('100.50')
        assert money.currency == 'USD'
    
    def test_money_string_representation(self):
        """Test string representation of money."""
        money = Money(Decimal('1234.5678'), 'BRL')
        assert str(money) == '1234.5678 BRL'
    
    def test_negative_amount_raises_error(self):
        """Test that negative amounts raise ValueError."""
        with pytest.raises(ValueError, match="Money amount cannot be negative"):
            Money(Decimal('-10'), 'USD')
    
    def test_empty_currency_raises_error(self):
        """Test that empty currency raises ValueError."""
        with pytest.raises(ValueError, match="Currency is required"):
            Money(Decimal('100'), '')
    
    def test_zero_amount_is_valid(self):
        """Test that zero amount is valid."""
        money = Money(Decimal('0'), 'USD')
        assert money.amount == Decimal('0')


class TestStockQuantity:
    """Test cases for StockQuantity value object."""
    
    def test_create_valid_quantity(self):
        """Test creating valid stock quantity."""
        quantity = StockQuantity(100)
        assert quantity.value == 100
    
    def test_quantity_string_representation(self):
        """Test string representation of quantity."""
        quantity = StockQuantity(250)
        assert str(quantity) == '250'
    
    def test_negative_quantity_raises_error(self):
        """Test that negative quantities raise ValueError."""
        with pytest.raises(ValueError, match="Stock quantity cannot be negative"):
            StockQuantity(-10)
    
    def test_zero_quantity_is_valid(self):
        """Test that zero quantity is valid."""
        quantity = StockQuantity(0)
        assert quantity.value == 0


class TestExchangeRate:
    """Test cases for ExchangeRate value object."""
    
    def test_create_valid_exchange_rate(self):
        """Test creating valid exchange rate."""
        rate = ExchangeRate('USD', 'BRL', Decimal('5.25'), datetime(2024, 1, 1))
        assert rate.from_currency == 'USD'
        assert rate.to_currency == 'BRL'
        assert rate.rate == Decimal('5.25')
    
    def test_zero_rate_raises_error(self):
        """Test that zero rate raises ValueError."""
        with pytest.raises(ValueError, match="Exchange rate must be positive"):
            ExchangeRate('USD', 'BRL', Decimal('0'), datetime(2024, 1, 1))
    
    def test_negative_rate_raises_error(self):
        """Test that negative rate raises ValueError."""
        with pytest.raises(ValueError, match="Exchange rate must be positive"):
            ExchangeRate('USD', 'BRL', Decimal('-1'), datetime(2024, 1, 1))
    
    def test_convert_money(self):
        """Test currency conversion."""
        rate = ExchangeRate('USD', 'BRL', Decimal('5.0'), datetime(2024, 1, 1))
        usd_money = Money(Decimal('100'), 'USD')
        
        brl_money = rate.convert(usd_money)
        
        assert brl_money.amount == Decimal('500')
        assert brl_money.currency == 'BRL'
    
    def test_convert_wrong_currency_raises_error(self):
        """Test that converting wrong currency raises error."""
        rate = ExchangeRate('USD', 'BRL', Decimal('5.0'), datetime(2024, 1, 1))
        eur_money = Money(Decimal('100'), 'EUR')
        
        with pytest.raises(ValueError, match="Cannot convert EUR using USD/BRL rate"):
            rate.convert(eur_money)


class TestPortfolioPosition:
    """Test cases for PortfolioPosition entity."""
    
    def create_sample_position(self):
        """Create a sample portfolio position for testing."""
        return PortfolioPosition(
            quantity=StockQuantity(100),
            total_cost_usd=Money(Decimal('1000'), 'USD'),
            total_cost_brl=Money(Decimal('5000'), 'BRL'),
            average_price_usd=Money(Decimal('10'), 'USD'),
            average_price_brl=Money(Decimal('50'), 'BRL'),
            gross_profit_brl=Money(Decimal('0'), 'BRL'),
            last_updated=datetime(2024, 1, 1)
        )
    
    def test_create_valid_position(self):
        """Test creating valid portfolio position."""
        position = self.create_sample_position()
        assert position.quantity.value == 100
        assert position.total_cost_usd.amount == Decimal('1000')
    
    def test_empty_position_detection(self):
        """Test empty position detection."""
        empty_position = PortfolioPosition(
            quantity=StockQuantity(0),
            total_cost_usd=Money(Decimal('0'), 'USD'),
            total_cost_brl=Money(Decimal('0'), 'BRL'),
            average_price_usd=Money(Decimal('0'), 'USD'),
            average_price_brl=Money(Decimal('0'), 'BRL'),
            gross_profit_brl=Money(Decimal('0'), 'BRL'),
            last_updated=datetime(2024, 1, 1)
        )
        
        assert empty_position.is_empty
        
        non_empty_position = self.create_sample_position()
        assert not non_empty_position.is_empty
    
    def test_calculate_average_price_usd(self):
        """Test calculating average price in USD."""
        position = self.create_sample_position()
        avg_price = position.calculate_average_price('USD')
        
        assert avg_price.amount == Decimal('10')
        assert avg_price.currency == 'USD'
    
    def test_calculate_average_price_brl(self):
        """Test calculating average price in BRL."""
        position = self.create_sample_position()
        avg_price = position.calculate_average_price('BRL')
        
        assert avg_price.amount == Decimal('50')
        assert avg_price.currency == 'BRL'
    
    def test_calculate_average_price_empty_position(self):
        """Test calculating average price for empty position."""
        empty_position = PortfolioPosition(
            quantity=StockQuantity(0),
            total_cost_usd=Money(Decimal('0'), 'USD'),
            total_cost_brl=Money(Decimal('0'), 'BRL'),
            average_price_usd=Money(Decimal('0'), 'USD'),
            average_price_brl=Money(Decimal('0'), 'BRL'),
            gross_profit_brl=Money(Decimal('0'), 'BRL'),
            last_updated=datetime(2024, 1, 1)
        )
        
        avg_price = empty_position.calculate_average_price('USD')
        assert avg_price.amount == Decimal('0')
        assert avg_price.currency == 'USD'
    
    def test_unsupported_currency_raises_error(self):
        """Test that unsupported currency raises error."""
        position = self.create_sample_position()
        
        with pytest.raises(ValueError, match="Unsupported currency: EUR"):
            position.calculate_average_price('EUR')
