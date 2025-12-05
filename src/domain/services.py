"""
Domain services implementing complex business logic.

This module contains services that implement business logic that doesn't
naturally fit into a single entity or operation.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional

from .entities import ExchangeRate, PortfolioPosition, Money, StockQuantity, ProfitLoss
from .operations import PortfolioOperation


class ExchangeRateService(ABC):
    """Abstract service for retrieving exchange rates."""
    
    @abstractmethod
    def get_rate(self, from_currency: str, to_currency: str, date: datetime) -> Optional[ExchangeRate]:
        """Get exchange rate for a specific date."""
        pass


class PortfolioCalculationService:
    """
    Service for performing portfolio calculations and operations.
    
    This service orchestrates the execution of portfolio operations
    and maintains business rules consistency.
    """
    
    def __init__(self, exchange_rate_service: ExchangeRateService):
        self._exchange_rate_service = exchange_rate_service
    
    def create_empty_position(self, date: datetime) -> PortfolioPosition:
        """Create an empty portfolio position."""
        return PortfolioPosition(
            quantity=StockQuantity(0),
            total_cost_usd=Money(0, 'USD'),
            total_cost_brl=Money(0, 'BRL'),
            average_price_usd=Money(0, 'USD'),
            average_price_brl=Money(0, 'BRL'),
            gross_profit_brl=ProfitLoss(0, 'BRL'),
            last_updated=date,
            operation_quantity=None,
            operation_type=None
        )
    
    def execute_operations(
        self, 
        operations: List[PortfolioOperation], 
        initial_position: Optional[PortfolioPosition] = None
    ) -> List[PortfolioPosition]:
        """
        Execute a sequence of operations and return position history.
        
        Args:
            operations: List of operations to execute in chronological order
            initial_position: Starting position (if None, starts with empty position)
            
        Returns:
            List of portfolio positions after each operation
        """
        if not operations:
            return []
        
        # Sort operations by date to ensure chronological processing
        sorted_operations = sorted(operations, key=lambda op: op.get_date())
        
        # Start with initial position or empty position
        if initial_position is None:
            current_position = self.create_empty_position(sorted_operations[0].get_date())
        else:
            current_position = initial_position
            # Check if we need to reset profit for the first operation if it's in a different year
            first_operation_date = sorted_operations[0].get_date()
            if first_operation_date.year > current_position.last_updated.year:
                current_position = self._reset_gross_profit_for_new_year(current_position, first_operation_date)
        
        positions = []
        
        for operation in sorted_operations:
            # Check if we need to reset gross_profit_brl for a new year
            operation_date = operation.get_date()
            if positions and operation_date.year > current_position.last_updated.year:
                # Reset gross profit at the beginning of a new year
                current_position = self._reset_gross_profit_for_new_year(current_position, operation_date)
            
            # Get exchange rate for the operation date
            exchange_rate = self._get_exchange_rate_for_operation(operation)
            
            # Execute the operation
            result = operation.execute(current_position, exchange_rate)
            current_position = result.new_position
            
            positions.append(current_position)
        
        return positions
    
    def _reset_gross_profit_for_new_year(self, current_position: PortfolioPosition, new_year_date: datetime) -> PortfolioPosition:
        """
        Reset gross_profit_brl to zero for the beginning of a new fiscal year.
        
        Args:
            current_position: Current portfolio position
            new_year_date: Date of the first operation in the new year
            
        Returns:
            New position with reset gross profit
        """
        return PortfolioPosition(
            quantity=current_position.quantity,
            total_cost_usd=current_position.total_cost_usd,
            total_cost_brl=current_position.total_cost_brl,
            average_price_usd=current_position.average_price_usd,
            average_price_brl=current_position.average_price_brl,
            gross_profit_brl=ProfitLoss(0, 'BRL'),  # Reset to zero for new year
            last_updated=current_position.last_updated,  # Keep original date until next operation
            operation_quantity=current_position.operation_quantity,
            operation_type=current_position.operation_type
        )
    
    def _get_exchange_rate_for_operation(self, operation: PortfolioOperation) -> ExchangeRate:
        """Get exchange rate for an operation, with fallback logic."""
        # Use settlement_date if available, otherwise use the operation date
        if hasattr(operation, 'settlement_date') and operation.settlement_date is not None:
            operation_date = operation.settlement_date
        else:
            operation_date = operation.get_date()
        
        # Try to get rate for the exact date, with fallback up to 7 days back
        for days_back in range(8):  # 0 to 7 days back
            try_date = operation_date.replace(
                day=operation_date.day - days_back
            ) if days_back > 0 else operation_date
            
            rate = self._exchange_rate_service.get_rate('USD', 'BRL', try_date)
            if rate is not None:
                return rate
        
        raise ValueError(f"Could not find USD/BRL exchange rate for {operation_date} (tried 7 days back)")


class PortfolioAnalyticsService:
    """Service for portfolio analytics and reporting."""
    
    def calculate_total_return_brl(self, positions: List[PortfolioPosition]) -> ProfitLoss:
        """Calculate total return in BRL from a series of positions."""
        if not positions:
            return ProfitLoss(0, 'BRL')
        
        return positions[-1].gross_profit_brl
    
    def calculate_position_value_brl(
        self, 
        position: PortfolioPosition, 
        current_price_usd: Money, 
        exchange_rate: ExchangeRate
    ) -> Money:
        """Calculate current market value of position in BRL."""
        if position.is_empty:
            return Money(0, 'BRL')
        
        market_value_usd = Money(
            current_price_usd.amount * position.quantity.value,
            'USD'
        )
        return exchange_rate.convert(market_value_usd)
    
    def calculate_unrealized_gain_loss_brl(
        self, 
        position: PortfolioPosition, 
        current_price_usd: Money, 
        exchange_rate: ExchangeRate
    ) -> Money:
        """Calculate unrealized gain/loss in BRL."""
        if position.is_empty:
            return Money(0, 'BRL')
        
        current_value = self.calculate_position_value_brl(position, current_price_usd, exchange_rate)
        return Money(current_value.amount - position.total_cost_brl.amount, 'BRL')
