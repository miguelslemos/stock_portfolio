# Stock Portfolio Management - Web Application

> **Modern TypeScript SPA for tracking stock operations and generating Brazilian tax reports (IRPF)**

A professional-grade stock portfolio management system built with **Clean Architecture** principles, featuring strict TypeScript, low coupling, and testable modules.

## 🎯 Features

- **📄 PDF Processing**: Extract operations from E*TRADE trade and release confirmations
- **📊 JSON Import**: Manual entry support via JSON files
- **💱 Real-time Exchange Rates**: Automatic USD/BRL conversion using Brazilian Central Bank (BCB) API
- **📈 Portfolio Tracking**: Calculate average prices, profit/loss, and yearly summaries
- **💾 CSV Export**: Export detailed reports for tax declaration
- **🎨 Modern UI**: Clean, responsive interface with real-time results
- **✅ Type-Safe**: 100% TypeScript with strict mode enabled
- **🧪 Well-Tested**: Comprehensive unit tests for business logic

## 🏗️ Architecture

This project follows **Clean Architecture** with clear separation of concerns:

```
src/
├── domain/              # Business logic & entities (no dependencies)
│   ├── entities/        # Core value objects (Money, StockQuantity, etc.)
│   ├── operations/      # Business operations (VestingOperation, TradeOperation)
│   └── services/        # Domain services (PortfolioCalculationService)
│
├── application/         # Use cases & interfaces
│   ├── interfaces/      # Repository & service contracts
│   └── usecases/        # Application workflows
│
├── infrastructure/      # External dependencies & adapters
│   ├── repositories/    # Data access (PDF, JSON parsers)
│   └── services/        # External services (BCB API, CSV export)
│
└── presentation/        # UI layer
    ├── PortfolioApp.ts  # Main application controller
    └── styles.css       # UI styling
```

### Key Principles

- ✅ **Strict Module Boundaries**: Each layer depends only on inner layers
- ✅ **Low Coupling**: Modules interact through TypeScript interfaces
- ✅ **High Cohesion**: Single responsibility per module
- ✅ **Dependency Injection**: Implementations passed via constructors
- ✅ **SOLID Principles**: Applied throughout the codebase
- ✅ **No Global State**: All state managed explicitly

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Modern web browser with ES2020 support

### Installation

```bash
# Clone the repository
git clone https://github.com/miguelslemos/stock_portfolio.git
cd stock_portfolio

# Install dependencies
npm install
```

### Development

```bash
# Start development server (with hot reload)
npm run dev

# Open http://localhost:3000 in your browser
```

### Build for Production

```bash
# Build static files to dist/
npm run build

# Preview production build locally
npm run preview
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with UI
npm test:ui

# Generate coverage report
npm test:coverage
```

### Code Quality

```bash
# Lint TypeScript files
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## 📖 Usage

### 1. Upload Your Data

The application supports two input methods:

#### Option A: PDF Files (E*TRADE)

1. **Trade Confirmations**: Upload PDF files from E*TRADE trade confirmations
2. **Release Confirmations**: Upload PDF files from E*TRADE vesting/release confirmations

#### Option B: JSON File

Create a JSON file with your operations:

```json
[
  {
    "type": "vesting",
    "date": "01/06/2023",
    "quantity": 100,
    "price": 15.0
  },
  {
    "type": "trade",
    "date": "02/26/2023",
    "quantity": 50,
    "price": 18.5
  }
]
```

**JSON Schema:**

- `type`: `"vesting"` or `"trade"`
- `date`: Date in `MM/DD/YYYY` format
- `quantity`: Number of shares (integer)
- `price`: Price per share in USD (float)
- `settlement_date` (optional): Settlement date in `MM/DD/YYYY` format

### 2. Process Portfolio

Click **"Process Portfolio"** to:
- Parse all uploaded files
- Fetch exchange rates from BCB API
- Calculate portfolio positions
- Display results with yearly summaries

### 3. Export Data (Optional)

Click **"Process & Export CSV"** to:
- Generate `portfolio_history.csv` with all operations
- Generate `yearly_summary.csv` with end-of-year positions
- Download both files automatically

## 📊 Output

### Portfolio Summary

- **Total Operations**: Count of all processed operations
- **Current Position**: Final number of shares held
- **Average Price (USD)**: Average cost per share in USD
- **Total Return (BRL)**: Cumulative profit/loss in BRL

### Yearly Summary Table

For each year, displays:
- Final quantity of shares
- Total cost in USD and BRL
- Average price in USD and BRL
- Gross profit/loss in BRL (resets each year for tax purposes)

### Operation History Table

Chronological list of all operations with:
- Date
- Operation type (Vesting/Trade)
- Quantity change
- Updated average prices
- Running profit/loss

## 🧪 Testing Strategy

The project includes comprehensive unit tests for:

- **Domain Entities**: Value object validation and operations
- **Business Operations**: Vesting and trade calculations
- **Portfolio Services**: Position tracking and analytics

Run tests with:

```bash
npm test
```

Example test output:

```
✓ src/domain/entities/__tests__/Money.test.ts (9 tests)
✓ src/domain/entities/__tests__/StockQuantity.test.ts (6 tests)
✓ src/domain/operations/__tests__/VestingOperation.test.ts (5 tests)
✓ src/domain/operations/__tests__/TradeOperation.test.ts (6 tests)
```

## 🌐 Deployment

### Static Hosting (Recommended)

The application builds to static files in `/dist` and can be deployed to any static host:

#### Vercel

```bash
npm install -g vercel
vercel --prod
```

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### GitHub Pages

```bash
npm run build
# Push dist/ folder to gh-pages branch
```

#### AWS S3 + CloudFront

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
```

### Environment Variables

No environment variables required! The app uses:
- BCB public API (no authentication needed)
- Client-side file processing (no backend)

## 🔧 Configuration

### TypeScript (`tsconfig.json`)

- **Strict Mode**: All strict checks enabled
- **No Implicit Any**: Explicit types required
- **Strict Null Checks**: Null safety enforced
- **Module Resolution**: Bundler mode for Vite

### ESLint (`.eslintrc.json`)

- TypeScript recommended rules
- No `any` types allowed
- Explicit function return types
- Unused variables detection

### Prettier (`.prettierrc.json`)

- Single quotes
- 2-space indentation
- 100 character line width
- Trailing commas (ES5)

## 📦 Dependencies

### Production

- `pdf-parse` (^1.1.1): PDF text extraction

### Development

- `typescript` (^5.3.2): Type-safe JavaScript
- `vite` (^5.0.4): Fast build tool
- `vitest` (^1.0.4): Unit testing framework
- `eslint` (^8.54.0): Code linting
- `prettier` (^3.1.0): Code formatting

**Total Bundle Size**: ~50KB (gzipped, excluding PDF parser)

## 🎓 Learning Resources

This project demonstrates:

1. **Clean Architecture**: Domain-driven design with layered architecture
2. **TypeScript Best Practices**: Strict typing, discriminated unions, type guards
3. **Dependency Injection**: Constructor injection with interfaces
4. **SOLID Principles**: Single responsibility, open/closed, dependency inversion
5. **Functional Core**: Immutable entities, pure functions
6. **Test-Driven Development**: Unit tests for business logic

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style (enforced by ESLint/Prettier)
- Add unit tests for new business logic
- Keep domain layer free of external dependencies
- Use dependency injection for testability
- Document complex business rules

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is for educational and auxiliary purposes only. It does not replace professional financial or tax advice. Always consult a qualified accountant for tax declaration matters.

## 🙏 Acknowledgments

- Brazilian Central Bank (BCB) for providing free exchange rate API
- E*TRADE for PDF confirmation formats
- Clean Architecture community for design principles

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/miguelslemos/stock_portfolio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/miguelslemos/stock_portfolio/discussions)

---

**Built with ❤️ using TypeScript, Clean Architecture, and modern web standards**

