# Finance Accounting System

A modern, responsive web-based finance and accounting management system built with vanilla JavaScript, HTML5, and CSS3.

## Overview

Finance Accounting System is a comprehensive solution for managing financial operations including bank accounts, payments, receipts, counterparties, and detailed financial reporting. The system provides an intuitive interface for tracking transactions and generating financial reports.

## Features

### General Classifiers
- ✅ **Organizations Management**: Create and manage multiple organizations
- ✅ **Counterparties Management**: Track business partners and vendors with pagination
- ✅ **Countries**: Maintain country directory with ISO codes
- ✅ **Currencies**: Manage multiple currencies with exchange rate support
- ✅ **Exchange Rates**: Real-time currency exchange rate management with ECB integration

### Banking Operations
- ✅ **Banks**: Manage bank directory with activate/deactivate functionality
- ✅ **Bank Accounts**: Track multiple bank accounts across organizations
- ✅ **Bank Payments**: Record and process outgoing payments with full CRUD operations
- ✅ **Bank Receipts**: Manage incoming payments and receipts
- ✅ **Document Status Management**: DRAFT → POSTED → CANCELLED workflow
- ✅ **Edit Functionality**: Full edit support for payments and receipts
- ✅ **Status Filtering**: Filter documents by status (DRAFT, POSTED)

### Banking Reports
- ✅ **Account Balances**: View current balances for all bank accounts
- ✅ **Account Turnovers**: Analyze financial movements and transactions

### Configuration
- ✅ **Accounting Policies**: Configure accounting rules and policies

## Project Structure

```
finance-ui/
├── index.html                 # Main HTML file
├── README.md                  # Project documentation
│
├── styles/                    # CSS stylesheets
│   ├── style.css             # Base styles, variables, layout, sidebar
│   ├── components.css        # UI components (buttons, forms, modals, etc.)
│   └── responsive.css        # Responsive design and media queries
│
├── scripts/                   # JavaScript files
│   ├── api.js                # API client and HTTP requests
│   ├── utils.js              # Utility functions and helpers
│   ├── ui.js                 # UI modules and form handlers
│   └── app.js                # Main application and initialization
│
├── assets/                    # Static assets
│   ├── images/               # Image files
│   └── icons/                # Icon files
│
└── docs/                      # Documentation
    └── api-doc.json          # OpenAPI specification
```

## Tech Stack

- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **Markup**: HTML5
- **Styling**: CSS3 with CSS Variables
- **Architecture**: Component-based modular design
- **State Management**: Simple state object pattern
- **API Communication**: Fetch API
- **Storage**: LocalStorage for navigation state persistence

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Web server (for local development)
- Backend API server running

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd finance-ui
```

2. Set up a local web server. You can use any of the following:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
# or
npx serve
```

**Using PHP:**
```bash
php -S localhost:8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

### Configuration

Update the API base URL in `scripts/api.js`:

```javascript
// For production
const API_BASE_URL = 'https://api.tarasantoniuk.com';

// For local development
const API_BASE_URL = 'http://localhost:8080';
```

## API Integration

### Backend API

The application integrates with a RESTful API backend:
- **Production URL**: `https://api.tarasantoniuk.com`
- **Local Development**: `http://localhost:8080`
- **API Documentation**: https://api.tarasantoniuk.com/swagger-ui.html

### API Documentation

Complete API documentation is available in `docs/api-doc.json` (OpenAPI 3.0 format).

### Key API Endpoints

#### Bank Payments
```
GET    /api/v1/bank-payments              # Get all payments (paginated)
GET    /api/v1/bank-payments/{id}         # Get payment by ID
POST   /api/v1/bank-payments              # Create new payment
PUT    /api/v1/bank-payments/{id}         # Update payment
DELETE /api/v1/bank-payments/{id}         # Delete payment
POST   /api/v1/bank-payments/{id}/post    # Post payment
POST   /api/v1/bank-payments/{id}/unpost  # Unpost payment
GET    /api/v1/bank-payments/status/{status}      # Get payments by status
GET    /api/v1/bank-payments/date-range          # Get payments by date range
```

#### Bank Receipts
```
GET    /api/v1/bank-receipts              # Get all receipts (paginated)
GET    /api/v1/bank-receipts/{id}         # Get receipt by ID
POST   /api/v1/bank-receipts              # Create new receipt
PUT    /api/v1/bank-receipts/{id}         # Update receipt
DELETE /api/v1/bank-receipts/{id}         # Delete receipt
POST   /api/v1/bank-receipts/{id}/post    # Post receipt
POST   /api/v1/bank-receipts/{id}/unpost  # Unpost receipt
GET    /api/v1/bank-receipts/status/{status}     # Get receipts by status
GET    /api/v1/bank-receipts/date-range         # Get receipts by date range
```

#### Reference Data
```
GET    /api/organizations                 # Get all organizations
GET    /api/counterparties               # Get all counterparties (paginated)
GET    /api/bank-accounts                # Get all bank accounts
GET    /api/banks                        # Get all banks
GET    /api/currencies                   # Get all currencies
GET    /api/countries                    # Get all countries
GET    /api/exchange-rates               # Get exchange rates
GET    /api/accounting-policies          # Get accounting policies
```

## Usage Guide

### Navigation

The application features a collapsible sidebar navigation organized into groups:

- **General Classifiers**: Organizations, Counterparties, Countries, Currencies
- **Banking**: Banks, Accounts, Documents (Payments/Receipts), Reports
- **Configuration**: Accounting Policies

Navigation states are persisted in localStorage for improved user experience.

### Creating a Bank Payment

1. Navigate to **Banking > Banking Documents > Bank Payments**
2. Click **+ New Payment** button
3. Fill in the form:
   - Transaction Date & Time (required)
   - Payment Type (required)
   - Organization (required)
   - Bank Account (required)
   - Counterparty (required)
   - Currency (required)
   - Amount (required)
   - Optional: Bank Commission, Payment Reference, Value Date, etc.
4. Click **Create**

### Creating a Bank Receipt

1. Navigate to **Banking > Banking Documents > Bank Receipts**
2. Click **+ New Receipt** button
3. Fill in the form with required details
4. Click **Create**

### Editing Documents

1. Open the document list
2. Click the ✏️ (Edit) icon for a DRAFT document
3. Modify the fields
4. Click **Update**

**Note**: Only DRAFT documents can be edited.

### Posting/Unposting Documents

Documents can be in different states:
- **DRAFT**: Editable, can be deleted
- **POSTED**: Finalized, creates accounting entries, cannot be edited
- **CANCELLED**: Cancelled document

**To post a document:**
1. Open the document list
2. Click the ✅ icon for a DRAFT document
3. Confirm the action

**To unpost a document:**
1. Open the document list
2. Click the ↩️ icon for a POSTED document
3. Confirm the action (returns to DRAFT state)

## Development

### Project Architecture

The application follows a modular architecture:

1. **API Layer** (`scripts/api.js`): Handles all HTTP communications
2. **Utility Layer** (`scripts/utils.js`): Provides formatting and helper functions
3. **UI Layer** (`scripts/ui.js`): Contains all UI modules and forms
4. **Application Layer** (`scripts/app.js`): Manages initialization and state

### Adding a New Module

1. Add navigation item in `index.html`:
```html
<button class="nav-item" data-module="new-module">
    <span class="icon">📄</span>
    New Module
</button>
```

2. Add module function in `scripts/ui.js`:
```javascript
modules['new-module'] = async function() {
    document.getElementById('module-title').textContent = 'New Module';
    const contentBody = document.getElementById('content-body');

    // Your module logic here
};
```

3. Add API methods in `scripts/api.js` if needed:
```javascript
async getNewModuleData() {
    return this.request('/api/new-module');
}
```

### Code Style

- Use ES6+ features (arrow functions, async/await, template literals)
- Follow consistent naming conventions (camelCase for variables/functions)
- Add comments for complex logic
- Keep functions focused and single-purpose
- Use CSS variables for theming

## Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Responsive Design

The application is fully responsive and supports:
- **Desktop** (1024px+): Full sidebar and features
- **Tablet** (768px - 1024px): Optimized layout
- **Mobile** (< 768px): Collapsible navigation, touch-friendly interface

## Performance Optimization

- Lazy loading of data
- Pagination for large datasets (default: 20 items per page)
- Efficient DOM manipulation
- LocalStorage caching for navigation state
- Debounced search inputs
- Minimal external dependencies

## Security Considerations

- Client-side validation for all forms
- HTTPS communication with API
- No sensitive data stored in localStorage
- CORS-enabled API endpoints
- Input sanitization
- Error handling for failed requests

## Troubleshooting

### API Connection Issues

If the status indicator shows "Not Connected":
1. Check if the backend API is running
2. Verify the `API_BASE_URL` in `scripts/api.js`
3. Check browser console for CORS errors
4. Ensure network connectivity
5. Test the API directly: https://api.tarasantoniuk.com

### Data Not Loading

1. Open browser Developer Tools (F12)
2. Check **Console** tab for JavaScript errors
3. Check **Network** tab for failed API requests
4. Verify API endpoint responses in Network tab
5. Check for proper authentication (if implemented)

### Form Submission Errors

1. Ensure all required fields are filled
2. Check field formats (dates, numbers)
3. Verify data types match API expectations
4. Check console for validation errors

## Future Enhancements

- [ ] User authentication and authorization
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] Export to Excel/PDF
- [ ] Advanced search and filtering
- [ ] Batch operations for bulk updates
- [ ] Offline mode with service workers
- [ ] Real-time updates via WebSocket
- [ ] Chart.js integration for reports
- [ ] Mobile native app wrapper

## Known Limitations

- No authentication system (planned)
- Reports module is basic (in development)
- No bulk import/export (planned)
- Limited offline functionality

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write clean, readable code
- Add comments for complex logic
- Test thoroughly across browsers
- Follow existing code style
- Update documentation as needed

## License

Apache 2.0

## Contact

For questions or support, please contact:
- **Email**: bronya2004@gmail.com
- **Website**: https://tarasantoniuk.com
- **API Docs**: https://api.tarasantoniuk.com/swagger-ui.html

## Changelog

### Version 1.1.0 (Current)
- ✅ Project restructuring: organized folders (styles/, scripts/, assets/)
- ✅ Split CSS into modular files (style.css, components.css, responsive.css)
- ✅ Split JavaScript into modular files (api.js, utils.js, ui.js, app.js)
- ✅ Updated API for bank-receipts and bank-payments
- ✅ Changed `documentDate` to `transactionDateTime` with datetime support
- ✅ Added new fields: paymentReference, valueDate, externalTransactionId, bankReference
- ✅ Full edit functionality for payments and receipts
- ✅ Comprehensive README documentation

### Version 1.0.0
- Initial release
- Complete banking operations module
- Responsive design implementation
- API integration with backend
- Collapsible navigation system
- Toast notifications
- Modal dialogs
- Pagination support

---

**Built with ❤️ using Vanilla JavaScript**
