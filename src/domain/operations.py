"""
Domain operations representing business actions.

This module contains the operations that can be performed on a stock portfolio,
following the Command pattern and implementing business rules.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from .entities import Money, StockQuantity, PortfolioPosition, OperationResult, ExchangeRate, ProfitLoss


class PortfolioOperation(ABC):
    """Abstract base class for all portfolio operations."""
    
    @abstractmethod
    def execute(self, current_position: PortfolioPosition, exchange_rate: ExchangeRate) -> OperationResult:
        """Execute the operation and return the new portfolio state."""
        pass

    @abstractmethod
    def get_date(self) -> datetime:
        """Get the date when this operation occurred."""
        pass

    @abstractmethod
    def get_description(self) -> str:
        """Get a human-readable description of this operation."""
        pass


@dataclass(frozen=True)
class VestingOperation(PortfolioOperation):
    """
    Represents a vesting operation (stock grant).
    
    This operation adds shares to the portfolio at a specific price,
    increasing both quantity and total cost proportionally.
    """
    date: datetime
    quantity: StockQuantity
    price_per_share_usd: Money

    def __post_init__(self):
        if self.price_per_share_usd.currency != 'USD':
            raise ValueError("Vesting price must be in USD")

    def execute(self, current_position: PortfolioPosition, exchange_rate: ExchangeRate) -> OperationResult:
        """Execute vesting operation following average cost method."""
        # Calculate costs for this vesting
        vesting_cost_usd = Money(
            self.price_per_share_usd.amount * self.quantity.value,
            'USD'
        )
        vesting_cost_brl = exchange_rate.convert(vesting_cost_usd)

        # Calculate new totals
        new_quantity = StockQuantity(current_position.quantity.value + self.quantity.value)
        new_total_cost_usd = Money(
            current_position.total_cost_usd.amount + vesting_cost_usd.amount,
            'USD'
        )
        new_total_cost_brl = Money(
            current_position.total_cost_brl.amount + vesting_cost_brl.amount,
            'BRL'
        )

        # Calculate new average prices
        new_avg_price_usd = Money(
            new_total_cost_usd.amount / new_quantity.value if new_quantity.value > 0 else Decimal('0'),
            'USD'
        )
        new_avg_price_brl = Money(
            new_total_cost_brl.amount / new_quantity.value if new_quantity.value > 0 else Decimal('0'),
            'BRL'
        )

        new_position = PortfolioPosition(
            quantity=new_quantity,
            total_cost_usd=new_total_cost_usd,
            total_cost_brl=new_total_cost_brl,
            average_price_usd=new_avg_price_usd,
            average_price_brl=new_avg_price_brl,
            gross_profit_brl=current_position.gross_profit_brl,  # No profit/loss on vesting
            last_updated=self.date,
            operation_quantity=self.quantity,
            operation_type='vesting'
        )

        return OperationResult(new_position=new_position)

    def get_date(self) -> datetime:
        return self.date

    def get_description(self) -> str:
        return f"Vesting: +{self.quantity.value} shares at ${self.price_per_share_usd.amount:.4f}"


@dataclass(frozen=True)
class TradeOperation(PortfolioOperation):
    """
    Represents a trade operation (stock sale).
    
    This operation removes shares from the portfolio at a specific price,
    reducing both quantity and total cost proportionally and calculating profit/loss.
    """
    date: datetime
    quantity: StockQuantity
    price_per_share_usd: Money

    def __post_init__(self):
        if self.price_per_share_usd.currency != 'USD':
            raise ValueError("Trade price must be in USD")

    def execute(self, current_position: PortfolioPosition, exchange_rate: ExchangeRate) -> OperationResult:
        """Execute trade operation following average cost method."""
        if self.quantity.value > current_position.quantity.value:
            raise ValueError(
                f"Cannot sell {self.quantity.value} shares, only {current_position.quantity.value} available"
            )

        # Calculate fraction of position being sold
        if current_position.quantity.value == 0:
            raise ValueError("Cannot sell from empty portfolio")
        
        fraction_sold = Decimal(self.quantity.value) / Decimal(current_position.quantity.value)

        # Calculate new quantities and costs (proportional reduction)
        new_quantity = StockQuantity(current_position.quantity.value - self.quantity.value)
        new_total_cost_usd = Money(
            current_position.total_cost_usd.amount * (Decimal('1') - fraction_sold),
            'USD'
        )
        new_total_cost_brl = Money(
            current_position.total_cost_brl.amount * (Decimal('1') - fraction_sold),
            'BRL'
        )

        # Average prices remain the same with proportional cost method
        new_avg_price_usd = current_position.average_price_usd
        new_avg_price_brl = current_position.average_price_brl

        # Calculate profit/loss in BRL
        # Sale price uses ask rate (venda)
        sale_price_brl = exchange_rate.convert(
            Money(self.price_per_share_usd.amount * self.quantity.value, 'USD'),
            use_bid=False
        )
        
        # Cost basis: recalculate using bid rate (compra) for more accurate profit calculation
        # The original cost was in USD, so we convert it using bid rate
        cost_basis_usd = Money(
            current_position.average_price_usd.amount * self.quantity.value,
            'USD'
        )
        cost_basis_brl = exchange_rate.convert(cost_basis_usd, use_bid=True)
        
        profit_loss_brl = ProfitLoss(sale_price_brl.amount - cost_basis_brl.amount, 'BRL')
        
        new_gross_profit_brl = ProfitLoss(
            current_position.gross_profit_brl.amount + profit_loss_brl.amount,
            'BRL'
        )

        new_position = PortfolioPosition(
            quantity=new_quantity,
            total_cost_usd=new_total_cost_usd,
            total_cost_brl=new_total_cost_brl,
            average_price_usd=new_avg_price_usd,
            average_price_brl=new_avg_price_brl,
            gross_profit_brl=new_gross_profit_brl,
            last_updated=self.date,
            operation_quantity=self.quantity,
            operation_type='trade'
        )

        return OperationResult(new_position=new_position, profit_loss_brl=profit_loss_brl)

    def get_date(self) -> datetime:
        return self.date

    def get_description(self) -> str:
        return f"Trade: -{self.quantity.value} shares at ${self.price_per_share_usd.amount:.4f}"
