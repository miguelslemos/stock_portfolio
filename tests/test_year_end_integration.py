"""
Integration tests for year-end reset functionality.

This module contains integration tests that verify the year-end reset
functionality works correctly with the complete application workflow,
including use cases, export functionality, and reporting.
"""

import pytest
import tempfile
import os
from datetime import datetime
from decimal import Decimal

from src.domain.entities import Money, StockQuantity
from src.domain.operations import VestingOperation, TradeOperation
from src.domain.services import PortfolioCalculationService, PortfolioAnalyticsService
from src.application.use_cases import ProcessPortfolioUseCase, ProcessPortfolioRequest
from src.infrastructure.exchange_rate import MockExchangeRateService
from src.application.use_cases import OperationRepository
from src.infrastructure.export import CSVExporter, XLSXExporter
from src.infrastructure.presentation import ConsolePortfolioReporter


class InMemoryOperationRepository(OperationRepository):
    """In-memory repository for testing purposes."""
    
    def __init__(self):
        self._operations = []
    
    def add_operation(self, operation):
        """Add an operation to the repository."""
        self._operations.append(operation)
    
    def get_all_operations(self):
        """Return all operations."""
        return self._operations.copy()


class TestYearEndResetIntegration:
    """Integration tests for year-end reset functionality."""
    
    @pytest.fixture
    def multi_year_operations(self):
        """Create operations spanning multiple years for testing."""
        return [
            # 2022 - Initial year
            VestingOperation(
                date=datetime(2022, 3, 15),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('8.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2022, 9, 20),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2022, 11, 10),
                quantity=StockQuantity(20),
                price_per_share_usd=Money(Decimal('14.00'), 'USD')
            ),
            
            # 2023 - Second year (reset should happen)
            VestingOperation(
                date=datetime(2023, 1, 25),
                quantity=StockQuantity(75),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 5, 15),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('16.00'), 'USD')
            ),
            VestingOperation(
                date=datetime(2023, 8, 30),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('11.00'), 'USD')
            ),
            
            # 2024 - Third year (another reset)
            TradeOperation(
                date=datetime(2024, 2, 14),
                quantity=StockQuantity(35),
                price_per_share_usd=Money(Decimal('18.00'), 'USD')
            ),
            VestingOperation(
                date=datetime(2024, 6, 20),
                quantity=StockQuantity(60),
                price_per_share_usd=Money(Decimal('13.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 10, 5),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('20.00'), 'USD')
            ),
            
            # 2025 - Fourth year (final reset)
            VestingOperation(
                date=datetime(2025, 1, 10),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            )
        ]
    
    @pytest.fixture
    def use_case_setup(self, multi_year_operations):
        """Set up use case with multi-year operations."""
        # Create services
        exchange_service = MockExchangeRateService()
        calc_service = PortfolioCalculationService(exchange_service)
        analytics_service = PortfolioAnalyticsService()
        
        # Create repository with operations
        operation_repo = InMemoryOperationRepository()
        for operation in multi_year_operations:
            operation_repo.add_operation(operation)
        
        # Create use case
        use_case = ProcessPortfolioUseCase(
            operation_repository=operation_repo,
            calculation_service=calc_service,
            analytics_service=analytics_service
        )
        
        return use_case, operation_repo
    
    def test_complete_workflow_with_year_resets(self, use_case_setup):
        """Test complete portfolio workflow with year-end resets."""
        use_case, _ = use_case_setup
        
        # Execute use case
        request = ProcessPortfolioRequest(include_reporting=False, export_data=False)
        response = use_case.execute(request)
        
        # Verify response structure
        assert response.total_operations == 10
        assert len(response.position_history) == 10
        assert response.final_position is not None
        
        # Group positions by year
        positions_by_year = {}
        for position in response.position_history:
            year = position.last_updated.year
            if year not in positions_by_year:
                positions_by_year[year] = []
            positions_by_year[year].append(position)
        
        # Verify we have positions for all years
        assert set(positions_by_year.keys()) == {2022, 2023, 2024, 2025}
        
        # Test 2022 profit accumulation
        positions_2022 = positions_by_year[2022]
        assert positions_2022[0].gross_profit_brl.amount == Decimal('0')  # After vesting
        assert positions_2022[1].gross_profit_brl.amount > Decimal('0')   # After first trade
        assert positions_2022[2].gross_profit_brl.amount > positions_2022[1].gross_profit_brl.amount  # Accumulated
        final_2022_profit = positions_2022[2].gross_profit_brl.amount
        
        # Test 2023 reset and new accumulation
        positions_2023 = positions_by_year[2023]
        assert positions_2023[0].gross_profit_brl.amount == Decimal('0')  # Reset after vesting
        assert positions_2023[1].gross_profit_brl.amount > Decimal('0')   # New profit after trade
        assert positions_2023[2].gross_profit_brl.amount == positions_2023[1].gross_profit_brl.amount  # Vesting doesn't change
        final_2023_profit = positions_2023[2].gross_profit_brl.amount
        
        # Test 2024 reset and accumulation
        positions_2024 = positions_by_year[2024]
        # First operation is a trade, so profit should be reset and then new profit added
        assert positions_2024[0].gross_profit_brl.amount >= Decimal('0')  # Reset + new trade profit
        assert positions_2024[1].gross_profit_brl.amount == positions_2024[0].gross_profit_brl.amount  # Vesting
        assert positions_2024[2].gross_profit_brl.amount > positions_2024[1].gross_profit_brl.amount  # More profit
        final_2024_profit = positions_2024[2].gross_profit_brl.amount
        
        # Test 2025 reset
        positions_2025 = positions_by_year[2025]
        assert positions_2025[0].gross_profit_brl.amount == Decimal('0')  # Reset after vesting
        
        # Verify profits are independent between years
        assert final_2022_profit != final_2023_profit
        assert final_2023_profit != final_2024_profit
        assert final_2022_profit != final_2024_profit
        
        # Verify total return is only from the last year (2025)
        assert response.total_return_brl.amount == positions_2025[0].gross_profit_brl.amount
    
    def test_csv_export_with_year_resets(self, use_case_setup):
        """Test CSV export functionality with year-end resets."""
        use_case, _ = use_case_setup
        
        # Execute use case to get positions
        request = ProcessPortfolioRequest(include_reporting=False, export_data=False)
        response = use_case.execute(request)
        
        # Export to CSV
        with tempfile.TemporaryDirectory() as temp_dir:
            exporter = CSVExporter(temp_dir)
            exporter.export_portfolio_data(response.position_history)
            
            # Verify files were created
            portfolio_file = os.path.join(temp_dir, 'portfolio_history.csv')
            yearly_file = os.path.join(temp_dir, 'yearly_summary.csv')
            
            assert os.path.exists(portfolio_file)
            assert os.path.exists(yearly_file)
            
            # Read and verify portfolio history content
            with open(portfolio_file, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.strip().split('\n')
                
                # Should have header + 10 data lines
                assert len(lines) == 11
                
                # Verify header includes new columns
                header = lines[0]
                assert 'Operation Description' in header
                assert 'Operation Quantity' in header
                assert 'Final Quantity' in header
                assert 'Gross Profit BRL' in header
                
                # Verify data lines have year resets
                data_lines = lines[1:]
                
                # Parse gross profit values
                gross_profits = []
                years = []
                for line in data_lines:
                    fields = line.split(',')
                    date_str = fields[0]  # DD/MM/YYYY format
                    year = int(date_str.split('/')[-1])
                    # Parse profit from formatted string (e.g., "1250.0000 BRL" -> 1250.0)
                    gross_profit_str = fields[-1]  # Last column
                    gross_profit = float(gross_profit_str.split()[0])  # Split by space and take the numeric part
                    years.append(year)
                    gross_profits.append(gross_profit)
                
                # Verify year transitions show resets
                prev_year = None
                for i, (year, profit) in enumerate(zip(years, gross_profits)):
                    if prev_year is not None and year > prev_year:
                        # This is a year transition
                        # The profit should be reset (either 0 for vesting or new value for trade)
                        # It should NOT be the same as the previous year's final profit
                        if i > 0:
                            # Check that we're not carrying over the previous year's profit
                            prev_profit = gross_profits[i-1]
                            if profit > 0:  # If it's a trade operation
                                assert profit != prev_profit, f"Profit should reset at year transition, but {profit} == {prev_profit}"
                    prev_year = year
            
            # Read and verify yearly summary
            with open(yearly_file, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.strip().split('\n')
                
                # Should have header + year summaries
                assert len(lines) >= 2
                
                # Verify header
                header = lines[0]
                assert 'Year' in header
                assert 'Gross Profit BRL' in header
    
    def test_xlsx_export_with_year_resets(self, use_case_setup):
        """Test XLSX export functionality with year-end resets."""
        use_case, _ = use_case_setup
        
        # Execute use case to get positions
        request = ProcessPortfolioRequest(include_reporting=False, export_data=False)
        response = use_case.execute(request)
        
        # Export to XLSX
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                exporter = XLSXExporter(temp_dir)
                exporter.export_portfolio_data(response.position_history)
                
                # Verify files were created
                portfolio_file = os.path.join(temp_dir, 'portfolio_history.xlsx')
                yearly_file = os.path.join(temp_dir, 'yearly_summary.xlsx')
                
                assert os.path.exists(portfolio_file)
                assert os.path.exists(yearly_file)
                
                # Basic file size checks (should not be empty)
                assert os.path.getsize(portfolio_file) > 0
                assert os.path.getsize(yearly_file) > 0
                
            except ImportError:
                # openpyxl not available, skip this test
                pytest.skip("openpyxl not available for XLSX export testing")
    
    def test_analytics_with_year_resets(self, use_case_setup):
        """Test analytics service with year-end resets."""
        use_case, _ = use_case_setup
        
        # Execute use case to get positions
        request = ProcessPortfolioRequest(include_reporting=False, export_data=False)
        response = use_case.execute(request)
        
        # Create analytics service
        exchange_service = MockExchangeRateService()
        analytics_service = PortfolioAnalyticsService()
        
        # Test total return calculation
        total_return = analytics_service.calculate_total_return_brl(response.position_history)
        
        # Total return should be the final position's gross profit (from current year only)
        final_position = response.position_history[-1]
        assert total_return.amount == final_position.gross_profit_brl.amount
        
        # Since final position is from 2025 and only has vesting, should be 0
        assert total_return.amount == Decimal('0')
    
    def test_edge_case_year_boundary(self):
        """Test operations right at year boundaries."""
        operations = [
            # Last day of 2023
            VestingOperation(
                date=datetime(2023, 12, 31, 23, 59, 59),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 12, 31, 23, 59, 59),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('15.00'), 'USD')
            ),
            # First day of 2024
            VestingOperation(
                date=datetime(2024, 1, 1, 0, 0, 1),
                quantity=StockQuantity(25),
                price_per_share_usd=Money(Decimal('12.00'), 'USD')
            )
        ]
        
        # Create services
        exchange_service = MockExchangeRateService()
        calc_service = PortfolioCalculationService(exchange_service)
        
        # Execute operations
        positions = calc_service.execute_operations(operations)
        
        # Verify year boundary behavior
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # 2023 should have profit from trade
        assert positions_2023[-1].gross_profit_brl.amount > Decimal('0')
        
        # 2024 should reset (vesting operation should have 0 profit)
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')
    
    def test_same_date_different_years(self):
        """Test operations on the same date but different years."""
        operations = [
            # March 15, 2023
            VestingOperation(
                date=datetime(2023, 3, 15, 10, 0, 0),
                quantity=StockQuantity(100),
                price_per_share_usd=Money(Decimal('10.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2023, 3, 15, 15, 0, 0),
                quantity=StockQuantity(40),
                price_per_share_usd=Money(Decimal('13.00'), 'USD')
            ),
            # March 15, 2024 - Same date, different year
            VestingOperation(
                date=datetime(2024, 3, 15, 10, 0, 0),
                quantity=StockQuantity(50),
                price_per_share_usd=Money(Decimal('11.00'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 3, 15, 15, 0, 0),
                quantity=StockQuantity(30),
                price_per_share_usd=Money(Decimal('16.00'), 'USD')
            )
        ]
        
        # Create services
        exchange_service = MockExchangeRateService()
        calc_service = PortfolioCalculationService(exchange_service)
        
        # Execute operations
        positions = calc_service.execute_operations(operations)
        
        # Group by year
        positions_2023 = [p for p in positions if p.last_updated.year == 2023]
        positions_2024 = [p for p in positions if p.last_updated.year == 2024]
        
        # Verify 2023 profit accumulation
        assert positions_2023[0].gross_profit_brl.amount == Decimal('0')  # Vesting
        assert positions_2023[1].gross_profit_brl.amount > Decimal('0')   # Trade
        profit_2023 = positions_2023[1].gross_profit_brl.amount
        
        # Verify 2024 reset and new accumulation
        assert positions_2024[0].gross_profit_brl.amount == Decimal('0')  # Reset + Vesting
        assert positions_2024[1].gross_profit_brl.amount > Decimal('0')   # New trade profit
        profit_2024 = positions_2024[1].gross_profit_brl.amount
        
        # Profits should be different (independent years)
        assert profit_2023 != profit_2024
