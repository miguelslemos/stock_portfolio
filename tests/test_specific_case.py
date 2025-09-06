"""
Test for specific business scenarios with detailed validation.

This module contains tests for various real-world scenarios to validate
the correctness of business logic calculations including:
- Multiple trades on same day
- Vesting and trading on same day  
- Average price calculations with proportional cost method
- Profit/loss calculations in different currencies
"""

import pytest
from decimal import Decimal
from datetime import datetime

from src.domain.entities import Money, StockQuantity, ProfitLoss, PortfolioPosition, ExchangeRate
from src.domain.operations import VestingOperation, TradeOperation
from src.domain.services import PortfolioCalculationService
from src.infrastructure.exchange_rate import MockExchangeRateService


class TestBusinessScenarios:
    """Test various business scenarios with detailed validation."""
    
    def setup_method(self):
        """Set up test environment."""
        # Mock exchange rate service with fixed rate
        self.exchange_rate_service = MockExchangeRateService(default_rate=5.0)  # USD/BRL = 5.0
        self.calculation_service = PortfolioCalculationService(self.exchange_rate_service)
    
    def create_initial_position(self, quantity: int, avg_price_usd: float, date: datetime = None) -> PortfolioPosition:
        """Helper method to create initial positions for testing."""
        if date is None:
            date = datetime(2024, 1, 1)
        
        total_cost_usd = Decimal(str(quantity * avg_price_usd))
        total_cost_brl = total_cost_usd * Decimal('5.0')  # Using fixed exchange rate
        avg_price_brl = Decimal(str(avg_price_usd)) * Decimal('5.0')
        
        return PortfolioPosition(
            quantity=StockQuantity(quantity),
            total_cost_usd=Money(total_cost_usd, 'USD'),
            total_cost_brl=Money(total_cost_brl, 'BRL'),
            average_price_usd=Money(Decimal(str(avg_price_usd)), 'USD'),
            average_price_brl=Money(avg_price_brl, 'BRL'),
            gross_profit_brl=ProfitLoss(Decimal('0'), 'BRL'),
            last_updated=date
        )
    
    def create_empty_position(self, date: datetime = None) -> PortfolioPosition:
        """Helper method to create empty position for testing."""
        if date is None:
            date = datetime(2024, 1, 1)
            
        return PortfolioPosition(
            quantity=StockQuantity(0),
            total_cost_usd=Money(Decimal('0'), 'USD'),
            total_cost_brl=Money(Decimal('0'), 'BRL'),
            average_price_usd=Money(Decimal('0'), 'USD'),
            average_price_brl=Money(Decimal('0'), 'BRL'),
            gross_profit_brl=ProfitLoss(Decimal('0'), 'BRL'),
            last_updated=date
        )
    
    def test_multiple_trades_same_day_scenario(self):
        """
        Test scenario: Multiple trades on same day
        - Initial: 20 shares at $10 average
        - Trade 1: Sell 3 shares at $15
        - Trade 2: Sell 4 shares at $20
        """
        # Create initial position using helper method
        initial_position = self.create_initial_position(quantity=20, avg_price_usd=10.0)
        # Create operations
        trade1 = TradeOperation(
            date=datetime(2024, 1, 15),
            quantity=StockQuantity(3),
            price_per_share_usd=Money(Decimal('15'), 'USD')
        )
        
        trade2 = TradeOperation(
            date=datetime(2024, 1, 15),  # Same day
            quantity=StockQuantity(4),
            price_per_share_usd=Money(Decimal('20'), 'USD')
        )
        
        # Execute operations sequentially
        operations = [trade1, trade2]
        positions = self.calculation_service.execute_operations(operations, initial_position)
        
        # Verify we have 2 positions (one for each trade)
        assert len(positions) == 2
        
        # Check position after first trade (sell 3 at $15)
        position_after_trade1 = positions[0]
        assert position_after_trade1.quantity.value == 17  # 20 - 3
        
        # With proportional cost method: 3/20 = 15% of position sold
        # Remaining cost: 200 * (1 - 0.15) = 200 * 0.85 = $170
        expected_cost_usd_after_trade1 = Decimal('200') * Decimal('0.85')
        assert abs(position_after_trade1.total_cost_usd.amount - expected_cost_usd_after_trade1) < Decimal('0.01')
        
        # Average price should remain $10 (proportional method)
        assert abs(position_after_trade1.average_price_usd.amount - Decimal('10')) < Decimal('0.01')
        
        # Profit from first trade: 3 * ($15 - $10) * 5.0 = 3 * $5 * 5.0 = $75 BRL
        expected_profit_trade1 = Decimal('3') * (Decimal('15') - Decimal('10')) * Decimal('5.0')
        assert abs(position_after_trade1.gross_profit_brl.amount - expected_profit_trade1) < Decimal('0.01')
        
        # Check final position after second trade (sell 4 at $20)
        final_position = positions[1]
        assert final_position.quantity.value == 13  # 17 - 4
        
        # With proportional cost method: 4/17 ≈ 23.53% of remaining position sold
        # Remaining cost: 170 * (1 - 4/17) = 170 * (13/17) ≈ $130
        expected_final_cost_usd = expected_cost_usd_after_trade1 * (Decimal('13') / Decimal('17'))
        assert abs(final_position.total_cost_usd.amount - expected_final_cost_usd) < Decimal('0.01')
        
        # Average price should still be $10
        assert abs(final_position.average_price_usd.amount - Decimal('10')) < Decimal('0.01')
        
        # Total profit calculation:
        # Trade 1: 3 * ($15 - $10) * 5.0 = $75 BRL
        # Trade 2: 4 * ($20 - $10) * 5.0 = $200 BRL
        # Total: $275 BRL
        expected_total_profit = Decimal('75') + Decimal('200')
        assert abs(final_position.gross_profit_brl.amount - expected_total_profit) < Decimal('0.01')
        
        print(f"✅ Multiple Trades Same Day Results:")
        print(f"   Initial: 20 shares at ${initial_position.average_price_usd.amount}/share")
        print(f"   After Trade 1 (sell 3 at $15): {position_after_trade1.quantity.value} shares, profit: R${position_after_trade1.gross_profit_brl.amount}")
        print(f"   After Trade 2 (sell 4 at $20): {final_position.quantity.value} shares, profit: R${final_position.gross_profit_brl.amount}")
        print(f"   Final average price: ${final_position.average_price_usd.amount}")
        print(f"   Expected total profit: R${expected_total_profit}")
    
    def test_average_price_consistency(self):
        """
        Test that average price remains consistent with proportional cost method.
        """
        # Start with known position
        initial_cost = Decimal('200')  # 20 * $10
        initial_quantity = 20
        
        # Sell 7 shares total (3 + 4)
        total_sold = 7
        remaining_shares = initial_quantity - total_sold  # 13
        
        # With proportional cost method, the average price should remain the same
        expected_avg_price = initial_cost / initial_quantity  # $10
        
        # Execute the trades
        operations = [
            TradeOperation(
                date=datetime(2024, 1, 15),
                quantity=StockQuantity(3),
                price_per_share_usd=Money(Decimal('15'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 1, 15),
                quantity=StockQuantity(4),
                price_per_share_usd=Money(Decimal('20'), 'USD')
            )
        ]
        
        initial_position = self.create_initial_position(quantity=20, avg_price_usd=10.0)
        positions = self.calculation_service.execute_operations(operations, initial_position)
        final_position = positions[-1]
        
        # Verify average price consistency
        assert abs(final_position.average_price_usd.amount - expected_avg_price) < Decimal('0.01')
        
        # Verify total cost is proportional
        expected_remaining_cost = initial_cost * (Decimal(remaining_shares) / Decimal(initial_quantity))
        calculated_avg_from_cost = final_position.total_cost_usd.amount / final_position.quantity.value
        
        assert abs(calculated_avg_from_cost - expected_avg_price) < Decimal('0.01')
        
        print(f"✅ Average Price Consistency:")
        print(f"   Initial average: ${expected_avg_price}")
        print(f"   Final average: ${final_position.average_price_usd.amount}")
        print(f"   Calculated from cost/quantity: ${calculated_avg_from_cost}")
    
    def test_profit_calculation_breakdown(self):
        """
        Test detailed profit calculation for each trade.
        """
        # Manual calculation for verification
        # Trade 1: 3 shares at $15, cost basis $10 each
        # Profit per share: $15 - $10 = $5
        # Total profit USD: 3 * $5 = $15
        # Total profit BRL: $15 * 5.0 = R$75
        
        # Trade 2: 4 shares at $20, cost basis $10 each  
        # Profit per share: $20 - $10 = $10
        # Total profit USD: 4 * $10 = $40
        # Total profit BRL: $40 * 5.0 = R$200
        
        # Total profit: R$75 + R$200 = R$275
        
        operations = [
            TradeOperation(
                date=datetime(2024, 1, 15),
                quantity=StockQuantity(3),
                price_per_share_usd=Money(Decimal('15'), 'USD')
            ),
            TradeOperation(
                date=datetime(2024, 1, 15),
                quantity=StockQuantity(4),
                price_per_share_usd=Money(Decimal('20'), 'USD')
            )
        ]
        
        initial_position = self.create_initial_position(quantity=20, avg_price_usd=10.0)
        positions = self.calculation_service.execute_operations(operations, initial_position)
        
        # Check individual trade profits
        profit_after_trade1 = positions[0].gross_profit_brl.amount
        profit_after_trade2 = positions[1].gross_profit_brl.amount
        
        expected_profit_trade1 = Decimal('75')  # 3 * (15-10) * 5.0
        expected_profit_trade2 = Decimal('200')  # 4 * (20-10) * 5.0
        expected_total_profit = expected_profit_trade1 + expected_profit_trade2
        
        assert abs(profit_after_trade1 - expected_profit_trade1) < Decimal('0.01')
        assert abs(profit_after_trade2 - expected_total_profit) < Decimal('0.01')
        
        print(f"✅ Profit Breakdown:")
        print(f"   Trade 1 (3 @ $15): R${expected_profit_trade1} (actual: R${profit_after_trade1})")
        print(f"   Trade 2 (4 @ $20): R${expected_profit_trade2} (incremental)")
        print(f"   Total Profit: R${expected_total_profit} (actual: R${profit_after_trade2})")


    def test_vesting_and_trade_same_day(self):
        """
        Test scenario: Vesting and trade on same day
        - Initial: Empty position
        - Vesting: Receive 100 shares at $12
        - Trade: Sell 25 shares at $18 (same day)
        - Expected: 75 shares remaining, average price $12, profit R$750
        """
        # Start with empty position
        initial_position = self.create_empty_position()
        
        # Create operations for same day
        same_date = datetime(2024, 2, 15)
        
        vesting = VestingOperation(
            date=same_date,
            quantity=StockQuantity(100),
            price_per_share_usd=Money(Decimal('12'), 'USD')
        )
        
        trade = TradeOperation(
            date=same_date,
            quantity=StockQuantity(25),
            price_per_share_usd=Money(Decimal('18'), 'USD')
        )
        
        # Execute operations in chronological order
        operations = [vesting, trade]
        positions = self.calculation_service.execute_operations(operations, initial_position)
        
        # Verify we have 2 positions (one for each operation)
        assert len(positions) == 2
        
        # Check position after vesting
        position_after_vesting = positions[0]
        assert position_after_vesting.quantity.value == 100
        assert abs(position_after_vesting.average_price_usd.amount - Decimal('12')) < Decimal('0.01')
        assert position_after_vesting.gross_profit_brl.amount == Decimal('0')  # No profit from vesting
        
        # Check final position after trade
        final_position = positions[1]
        assert final_position.quantity.value == 75  # 100 - 25
        
        # Average price should remain $12 (proportional cost method)
        assert abs(final_position.average_price_usd.amount - Decimal('12')) < Decimal('0.01')
        
        # Calculate expected profit: 25 * ($18 - $12) * 5.0 = 25 * $6 * 5.0 = R$750
        expected_profit = Decimal('25') * (Decimal('18') - Decimal('12')) * Decimal('5.0')
        assert abs(final_position.gross_profit_brl.amount - expected_profit) < Decimal('0.01')
        
        # Verify cost calculations
        # After vesting: 100 shares * $12 = $1200 total cost
        # After trade: proportional reduction - 25/100 = 25% sold
        # Remaining cost: $1200 * (75/100) = $900
        expected_final_cost = Decimal('1200') * (Decimal('75') / Decimal('100'))
        assert abs(final_position.total_cost_usd.amount - expected_final_cost) < Decimal('0.01')
        
        print(f"✅ Vesting and Trade Same Day Results:")
        print(f"   After Vesting: {position_after_vesting.quantity.value} shares at ${position_after_vesting.average_price_usd.amount}")
        print(f"   After Trade: {final_position.quantity.value} shares at ${final_position.average_price_usd.amount}")
        print(f"   Profit from trade: R${final_position.gross_profit_brl.amount}")
        print(f"   Expected profit: R${expected_profit}")

    def test_complex_mixed_operations_same_day(self):
        """
        Test scenario: Multiple mixed operations on same day
        - Initial: 50 shares at $8 average
        - Vesting: Receive 30 shares at $15
        - Trade 1: Sell 20 shares at $22
        - Trade 2: Sell 10 shares at $25
        - Expected: Complex average price calculation and profit tracking
        """
        # Create initial position
        initial_position = self.create_initial_position(quantity=50, avg_price_usd=8.0)
        
        same_date = datetime(2024, 3, 20)
        
        # Create mixed operations
        vesting = VestingOperation(
            date=same_date,
            quantity=StockQuantity(30),
            price_per_share_usd=Money(Decimal('15'), 'USD')
        )
        
        trade1 = TradeOperation(
            date=same_date,
            quantity=StockQuantity(20),
            price_per_share_usd=Money(Decimal('22'), 'USD')
        )
        
        trade2 = TradeOperation(
            date=same_date,
            quantity=StockQuantity(10),
            price_per_share_usd=Money(Decimal('25'), 'USD')
        )
        
        operations = [vesting, trade1, trade2]
        positions = self.calculation_service.execute_operations(operations, initial_position)
        
        assert len(positions) == 3
        
        # After vesting: 50 + 30 = 80 shares
        # New average: (50*$8 + 30*$15) / 80 = ($400 + $450) / 80 = $850 / 80 = $10.625
        position_after_vesting = positions[0]
        assert position_after_vesting.quantity.value == 80
        expected_avg_after_vesting = (Decimal('50') * Decimal('8') + Decimal('30') * Decimal('15')) / Decimal('80')
        assert abs(position_after_vesting.average_price_usd.amount - expected_avg_after_vesting) < Decimal('0.01')
        
        # Final position after both trades: 80 - 20 - 10 = 50 shares
        final_position = positions[2]
        assert final_position.quantity.value == 50
        
        # Average price should remain $10.625 (proportional method)
        assert abs(final_position.average_price_usd.amount - expected_avg_after_vesting) < Decimal('0.01')
        
        # Calculate expected total profit:
        # Trade 1: 20 * ($22 - $10.625) * 5.0 = 20 * $11.375 * 5.0 = R$1137.50
        # Trade 2: 10 * ($25 - $10.625) * 5.0 = 10 * $14.375 * 5.0 = R$718.75
        # Total: R$1856.25
        profit_trade1 = Decimal('20') * (Decimal('22') - expected_avg_after_vesting) * Decimal('5.0')
        profit_trade2 = Decimal('10') * (Decimal('25') - expected_avg_after_vesting) * Decimal('5.0')
        expected_total_profit = profit_trade1 + profit_trade2
        
        assert abs(final_position.gross_profit_brl.amount - expected_total_profit) < Decimal('0.01')
        
        print(f"✅ Complex Mixed Operations Results:")
        print(f"   Initial: 50 shares at $8.00")
        print(f"   After vesting: {position_after_vesting.quantity.value} shares at ${position_after_vesting.average_price_usd.amount}")
        print(f"   Final: {final_position.quantity.value} shares at ${final_position.average_price_usd.amount}")
        print(f"   Final average price: ${final_position.average_price_usd.amount}")
        print(f"   Expected average price: ${expected_avg_after_vesting}")
        print(f"   Total profit: R${final_position.gross_profit_brl.amount}")
        print(f"   Expected profit: R${expected_total_profit}")


if __name__ == "__main__":
    # Run the test manually for demonstration
    test_case = TestBusinessScenarios()
    test_case.setup_method()
    
    print("🧪 Testing Business Scenarios")
    print("=" * 60)
    
    try:
        test_case.test_multiple_trades_same_day_scenario()
        test_case.test_vesting_and_trade_same_day()
        test_case.test_complex_mixed_operations_same_day()
        print("\n✅ All tests passed! The business logic is correct.")
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
