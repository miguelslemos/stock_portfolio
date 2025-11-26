"""
Infrastructure repositories for data access.

This module contains concrete implementations of repositories
that handle data persistence and retrieval from various sources.
"""

import json
import os
import re
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
import logging

from pypdf import PdfReader

from ..domain.entities import Money, StockQuantity
from ..domain.operations import PortfolioOperation, VestingOperation, TradeOperation
from ..application.use_cases import OperationRepository

logger = logging.getLogger(__name__)


class JSONOperationRepository(OperationRepository):
    """Repository for loading operations from JSON files."""
    
    def __init__(self, file_path: str):
        """
        Initialize JSON repository.
        
        Args:
            file_path: Path to the JSON file containing operations
        """
        self._file_path = file_path
    
    def get_all_operations(self) -> List[PortfolioOperation]:
        """Load operations from JSON file."""
        try:
            with open(self._file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            operations = []
            for item in data:
                operation = self._create_operation_from_dict(item)
                operations.append(operation)
            
            logger.info(f"Loaded {len(operations)} operations from {self._file_path}")
            return operations
            
        except FileNotFoundError:
            raise ValueError(f"JSON file not found: {self._file_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format in {self._file_path}: {e}")
        except Exception as e:
            raise ValueError(f"Error loading operations from {self._file_path}: {e}")
    
    def _create_operation_from_dict(self, data: dict) -> PortfolioOperation:
        """Create operation object from dictionary data."""
        try:
            operation_type = data['type'].lower()
            date = self._parse_date(data['date'])
            quantity = StockQuantity(int(data['quantity']))
            price = Money(Decimal(str(data['price'])), 'USD')
            
            if operation_type == 'vesting':
                return VestingOperation(
                    date=date,
                    quantity=quantity,
                    price_per_share_usd=price
                )
            elif operation_type == 'trade':
                return TradeOperation(
                    date=date,
                    quantity=quantity,
                    price_per_share_usd=price
                )
            else:
                raise ValueError(f"Unsupported operation type: {operation_type}")
                
        except KeyError as e:
            raise ValueError(f"Missing required field in operation data: {e}")
        except (ValueError, TypeError) as e:
            raise ValueError(f"Invalid operation data: {e}")
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string in multiple formats."""
        formats = ["%m/%d/%Y", "%m/%d/%y", "%m-%d-%Y", "%Y-%m-%d"]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        raise ValueError(f"Invalid date format: {date_str}. Supported formats: MM/DD/YYYY, MM/DD/YY, MM-DD-YYYY, YYYY-MM-DD")


class PDFOperationRepository(OperationRepository):
    """Repository for extracting operations from PDF files."""
    
    def __init__(self, trade_confirmations_dir: str, release_confirmations_dir: str):
        """
        Initialize PDF repository.
        
        Args:
            trade_confirmations_dir: Directory containing trade confirmation PDFs
            release_confirmations_dir: Directory containing release confirmation PDFs
        """
        self._trade_dir = trade_confirmations_dir
        self._release_dir = release_confirmations_dir
    
    def get_all_operations(self) -> List[PortfolioOperation]:
        """Extract operations from PDF files."""
        operations = []
        
        # Process trade confirmations
        trade_files = self._get_pdf_files(self._trade_dir)
        for pdf_file in trade_files:
            try:
                trade_op = self._extract_trade_operation(pdf_file)
                if trade_op:
                    operations.append(trade_op)
            except Exception as e:
                logger.warning(f"Failed to process trade PDF {pdf_file}: {e}")
        
        # Process release confirmations
        release_files = self._get_pdf_files(self._release_dir)
        for pdf_file in release_files:
            try:
                vesting_op = self._extract_vesting_operation(pdf_file)
                if vesting_op:
                    operations.append(vesting_op)
            except Exception as e:
                logger.warning(f"Failed to process release PDF {pdf_file}: {e}")
        
        logger.info(f"Extracted {len(operations)} operations from PDF files")
        return operations
    
    def _get_pdf_files(self, directory: str) -> List[str]:
        """Get list of PDF files from directory."""
        if not os.path.isdir(directory):
            logger.warning(f"Directory not found: {directory}")
            return []
        
        pdf_files = []
        for root, _, files in os.walk(directory):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
        
        return pdf_files
    
    def _extract_trade_operation(self, pdf_path: str) -> Optional[TradeOperation]:
        """Extract trade operation from PDF file."""
        try:
            reader = PdfReader(pdf_path)
            page = reader.pages[0]
            text = page.extract_text()
            
            # Try modern format first
            pattern = (
                r'Trade Date\s+Settlement Date\s+Quantity\s+Price\s+Settlement Amount\n'
                r'[\d/]+\s+([\d/]+)\s+([\d,.]+)\s+([\d,.]+)'
            )
            
            # Check for legacy format
            if self._is_legacy_pdf_format(text):
                pattern = (
                    r'TRADE\s+DATE\s+SETL\s+DATE\s+MKT\s+/\s+CPT\s+SYMBOL\s+/\s+CUSIP\s+BUY\s+/\s+SELL\s+QUANTITY\s+PRICE\s+ACCT\s+TYPE\n'
                    r'[\d/]+\s([\d/]+)\s+[\d,\w,\s]+\s+([\d,.]+)\s+([\d,.,$]+)'
                )
            
            match = re.search(pattern, text)
            if match:
                date_str = match.group(1).strip()
                quantity_str = match.group(2).strip().replace(",", "")
                price_str = match.group(3).replace("$", "").strip()
                
                date = self._parse_date(date_str)
                quantity = StockQuantity(int(float(quantity_str)))
                price = Money(Decimal(price_str), 'USD')
                
                return TradeOperation(
                    date=date,
                    quantity=quantity,
                    price_per_share_usd=price
                )
            
            logger.warning(f"Could not extract trade data from {pdf_path}")
            return None
            
        except Exception as e:
            logger.error(f"Error extracting trade from {pdf_path}: {e}")
            return None
    
    def _extract_vesting_operation(self, pdf_path: str) -> Optional[VestingOperation]:
        """Extract vesting operation from PDF file."""
        try:
            reader = PdfReader(pdf_path)
            page = reader.pages[0]
            text = page.extract_text()
            
            # Extract required fields
            parameters = ["Release Date", "Shares Issued", "Market Value Per Share"]
            data_dict = {}
            
            for param in parameters:
                start = text.find(param)
                if start == -1:
                    logger.warning(f"Parameter '{param}' not found in {pdf_path}")
                    return None
                
                str_len = len(param)
                end = text.find("\n", start)
                if end == -1:
                    end = len(text)
                
                value = text[start + str_len + 1:end]
                value = value.replace("$", "").replace(",", "").replace("(", "-").replace(")", "").strip()
                data_dict[param] = value
            
            date = self._parse_date(data_dict["Release Date"])
            quantity = StockQuantity(int(float(data_dict["Shares Issued"])))
            price = Money(Decimal(data_dict["Market Value Per Share"]), 'USD')
            
            return VestingOperation(
                date=date,
                quantity=quantity,
                price_per_share_usd=price
            )
            
        except Exception as e:
            logger.error(f"Error extracting vesting from {pdf_path}: {e}")
            return None
    
    def _is_legacy_pdf_format(self, text: str) -> bool:
        """Check if PDF is in legacy E*TRADE format."""
        return text.startswith("E*TRADE Securities LLC")
    
    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string in multiple formats."""
        formats = ["%m/%d/%Y", "%m/%d/%y", "%m-%d-%Y"]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        raise ValueError(f"Invalid date format: {date_str}")


class CompositeOperationRepository(OperationRepository):
    """Repository that combines multiple operation repositories."""
    
    def __init__(self, repositories: List[OperationRepository]):
        """
        Initialize composite repository.
        
        Args:
            repositories: List of repositories to combine
        """
        self._repositories = repositories
    
    def get_all_operations(self) -> List[PortfolioOperation]:
        """Get operations from all repositories and sort by date."""
        all_operations = []
        
        for repo in self._repositories:
            try:
                operations = repo.get_all_operations()
                all_operations.extend(operations)
                logger.info(f"Loaded {len(operations)} operations from {type(repo).__name__}")
            except Exception as e:
                logger.error(f"Failed to load operations from {type(repo).__name__}: {e}")
                # Continue with other repositories
        
        # Sort all operations by date
        all_operations.sort(key=lambda op: op.get_date())
        
        logger.info(f"Total operations loaded: {len(all_operations)}")
        return all_operations
