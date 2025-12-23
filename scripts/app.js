/**
 * Finance UI - Main Application
 * Handles app initialization, state management, and navigation
 */

// Application State
const AppState = {
    currentModule: null,
    currentPage: 0,
    pageSize: 20,
    data: {}
};

/**
 * Initialize the application
 */
async function initApp() {
    // Check API connection
    const statusDot = document.getElementById('api-status-dot');
    const statusText = document.getElementById('api-status-text');

    try {
        const connected = await api.checkConnection();
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';

            // Load quick stats
            loadQuickStats();
        } else {
            statusDot.classList.add('error');
            statusText.textContent = 'Connection Error';
        }
    } catch (error) {
        statusDot.classList.add('error');
        statusText.textContent = 'Not Connected';
    }

    // Setup collapsible navigation groups
    setupNavigationGroups();

    // Setup navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const module = e.currentTarget.dataset.module;
            if (module && modules[module]) {
                // Reset pagination
                AppState.currentPage = 0;

                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // Load module
                AppState.currentModule = module;
                modules[module]();
            }
        });
    });

    // Setup modal close
    document.getElementById('modal-close').addEventListener('click', utils.hideModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            utils.hideModal();
        }
    });

    // Setup refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        if (AppState.currentModule && modules[AppState.currentModule]) {
            modules[AppState.currentModule]();
        }
    });
}

/**
 * Setup collapsible navigation groups
 */
function setupNavigationGroups() {
    const groupHeaders = document.querySelectorAll('.nav-group-header');
    const subgroupHeaders = document.querySelectorAll('.nav-subgroup-header');

    // Load saved group states from localStorage
    const savedStates = JSON.parse(localStorage.getItem('navGroupStates') || '{}');

    // Setup main groups
    groupHeaders.forEach(header => {
        const groupName = header.dataset.group;
        const groupContent = document.querySelector(`[data-group-content="${groupName}"]`);

        // Default to collapsed if no saved state exists
        const shouldBeExpanded = savedStates[groupName] === true;

        if (!shouldBeExpanded) {
            header.classList.add('collapsed');
            groupContent.classList.add('collapsed');
        }

        // Add click handler
        header.addEventListener('click', () => {
            const isCurrentlyCollapsed = header.classList.contains('collapsed');

            header.classList.toggle('collapsed');
            groupContent.classList.toggle('collapsed');

            savedStates[groupName] = isCurrentlyCollapsed;
            localStorage.setItem('navGroupStates', JSON.stringify(savedStates));
        });
    });

    // Setup subgroups
    subgroupHeaders.forEach(header => {
        const subgroupName = header.dataset.subgroup;
        const subgroupContent = document.querySelector(`[data-subgroup-content="${subgroupName}"]`);

        // Default to collapsed if no saved state exists
        const shouldBeExpanded = savedStates[`sub_${subgroupName}`] === true;

        if (!shouldBeExpanded) {
            header.classList.add('collapsed');
            subgroupContent.classList.add('collapsed');
        }

        // Add click handler
        header.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent parent group from toggling
            const isCurrentlyCollapsed = header.classList.contains('collapsed');

            header.classList.toggle('collapsed');
            subgroupContent.classList.toggle('collapsed');

            savedStates[`sub_${subgroupName}`] = isCurrentlyCollapsed;
            localStorage.setItem('navGroupStates', JSON.stringify(savedStates));
        });
    });
}

/**
 * Load quick stats for the welcome screen
 */
async function loadQuickStats() {
    try {
        const [accounts, counterparties, organizations] = await Promise.all([
            api.getBankAccounts(),
            api.getCounterparties(0, 1),
            api.getOrganizations()
        ]);

        document.getElementById('accounts-count').textContent = accounts.length;
        document.getElementById('counterparties-count').textContent = counterparties.metadata?.totalElements || 0;
        document.getElementById('organizations-count').textContent = organizations.length;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
