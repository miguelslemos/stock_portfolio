"""
Domain entities representing core business concepts.

This module contains the fundamental business entities that represent
the core concepts of the stock portfolio management system.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Optional


@dataclass(frozen=True)
class Money:
    """Value object representing a monetary amount with currency."""
    amount: Decimal
    currency: str

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("Money amount cannot be negative")
        if not self.currency:
            raise ValueError("Currency is required")

    def __str__(self) -> str:
        return f"{self.amount:.4f} {self.currency}"


@dataclass(frozen=True)
class ProfitLoss:
    """Value object representing profit or loss (can be negative)."""
    amount: Decimal
    currency: str

    def __post_init__(self):
        if not self.currency:
            raise ValueError("Currency is required")

    def __str__(self) -> str:
        return f"{self.amount:.4f} {self.currency}"


@dataclass(frozen=True)
class StockQuantity:
    """Value object representing a quantity of stocks."""
    value: int

    def __post_init__(self):
        if self.value < 0:
            raise ValueError("Stock quantity cannot be negative")

    def __str__(self) -> str:
        return str(self.value)


@dataclass(frozen=True)
class ExchangeRate:
    """Value object representing an exchange rate between currencies."""
    from_currency: str
    to_currency: str
    rate: Decimal
    date: datetime
    bid_rate: Optional[Decimal] = None  # Buy rate (taxa de compra)
    ask_rate: Optional[Decimal] = None  # Sell rate (taxa de venda)

    def __post_init__(self):
        if self.rate <= 0:
            raise ValueError("Exchange rate must be positive")
        if self.bid_rate is not None and self.bid_rate <= 0:
            raise ValueError("Bid rate must be positive")
        if self.ask_rate is not None and self.ask_rate <= 0:
            raise ValueError("Ask rate must be positive")

    def convert(self, amount: Money, use_bid: bool = False) -> Money:
        """
        Convert money from one currency to another.
        
        Args:
            amount: Amount to convert
            use_bid: If True, use bid_rate (buy rate). If False, use ask_rate or default rate.
        """
        if amount.currency != self.from_currency:
            raise ValueError(f"Cannot convert {amount.currency} using {self.from_currency}/{self.to_currency} rate")
        
        # Choose the appropriate rate
        if use_bid and self.bid_rate is not None:
            conversion_rate = self.bid_rate
        elif not use_bid and self.ask_rate is not None:
            conversion_rate = self.ask_rate
        else:
            conversion_rate = self.rate
        
        converted_amount = amount.amount * conversion_rate
        return Money(converted_amount, self.to_currency)


@dataclass(frozen=True)
class PortfolioPosition:
    """Entity representing the current position in a portfolio."""
    quantity: StockQuantity
    total_cost_usd: Money
    total_cost_brl: Money
    average_price_usd: Money
    average_price_brl: Money
    gross_profit_brl: ProfitLoss
    last_updated: datetime
    operation_quantity: Optional[StockQuantity] = None  # Quantity of the operation that created this position
    operation_type: Optional[str] = None  # Type of operation: 'vesting' or 'trade'

    @property
    def is_empty(self) -> bool:
        """Check if the portfolio position is empty."""
        return self.quantity.value == 0

    def calculate_average_price(self, currency: str) -> Money:
        """Calculate average price per share in the specified currency."""
        if self.is_empty:
            return Money(Decimal('0'), currency)
        
        if currency == 'USD':
            avg_amount = self.total_cost_usd.amount / self.quantity.value
            return Money(avg_amount, 'USD')
        elif currency == 'BRL':
            avg_amount = self.total_cost_brl.amount / self.quantity.value
            return Money(avg_amount, 'BRL')
        else:
            raise ValueError(f"Unsupported currency: {currency}")


@dataclass(frozen=True)
class OperationResult:
    """Value object representing the result of a portfolio operation."""
    new_position: PortfolioPosition
    profit_loss_brl: Optional[ProfitLoss] = None

    @property
    def has_profit_loss(self) -> bool:
        """Check if this operation generated profit or loss."""
        return self.profit_loss_brl is not None
