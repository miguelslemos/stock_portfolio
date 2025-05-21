from abc import ABC, abstractmethod
import os
import re
from typing import List

from pypdf import PdfReader

from operation import VestingOperation, SellOperation, Operation
from utils import parse_date


class DataProvider(ABC):
    @abstractmethod
    def get_operations(self) -> List[Operation]:
        pass


class StaticDataProvider(DataProvider):
    def __init__(self, operations: List[Operation]):
        self.operations = operations

    def get_operations(self) -> List[Operation]:
        return self.operations


class MultDataProvider(DataProvider):
    def __init__(self, providers: List[DataProvider]):
        self.providers = providers

    def get_operations(self) -> List[Operation]:
        operations = []
        for provider in self.providers:
            operations.extend(provider.get_operations())
        # Optionally, sort by date if all operations have a 'date' attribute
        operations.sort(key=lambda t: getattr(t, "date", None))
        return operations


class PDFDataProvider(DataProvider):
    def __init__(self, trade_confirmations_path: str = "trade_confirmations/", release_confirmations_path: str = "release_confirmations/"):
        self.operations = []
        self._process_trade_confirmations(trade_confirmations_path)
        self._process_release_confirmations(release_confirmations_path)

    def _process_trade_confirmations(self, trade_confirmation_path: str) -> None:
        """Process trade confirmation PDFs and extract sell operations."""
        trade_confirmation_files = self._get_pdf_files(trade_confirmation_path)
        for pdf in trade_confirmation_files:
            self._parse_trade_confirmation(pdf)

    def _process_release_confirmations(self, release_confirmation_path: str) -> None:
        """Process release confirmation PDFs and extract buy operations."""
        release_confirmation_files = self._get_pdf_files(release_confirmation_path)
        for pdf in release_confirmation_files:
            self._parse_release_confirmation(pdf)

    def _get_pdf_files(self, directory: str) -> List[str]:
        """Get a list of PDF files from the given directory. Raise if directory does not exist."""
        if not os.path.isdir(directory):
            raise FileNotFoundError(
                f"Directory '{directory}' does not exist. Please create the directory and add the relevant PDF files."
            )
        pdf_files = []
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith(".pdf"):
                    pdf_files.append(os.path.join(root, file))
        return pdf_files

    def _parse_trade_confirmation(self, pdf_path: str) -> None:
        """Parse a trade confirmation PDF and extract sell operation details."""
        reader = PdfReader(pdf_path)
        page = reader.pages[0]
        text = page.extract_text()
        pattern = (
            r'Trade Date\s+Settlement Date\s+Quantity\s+Price\s+Settlement Amount\n'
            r'([\d/]+)\s+[\d/]+\s+([\d,.]+)\s+([\d,.]+)'
        )
        if self.is_legacy_pdf_format(text):
            pattern = (
                r'TRADE\s+DATE\s+SETL\s+DATE\s+MKT\s+/\s+CPT\s+SYMBOL\s+/\s+CUSIP\s+BUY\s+/\s+SELL\s+QUANTITY\s+PRICE\s+ACCT\s+TYPE\n'
                r'([\d/]+)\s[\d/]+\s+[\d,\w,\s]+\s+([\d,.]+)\s+([\d,.,$]+)'
            )
        match = re.search(pattern, text)
        if match:
            trade_date = match.group(1).strip()
            quantity = int(float(match.group(2).strip().replace(",", "")))
            price = float(match.group(3).replace("$", "").strip())
            self.operations.append(SellOperation(date=parse_date(trade_date), quantity=quantity, price=round(price, 4)))

    def is_legacy_pdf_format(self, text):
        return text.startswith("E*TRADE Securities LLC")

    def _parse_release_confirmation(self, pdf_path: str) -> None:
        """Parse a release confirmation PDF and extract buy operation details."""
        reader = PdfReader(pdf_path)
        page = reader.pages[0]
        text = page.extract_text()
        parameters = ["Release Date", "Shares Issued", "Market Value Per Share"]
        data_dict = {}
        end_of_line = "\n"
        for p in parameters:
            start = text.find(p)
            str_len = len(p)
            end = text.find(end_of_line, start)
            info = text[start+str_len+1:end].replace("$", "").replace(",", "").replace("(", "-").replace(")", "")
            data_dict[p] = info
        self.operations.append(VestingOperation(date=parse_date(data_dict["Release Date"]), quantity=int(float(data_dict["Shares Issued"])), price=float(data_dict["Market Value Per Share"])))

    def get_operations(self) -> List[Operation]:
        return self.operations
        
            
