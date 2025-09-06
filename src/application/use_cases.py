"""
Application use cases implementing business workflows.

This module contains the use cases that orchestrate the business logic
and coordinate between different domain services and external dependencies.
"""

from dataclasses import dataclass
from typing import List, Optional, Protocol
from datetime import datetime

from ..domain.entities import PortfolioPosition, Money, StockQuantity, ProfitLoss
from ..domain.operations import PortfolioOperation, VestingOperation, TradeOperation
from ..domain.services import PortfolioCalculationService, PortfolioAnalyticsService


class OperationRepository(Protocol):
    """Protocol for operation data access."""
    
    def get_all_operations(self) -> List[PortfolioOperation]:
        """Retrieve all operations."""
        pass


class PortfolioReportingService(Protocol):
    """Protocol for portfolio reporting."""
    
    def generate_portfolio_report(self, positions: List[PortfolioPosition]) -> None:
        """Generate and display portfolio report."""
        pass


class DataExportService(Protocol):
    """Protocol for data export functionality."""
    
    def export_portfolio_data(self, positions: List[PortfolioPosition]) -> None:
        """Export portfolio data to external format."""
        pass


@dataclass
class ProcessPortfolioRequest:
    """Request object for processing portfolio operations."""
    initial_position: Optional[PortfolioPosition] = None
    include_reporting: bool = True
    export_data: bool = False


@dataclass
class ProcessPortfolioResponse:
    """Response object containing portfolio processing results."""
    final_position: PortfolioPosition
    position_history: List[PortfolioPosition]
    total_operations: int
    total_return_brl: ProfitLoss


class ProcessPortfolioUseCase:
    """
    Use case for processing portfolio operations.
    
    This use case orchestrates the complete workflow of:
    1. Loading operations from data source
    2. Executing operations chronologically
    3. Generating reports (optional)
    4. Exporting data (optional)
    """
    
    def __init__(
        self,
        operation_repository: OperationRepository,
        calculation_service: PortfolioCalculationService,
        analytics_service: PortfolioAnalyticsService,
        reporting_service: Optional[PortfolioReportingService] = None,
        export_service: Optional[DataExportService] = None
    ):
        self._operation_repository = operation_repository
        self._calculation_service = calculation_service
        self._analytics_service = analytics_service
        self._reporting_service = reporting_service
        self._export_service = export_service
    
    def execute(self, request: ProcessPortfolioRequest) -> ProcessPortfolioResponse:
        """Execute the portfolio processing use case."""
        # 1. Load all operations
        operations = self._operation_repository.get_all_operations()
        
        if not operations:
            # Handle empty case
            empty_position = self._calculation_service.create_empty_position(datetime.now())
            return ProcessPortfolioResponse(
                final_position=empty_position,
                position_history=[],
                total_operations=0,
                total_return_brl=ProfitLoss(0, 'BRL')
            )
        
        # 2. Execute operations chronologically
        position_history = self._calculation_service.execute_operations(
            operations, 
            request.initial_position
        )
        
        final_position = position_history[-1] if position_history else request.initial_position
        
        # 3. Calculate analytics
        total_return = self._analytics_service.calculate_total_return_brl(position_history)
        
        # 4. Generate reports if requested
        if request.include_reporting and self._reporting_service:
            self._reporting_service.generate_portfolio_report(position_history)
        
        # 5. Export data if requested
        if request.export_data and self._export_service:
            self._export_service.export_portfolio_data(position_history)
        
        return ProcessPortfolioResponse(
            final_position=final_position,
            position_history=position_history,
            total_operations=len(operations),
            total_return_brl=total_return
        )


@dataclass
class CreateOperationRequest:
    """Request for creating a new operation."""
    operation_type: str  # 'vesting' or 'trade'
    date: datetime
    quantity: int
    price_usd: float


class CreateOperationUseCase:
    """Use case for creating and validating new operations."""
    
    def execute(self, request: CreateOperationRequest) -> PortfolioOperation:
        """Create a new portfolio operation from request data."""
        quantity = StockQuantity(request.quantity)
        price = Money(request.price_usd, 'USD')
        
        if request.operation_type.lower() == 'vesting':
            return VestingOperation(
                date=request.date,
                quantity=quantity,
                price_per_share_usd=price
            )
        elif request.operation_type.lower() == 'trade':
            return TradeOperation(
                date=request.date,
                quantity=quantity,
                price_per_share_usd=price
            )
        else:
            raise ValueError(f"Unsupported operation type: {request.operation_type}")


class CalculatePortfolioValueUseCase:
    """Use case for calculating current portfolio value."""
    
    def __init__(
        self,
        calculation_service: PortfolioCalculationService,
        analytics_service: PortfolioAnalyticsService
    ):
        self._calculation_service = calculation_service
        self._analytics_service = analytics_service
    
    def execute(
        self, 
        position: PortfolioPosition, 
        current_price_usd: Money
    ) -> dict:
        """Calculate current portfolio metrics."""
        # This would need current exchange rate - simplified for example
        # In real implementation, would use exchange rate service
        
        return {
            'quantity': position.quantity.value,
            'average_cost_usd': position.average_price_usd.amount,
            'average_cost_brl': position.average_price_brl.amount,
            'total_cost_usd': position.total_cost_usd.amount,
            'total_cost_brl': position.total_cost_brl.amount,
            'realized_profit_brl': position.gross_profit_brl.amount,
            'current_price_usd': current_price_usd.amount
        }
