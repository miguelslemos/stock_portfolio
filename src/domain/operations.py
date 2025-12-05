"""
Domain operations representing business actions.

This module contains the operations that can be performed on a stock portfolio,
following the Command pattern and implementing business rules.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional
import logging

from .entities import Money, StockQuantity, PortfolioPosition, OperationResult, ExchangeRate, ProfitLoss

logger = logging.getLogger(__name__)


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
    _settlement_date: Optional[datetime] = field(default=None, repr=False)

    def __post_init__(self):
        if self.price_per_share_usd.currency != 'USD':
            raise ValueError("Vesting price must be in USD")
    
    @property
    def settlement_date(self) -> datetime:
        """Get settlement date, defaulting to date if not explicitly set."""
        return self._settlement_date if self._settlement_date is not None else self.date

    def execute(self, current_position: PortfolioPosition, exchange_rate: ExchangeRate) -> OperationResult:
        """Execute vesting operation following average cost method."""
        logger.debug(f"=" * 80)
        logger.debug(f"VESTING OPERATION - {self.date.strftime('%Y-%m-%d')}")
        logger.debug(f"=" * 80)
        logger.debug(f"Quantity: +{self.quantity.value} shares @ ${self.price_per_share_usd.amount:.4f} USD")
        
        # Calculate costs for this vesting
        vesting_cost_usd = Money(
            self.price_per_share_usd.amount * self.quantity.value,
            'USD'
        )
        logger.debug(f"Vesting cost USD: ${self.price_per_share_usd.amount:.4f} x {self.quantity.value} = ${vesting_cost_usd.amount:.4f} USD")
        
        # Log exchange rate details
        logger.debug(f"")
        logger.debug(f"CONVERSION USD -> BRL (using bid rate for cost):")
        if exchange_rate.bid_rate:
            logger.debug(f"  Bid rate (buy): {exchange_rate.bid_rate:.6f} <- USING THIS")
        if exchange_rate.ask_rate:
            logger.debug(f"  Ask rate (sell): {exchange_rate.ask_rate:.6f}")
        
        vesting_cost_brl = exchange_rate.convert(vesting_cost_usd, use_bid=True)
        
        logger.debug(f"  Calculation: ${vesting_cost_usd.amount:.4f} USD x {exchange_rate.bid_rate:.6f} = R${vesting_cost_brl.amount:.4f} BRL")
        logger.debug(f"Vesting cost BRL: R${vesting_cost_brl.amount:.4f}")

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
            new_total_cost_usd.amount * exchange_rate.bid_rate,
            'BRL'
        )

        logger.debug(f"")
        logger.debug(f"POSITION UPDATE:")
        logger.debug(f"  Previous: {current_position.quantity.value} shares, Avg: ${current_position.average_price_usd.amount:.4f} USD / R${current_position.average_price_brl.amount:.4f} BRL")
        logger.debug(f"  New:      {new_quantity.value} shares, Avg: ${new_avg_price_usd.amount:.4f} USD / R${new_avg_price_brl.amount:.4f} BRL")
        logger.debug(f"  Total cost: ${new_total_cost_usd.amount:.4f} USD = R${new_total_cost_brl.amount:.4f} BRL")
        logger.debug(f"  Gross profit: R${current_position.gross_profit_brl.amount:.4f} BRL (unchanged - no P&L on vesting)")
        logger.debug(f"")
        
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
    _settlement_date: Optional[datetime] = field(default=None, repr=False)

    def __post_init__(self):
        if self.price_per_share_usd.currency != 'USD':
            raise ValueError("Trade price must be in USD")
    
    @property
    def settlement_date(self) -> datetime:
        """Get settlement date, defaulting to date if not explicitly set."""
        return self._settlement_date if self._settlement_date is not None else self.date

    def execute(self, current_position: PortfolioPosition, exchange_rate: ExchangeRate) -> OperationResult:
        """Execute trade operation following average cost method."""
        logger.debug(f"=" * 80)
        logger.debug(f"TRADE OPERATION - Trade Date: {self.date.strftime('%Y-%m-%d')}, Settlement Date: {self.settlement_date.strftime('%Y-%m-%d')}")
        logger.debug(f"=" * 80)
        logger.debug(f"Selling: {self.quantity.value} shares @ ${self.price_per_share_usd.amount:.4f} USD per share")
        logger.debug(f"Current position: {current_position.quantity.value} shares")
        
        if self.quantity.value > current_position.quantity.value:
            raise ValueError(
                f"Cannot sell {self.quantity.value} shares, only {current_position.quantity.value} available"
            )

        # Calculate fraction of position being sold
        if current_position.quantity.value == 0:
            raise ValueError("Cannot sell from empty portfolio")
        
        fraction_sold = Decimal(self.quantity.value) / Decimal(current_position.quantity.value)
        logger.debug(f"Fraction sold: {fraction_sold * 100:.2f}%")

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
        logger.debug(f"")
        logger.debug(f"PROFIT/LOSS CALCULATION:")
        logger.debug(f"")
        logger.debug(f"1. SALE REVENUE (USD -> BRL):")
        sale_revenue_usd = Money(self.price_per_share_usd.amount * self.quantity.value, 'USD')
        logger.debug(f"   Sale revenue USD: ${self.price_per_share_usd.amount:.4f} x {self.quantity.value} = ${sale_revenue_usd.amount:.4f} USD")
        logger.debug(f"   Exchange rate info:")
        if exchange_rate.bid_rate:
            logger.debug(f"     - Bid rate (buy): {exchange_rate.bid_rate:.6f}")
        if exchange_rate.ask_rate:
            logger.debug(f"     - Ask rate (sell): {exchange_rate.ask_rate:.6f} <- USING THIS")
        
        sale_price_brl = exchange_rate.convert(sale_revenue_usd)
        
        logger.debug(f"   Conversion: ${sale_revenue_usd.amount:.4f} USD x {exchange_rate.ask_rate:.6f} = R${sale_price_brl.amount:.4f} BRL")
        logger.debug(f"   Sale revenue BRL: R${sale_price_brl.amount:.4f}")
        
        logger.debug(f"")
        logger.debug(f"2. COST BASIS (stored in USD):")
        logger.debug(f"   Average price USD: ${current_position.average_price_usd.amount:.4f} per share")
        logger.debug(f"   Quantity sold: {self.quantity.value} shares")
        cost_basis_usd = Money(
            current_position.average_price_usd.amount * self.quantity.value,
            'USD'
        )
        logger.debug(f"   Cost basis: ${current_position.average_price_usd.amount:.4f} x {self.quantity.value} = ${cost_basis_usd.amount:.4f} USD")
        
        logger.debug(f"")
        logger.debug(f"3. COST BASIS (stored in BRL):")
        logger.debug(f"   Quantity sold: {self.quantity.value} shares")
        cost_basis_brl = Money(
            cost_basis_usd.amount * exchange_rate.bid_rate,
            'BRL'
        )
        logger.debug(f"   Cost basis: ${cost_basis_brl.amount:.4f} BRL = ${cost_basis_usd.amount:.4f} USD x {exchange_rate.bid_rate:.6f}")
        
        
        logger.debug(f"")
        logger.debug(f"4. PROFIT/LOSS:")
        profit_loss_brl = ProfitLoss(sale_price_brl.amount - cost_basis_brl.amount, 'BRL')
        logger.debug(f"   Sale revenue:  R${sale_price_brl.amount:.4f} BRL")
        logger.debug(f"   Cost basis:    R${cost_basis_brl.amount:.4f} BRL")
        logger.debug(f"   Profit/Loss:   R${profit_loss_brl.amount:.4f} BRL")
        
        new_gross_profit_brl = ProfitLoss(
            current_position.gross_profit_brl.amount + profit_loss_brl.amount,
            'BRL'
        )
        
        logger.debug(f"")
        logger.debug(f"4. GROSS PROFIT UPDATE:")
        logger.debug(f"   Previous gross profit: R${current_position.gross_profit_brl.amount:.4f} BRL")
        logger.debug(f"   This trade P&L:        R${profit_loss_brl.amount:.4f} BRL")
        logger.debug(f"   New gross profit:      R${new_gross_profit_brl.amount:.4f} BRL")

        logger.debug(f"")
        logger.debug(f"5. POSITION UPDATE:")
        logger.debug(f"   Previous position: {current_position.quantity.value} shares")
        logger.debug(f"   Shares sold:       {self.quantity.value} shares")
        logger.debug(f"   New position:      {new_quantity.value} shares")
        logger.debug(f"   Remaining cost:    ${new_total_cost_usd.amount:.4f} USD = R${new_total_cost_brl.amount:.4f} BRL")
        logger.debug(f"   Average prices remain: ${new_avg_price_usd.amount:.4f} USD / R${new_avg_price_brl.amount:.4f} BRL")
        logger.debug(f"=" * 80)
        logger.debug(f"")
        
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
