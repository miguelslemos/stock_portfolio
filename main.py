#!/usr/bin/env python3
"""
Stock Portfolio Management System - Clean Architecture

This is the main entry point for the Stock Portfolio Management System
built with Clean Architecture principles. No legacy compatibility layer.
"""

import sys
import os

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Import from clean architecture
from src.main import main

if __name__ == "__main__":
    sys.exit(main())