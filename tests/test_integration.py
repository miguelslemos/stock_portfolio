"""
Integration tests for the Stock Portfolio Management System.

This module contains integration tests that verify the system
works correctly when all components are integrated together.
"""

import pytest
import tempfile
import os
import json
from decimal import Decimal
from datetime import datetime

from src.application.use_cases import ProcessPortfolioUseCase, ProcessPortfolioRequest
from src.domain.services import PortfolioCalculationService, PortfolioAnalyticsService
from src.infrastructure.exchange_rate import MockExchangeRateService
from src.infrastructure.repositories import JSONOperationRepository, CompositeOperationRepository
from src.infrastructure.presentation import SilentPortfolioReporter
from src.infrastructure.export import NoOpExporter


class TestPortfolioIntegration:
    """Integration tests for complete portfolio processing workflow."""
    
    def create_sample_json_data(self):
        """Create sample JSON operations data."""
        return [
            {
                "type": "vesting",
                "date": "01/15/2024",
                "quantity": 100,
                "price": 10.0
            },
            {
                "type": "vesting",
                "date": "02/15/2024",
                "quantity": 50,
                "price": 12.0
            },
            {
                "type": "trade",
                "date": "03/15/2024",
                "quantity": 30,
                "price": 15.0
            }
        ]
    
    def create_temp_json_file(self, data):
        """Create temporary JSON file with test data."""
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        json.dump(data, temp_file)
        temp_file.close()
        return temp_file.name
    
    @pytest.fixture
    def portfolio_system(self):
        """Create a complete portfolio system for testing."""
        # Use mock exchange rate service for predictable results
        exchange_rate_service = MockExchangeRateService(default_rate=5.0)
        calculation_service = PortfolioCalculationService(exchange_rate_service)
        analytics_service = PortfolioAnalyticsService()
        
        return {
            'calculation_service': calculation_service,
            'analytics_service': analytics_service,
            'exchange_rate_service': exchange_rate_service
        }
    
    def test_complete_portfolio_workflow(self, portfolio_system):
        """Test complete workflow from JSON input to final results."""
        # Create temporary JSON file
        json_data = self.create_sample_json_data()
        json_file = self.create_temp_json_file(json_data)
        
        try:
            # Create repository
            json_repository = JSONOperationRepository(json_file)
            repository = CompositeOperationRepository([json_repository])
            
            # Create use case
            use_case = ProcessPortfolioUseCase(
                operation_repository=repository,
                calculation_service=portfolio_system['calculation_service'],
                analytics_service=portfolio_system['analytics_service'],
                reporting_service=SilentPortfolioReporter(),
                export_service=NoOpExporter()
            )
            
            # Execute use case
            request = ProcessPortfolioRequest(
                include_reporting=False,
                export_data=False
            )
            
            response = use_case.execute(request)
            
            # Verify results
            assert response.total_operations == 3
            assert len(response.position_history) == 3
            
            # Check final position
            final_position = response.final_position
            assert final_position.quantity.value == 120  # 100 + 50 - 30
            
            # Check costs (with 5.0 exchange rate)
            # Vesting 1: 100 * $10 = $1000 USD, R$5000 BRL
            # Vesting 2: 50 * $12 = $600 USD, R$3000 BRL
            # Total before trade: $1600 USD, R$8000 BRL
            # Trade: sell 30 shares (20% of 150), so remaining 80% of costs
            expected_cost_usd = Decimal('1600') * Decimal('0.8')  # $1280
            expected_cost_brl = Decimal('8000') * Decimal('0.8')  # R$6400
            
            assert abs(final_position.total_cost_usd.amount - expected_cost_usd) < Decimal('0.01')
            assert abs(final_position.total_cost_brl.amount - expected_cost_brl) < Decimal('0.01')
            
            # Check profit calculation
            # Average cost before trade: R$8000 / 150 = R$53.33 per share
            # Sale: 30 shares * $15 * 5.0 = R$2250
            # Cost basis: 30 shares * R$53.33 = R$1600
            # Profit: R$2250 - R$1600 = R$650
            expected_profit = Decimal('650')
            assert abs(response.total_return_brl.amount - expected_profit) < Decimal('0.01')
            
        finally:
            # Clean up
            os.unlink(json_file)
    
    def test_empty_operations_handling(self, portfolio_system):
        """Test handling of empty operations list."""
        # Create empty JSON file
        json_file = self.create_temp_json_file([])
        
        try:
            # Create repository
            json_repository = JSONOperationRepository(json_file)
            repository = CompositeOperationRepository([json_repository])
            
            # Create use case
            use_case = ProcessPortfolioUseCase(
                operation_repository=repository,
                calculation_service=portfolio_system['calculation_service'],
                analytics_service=portfolio_system['analytics_service']
            )
            
            # Execute use case
            request = ProcessPortfolioRequest()
            response = use_case.execute(request)
            
            # Verify results
            assert response.total_operations == 0
            assert len(response.position_history) == 0
            assert response.final_position.quantity.value == 0
            assert response.total_return_brl.amount == Decimal('0')
            
        finally:
            # Clean up
            os.unlink(json_file)
    
    def test_chronological_ordering(self, portfolio_system):
        """Test that operations are processed in chronological order."""
        # Create operations with mixed dates
        json_data = [
            {
                "type": "vesting",
                "date": "03/15/2024",  # Later date first
                "quantity": 100,
                "price": 10.0
            },
            {
                "type": "vesting",
                "date": "01/15/2024",  # Earlier date second
                "quantity": 50,
                "price": 8.0
            }
        ]
        
        json_file = self.create_temp_json_file(json_data)
        
        try:
            # Create repository
            json_repository = JSONOperationRepository(json_file)
            repository = CompositeOperationRepository([json_repository])
            
            # Create use case
            use_case = ProcessPortfolioUseCase(
                operation_repository=repository,
                calculation_service=portfolio_system['calculation_service'],
                analytics_service=portfolio_system['analytics_service']
            )
            
            # Execute use case
            request = ProcessPortfolioRequest()
            response = use_case.execute(request)
            
            # Verify operations were processed chronologically
            positions = response.position_history
            assert len(positions) == 2
            
            # First position should be from Jan 15 (50 shares at $8)
            first_position = positions[0]
            assert first_position.quantity.value == 50
            assert first_position.total_cost_usd.amount == Decimal('400')  # 50 * 8
            
            # Second position should include both operations
            second_position = positions[1]
            assert second_position.quantity.value == 150
            # Total cost: (50 * 8) + (100 * 10) = 400 + 1000 = 1400
            assert second_position.total_cost_usd.amount == Decimal('1400')
            
        finally:
            # Clean up
            os.unlink(json_file)
    
    def test_invalid_json_file_handling(self, portfolio_system):
        """Test handling of invalid JSON file."""
        # Create invalid JSON file
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        temp_file.write("invalid json content {")
        temp_file.close()
        
        try:
            # This should raise ValueError when trying to load operations
            repo = JSONOperationRepository(temp_file.name)
            with pytest.raises(ValueError, match="Invalid JSON format"):
                repo.get_all_operations()
                
        finally:
            # Clean up
            os.unlink(temp_file.name)
    
    def test_nonexistent_json_file_handling(self, portfolio_system):
        """Test handling of nonexistent JSON file."""
        # This should raise ValueError when trying to load operations
        repo = JSONOperationRepository("nonexistent_file.json")
        with pytest.raises(ValueError, match="JSON file not found"):
            repo.get_all_operations()
    
    def test_mixed_operation_types(self, portfolio_system):
        """Test processing mixed vesting and trade operations."""
        json_data = [
            {"type": "vesting", "date": "01/15/2024", "quantity": 100, "price": 10.0},
            {"type": "trade", "date": "02/15/2024", "quantity": 25, "price": 12.0},
            {"type": "vesting", "date": "03/15/2024", "quantity": 50, "price": 11.0},
            {"type": "trade", "date": "04/15/2024", "quantity": 30, "price": 13.0},
        ]
        
        json_file = self.create_temp_json_file(json_data)
        
        try:
            json_repository = JSONOperationRepository(json_file)
            repository = CompositeOperationRepository([json_repository])
            
            use_case = ProcessPortfolioUseCase(
                operation_repository=repository,
                calculation_service=portfolio_system['calculation_service'],
                analytics_service=portfolio_system['analytics_service']
            )
            
            request = ProcessPortfolioRequest()
            response = use_case.execute(request)
            
            # Final position: 100 - 25 + 50 - 30 = 95 shares
            assert response.final_position.quantity.value == 95
            assert response.total_operations == 4
            assert len(response.position_history) == 4
            
            # Should have profit from both trades
            assert response.total_return_brl.amount > 0
            
        finally:
            os.unlink(json_file)
