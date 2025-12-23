# Finance Accounting System - Web Interface

Web interface for a financial accounting system with support for banking operations, reference data, and reports.

## Features

- ✅ Bank Payments (create, view, post, cancel)
- ✅ Bank Receipts (create, view, post)
- ✅ Bank Account Management
- ✅ Reference Data: organizations, counterparties, banks, currencies, countries
- ✅ Pagination and data filtering
- ✅ Responsive design
- ✅ Integration with production API (api.tarasantoniuk.com)

## Project Structure

```
finance-ui/
├── index.html          # Main page with navigation
├── styles.css          # Application styles
├── api.js              # API client for backend communication
├── app.js              # Main application logic
├── forms.js            # Forms for creation/editing
└── README.md           # Documentation
```

## Quick Start

### Running Locally

1. Open `index.html` directly in your browser
2. Or run a simple HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

3. Open http://localhost:8000 in your browser

### Connecting to Local Backend

If you need to connect to a local backend instead of production:

1. Open `api.js`
2. Change:
```javascript
const API_BASE_URL = 'https://api.tarasantoniuk.com';
// const API_BASE_URL = 'http://localhost:8080';
```

To:
```javascript
// const API_BASE_URL = 'https://api.tarasantoniuk.com';
const API_BASE_URL = 'http://localhost:8080';
```

## Functionality

### Banking Modules

**Bank Payments**
- Create new payments
- View payment details
- Post documents (DRAFT → POSTED)
- Cancel posting (POSTED → DRAFT)
- Delete drafts
- Filter by status
- Pagination of results

**Bank Receipts**
- Similar functionality as payments
- Different receipt types (from customers, loans, investments)

**Bank Accounts**
- View account list
- Manage statuses (ACTIVE, INACTIVE, CLOSED)
- Set default account

**Banks**
- CRUD operations
- Activate/deactivate

### Reference Data

**Organizations**
- Manage legal entities
- Link to countries
- Registration and tax numbers

**Counterparties**
- Customers, suppliers, or both types
- Contact information
- List pagination

**Currencies**
- ISO currency codes
- Symbols and decimal places
- Activate/deactivate

**Countries**
- ISO country codes
- Phone codes
- Currency mapping

### Reports (In Development)

- Account balances
- Account turnovers
- Payment and receipt analysis

## API Integration

The application uses RESTful API with the following endpoints:

### Bank Payments
```
GET    /api/v1/bank-payments
POST   /api/v1/bank-payments
GET    /api/v1/bank-payments/{id}
PUT    /api/v1/bank-payments/{id}
DELETE /api/v1/bank-payments/{id}
POST   /api/v1/bank-payments/{id}/post
POST   /api/v1/bank-payments/{id}/unpost
```

### Bank Receipts
```
GET    /api/v1/bank-receipts
POST   /api/v1/bank-receipts
GET    /api/v1/bank-receipts/{id}
PUT    /api/v1/bank-receipts/{id}
DELETE /api/v1/bank-receipts/{id}
POST   /api/v1/bank-receipts/{id}/post
POST   /api/v1/bank-receipts/{id}/unpost
```

### Reference Data
```
GET    /api/organizations
GET    /api/counterparties
GET    /api/bank-accounts
GET    /api/banks
GET    /api/currencies
GET    /api/countries
```

## Technologies

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **API**: REST API with JSON
- **Styling**: Custom CSS with CSS variables
- **Architecture**: Modular structure without frameworks

## Development

### Adding a New Module

1. Add a navigation button in `index.html`:
```html
<button class="nav-item" data-module="new-module">
    <span class="icon">🔧</span>
    New Module
</button>
```

2. Create a module function in `app.js`:
```javascript
async 'new-module'() {
    document.getElementById('module-title').textContent = 'New Module';
    // Your code here
}
```

3. Add API methods in `api.js` if needed

### Adding Forms

Create functions in `forms.js`:
```javascript
async createEntity() {
    const formHtml = `...`;
    utils.showModal('Title', formHtml);
}

async submitEntity(event) {
    event.preventDefault();
    // Form processing
}
```

## Known Limitations

- ❌ Edit forms are not fully implemented yet
- ❌ Reports module is in development
- ❌ Currency rates and accounting policy - basic functionality
- ❌ No frontend authentication

## TODO

- [ ] Implement edit forms for all entities
- [ ] Add reports module
- [ ] Add charts and diagrams
- [ ] Implement export to Excel/PDF
- [ ] Add search and advanced filters
- [ ] Mobile adaptation
- [ ] Dark theme
- [ ] Internationalization

## Support

For questions and suggestions:
- Email: bronya2004@gmail.com
- API Docs: https://api.tarasantoniuk.com/swagger-ui.html

## License

Apache 2.0