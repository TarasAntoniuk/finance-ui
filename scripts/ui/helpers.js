/**
 * UI Helpers - Translation and Pagination functions
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add helper functions to modules object
Object.assign(modules, {
    // Helper functions for translations
    translateStatus(status) {
        const translations = {
            'DRAFT': 'Draft',
            'POSTED': 'Posted',
            'CANCELLED': 'Cancelled'
        };
        return translations[status] || status;
    },

    translatePaymentType(type) {
        const translations = {
            'SUPPLIER_PAYMENT': 'Supplier Payment',
            'SALARY': 'Salary',
            'TAX_PAYMENT': 'Tax Payment',
            'LOAN_REPAYMENT': 'Loan Repayment',
            'CONTRACTOR_PAYMENT': 'Contractor Payment',
            'UTILITY_PAYMENT': 'Utility Payment',
            'RENT': 'Rent',
            'REFUND': 'Refund',
            'INTERNAL_TRANSFER': 'Internal Transfer',
            'OTHER': 'Other'
        };
        return translations[type] || type;
    },

    translateReceiptType(type) {
        const translations = {
            'CUSTOMER_PAYMENT': 'Customer Payment',
            'LOAN_RECEIVED': 'Loan Received',
            'INVESTMENT': 'Investment',
            'REFUND': 'Refund',
            'INTEREST_INCOME': 'Interest Income',
            'INTERNAL_TRANSFER': 'Internal Transfer',
            'OTHER_INCOME': 'Other Income'
        };
        return translations[type] || type;
    },

    translateAccountStatus(status) {
        const translations = {
            'ACTIVE': 'Active',
            'INACTIVE': 'Inactive',
            'CLOSED': 'Closed'
        };
        return translations[status] || status;
    },

    translateCounterpartyType(type) {
        const translations = {
            'CUSTOMER': 'Customer',
            'SUPPLIER': 'Supplier',
            'BOTH': 'Customer and Supplier'
        };
        return translations[type] || type;
    },

    /**
     * Page switcher under a list. The callback is bound as a real listener:
     * an inline onclick can only carry a string, and a stringified callback
     * is re-parsed as a function expression that is never invoked.
     */
    renderPagination(elementId, metadata, onPageChange) {
        const container = document.getElementById(elementId);
        if (!container || !metadata) return;

        const { currentPage, totalPages, hasNext, hasPrevious } = metadata;

        container.innerHTML = `
            <button type="button" data-page="${currentPage - 1}" ${!hasPrevious ? 'disabled' : ''}>
                ◀ Previous
            </button>
            <span>Page ${currentPage + 1} of ${totalPages}</span>
            <button type="button" data-page="${currentPage + 1}" ${!hasNext ? 'disabled' : ''}>
                Next ▶
            </button>
        `;

        container.querySelectorAll('button[data-page]').forEach(button => {
            button.addEventListener('click', () => {
                AppState.currentPage = Number(button.dataset.page);
                onPageChange();
            });
        });
    }
});
