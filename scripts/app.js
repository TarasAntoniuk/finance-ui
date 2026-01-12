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
 * Renders the API endpoint indicator
 * Shows which API endpoint is currently active with environment indicator
 */
function renderEndpointIndicator() {
    const indicator = document.getElementById('api-endpoint-indicator')
    if (!indicator) return

    const info = api.getConnectionInfo()
    const icon = info.isProduction ? '🟢' : '🟡'
    const environmentClass = info.isProduction ? 'production' : 'local'

    indicator.innerHTML = `
        <span class="endpoint-icon">${icon}</span>
        <span>${info.baseUrl}</span>
    `
    indicator.className = `api-endpoint-indicator ${environmentClass}`
}

/**
 * Initialize the application
 */
async function initApp() {
    // Render endpoint indicator
    renderEndpointIndicator()

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

                // Expand parent group of clicked item
                expandActiveModuleGroup();

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
 * Setup collapsible navigation groups with accordion behavior
 */
function setupNavigationGroups() {
    const groupHeaders = document.querySelectorAll('.nav-group-header');
    const subgroupHeaders = document.querySelectorAll('.nav-subgroup-header');

    // Collapse all groups by default
    groupHeaders.forEach(header => {
        const groupName = header.dataset.group;
        const groupContent = document.querySelector(`[data-group-content="${groupName}"]`);
        header.classList.add('collapsed');
        groupContent.classList.add('collapsed');
    });

    // Collapse all subgroups by default
    subgroupHeaders.forEach(header => {
        const subgroupName = header.dataset.subgroup;
        const subgroupContent = document.querySelector(`[data-subgroup-content="${subgroupName}"]`);
        header.classList.add('collapsed');
        subgroupContent.classList.add('collapsed');
    });

    // Setup main groups with accordion behavior
    groupHeaders.forEach(header => {
        const groupName = header.dataset.group;
        const groupContent = document.querySelector(`[data-group-content="${groupName}"]`);

        // Add click handler
        header.addEventListener('click', () => {
            const isCurrentlyCollapsed = header.classList.contains('collapsed');

            // Collapse all other groups (accordion behavior)
            groupHeaders.forEach(otherHeader => {
                if (otherHeader !== header) {
                    const otherGroupName = otherHeader.dataset.group;
                    const otherGroupContent = document.querySelector(`[data-group-content="${otherGroupName}"]`);
                    otherHeader.classList.add('collapsed');
                    otherGroupContent.classList.add('collapsed');
                }
            });

            // Toggle current group
            if (isCurrentlyCollapsed) {
                header.classList.remove('collapsed');
                groupContent.classList.remove('collapsed');
            } else {
                header.classList.add('collapsed');
                groupContent.classList.add('collapsed');
            }
        });
    });

    // Setup subgroups (they don't affect parent groups)
    subgroupHeaders.forEach(header => {
        const subgroupName = header.dataset.subgroup;
        const subgroupContent = document.querySelector(`[data-subgroup-content="${subgroupName}"]`);

        // Add click handler
        header.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent parent group from toggling

            header.classList.toggle('collapsed');
            subgroupContent.classList.toggle('collapsed');
        });
    });

    // Auto-expand parent group of active module
    expandActiveModuleGroup();
}

/**
 * Expand the parent group of the currently active module
 */
function expandActiveModuleGroup() {
    const activeItem = document.querySelector('.nav-item.active');
    if (!activeItem) return;

    // Find parent group
    const parentGroupContent = activeItem.closest('[data-group-content]');
    if (parentGroupContent) {
        const groupName = parentGroupContent.dataset.groupContent;
        const groupHeader = document.querySelector(`[data-group="${groupName}"]`);

        if (groupHeader && groupHeader.classList.contains('collapsed')) {
            groupHeader.classList.remove('collapsed');
            parentGroupContent.classList.remove('collapsed');
        }
    }

    // Also check for subgroup
    const parentSubgroupContent = activeItem.closest('[data-subgroup-content]');
    if (parentSubgroupContent) {
        const subgroupName = parentSubgroupContent.dataset.subgroupContent;
        const subgroupHeader = document.querySelector(`[data-subgroup="${subgroupName}"]`);

        if (subgroupHeader && subgroupHeader.classList.contains('collapsed')) {
            subgroupHeader.classList.remove('collapsed');
            parentSubgroupContent.classList.remove('collapsed');
        }
    }
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
