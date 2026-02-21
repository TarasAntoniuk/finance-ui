/**
 * Finance UI - Main Application
 * Handles app initialization, state management, navigation, and auth flows
 */

// Application State
const AppState = {
    currentModule: null,
    currentPage: 0,
    pageSize: 20,
    data: {}
}

// ========================================
// AUTH UI HANDLERS
// ========================================

/**
 * Switch between Login and Register tabs
 */
function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab')
    const registerTab = document.getElementById('register-tab')
    const loginForm = document.getElementById('login-form')
    const registerForm = document.getElementById('register-form')
    const loginError = document.getElementById('login-error')
    const registerError = document.getElementById('register-error')

    loginError.innerHTML = ''
    registerError.innerHTML = ''

    if (tab === 'login') {
        loginTab.classList.add('active')
        registerTab.classList.remove('active')
        loginForm.classList.remove('hidden')
        registerForm.classList.add('hidden')
    } else {
        registerTab.classList.add('active')
        loginTab.classList.remove('active')
        registerForm.classList.remove('hidden')
        loginForm.classList.add('hidden')
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault()
    const email = document.getElementById('login-email').value.trim()
    const password = document.getElementById('login-password').value
    const errorEl = document.getElementById('login-error')
    const submitBtn = document.getElementById('login-submit-btn')

    errorEl.innerHTML = ''
    submitBtn.disabled = true
    submitBtn.textContent = 'Logging in...'

    const result = await auth.login(email, password)

    if (result.success) {
        showApp()
    } else {
        if (result.validationErrors) {
            errorEl.innerHTML = '<ul>' + result.validationErrors.map(e => `<li>${e.field}: ${e.message}</li>`).join('') + '</ul>'
        } else {
            errorEl.textContent = result.error
        }
    }

    submitBtn.disabled = false
    submitBtn.textContent = 'Login'
}

/**
 * Handle register form submission
 */
async function handleRegister(event) {
    event.preventDefault()
    const email = document.getElementById('register-email').value.trim()
    const password = document.getElementById('register-password').value
    const errorEl = document.getElementById('register-error')
    const submitBtn = document.getElementById('register-submit-btn')

    errorEl.innerHTML = ''
    submitBtn.disabled = true
    submitBtn.textContent = 'Registering...'

    const result = await auth.register(email, password)

    if (result.success) {
        showApp()
    } else {
        if (result.validationErrors) {
            errorEl.innerHTML = '<ul>' + result.validationErrors.map(e => `<li>${e.field}: ${e.message}</li>`).join('') + '</ul>'
        } else {
            errorEl.textContent = result.error
        }
    }

    submitBtn.disabled = false
    submitBtn.textContent = 'Register'
}

/**
 * Handle logout
 */
async function handleLogout() {
    await auth.logout()
    AppState.currentModule = null
    AppState.currentPage = 0
    AppState.data = {}
    showLoginPage()
}

// ========================================
// PAGE VISIBILITY
// ========================================

/**
 * Show the login page and hide the app
 */
function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden')
    document.getElementById('app-container').classList.add('hidden')
    // Clear form fields
    document.getElementById('login-email').value = ''
    document.getElementById('login-password').value = ''
    document.getElementById('register-email').value = ''
    document.getElementById('register-password').value = ''
    document.getElementById('login-error').innerHTML = ''
    document.getElementById('register-error').innerHTML = ''
    switchAuthTab('login')
}

/**
 * Show the main app and hide the login page
 */
function showApp() {
    document.getElementById('login-page').classList.add('hidden')
    document.getElementById('app-container').classList.remove('hidden')
    updateUserInfo()
    updateRoleBasedNav()
    initAppContent()
}

/**
 * Update user info display in sidebar
 */
function updateUserInfo() {
    const user = auth.getCurrentUser()
    if (!user) return

    document.getElementById('user-email').textContent = user.email

    const roleBadge = document.getElementById('user-role-badge')
    const roleClass = `role-${user.role.toLowerCase()}`
    roleBadge.className = `user-role ${roleClass}`
    roleBadge.textContent = user.role
}

/**
 * Update navigation visibility based on user role
 */
function updateRoleBasedNav() {
    const adminGroup = document.getElementById('admin-nav-group')
    if (adminGroup) {
        adminGroup.style.display = auth.isAdmin() ? '' : 'none'
    }
}

// ========================================
// ENDPOINT INDICATOR
// ========================================

/**
 * Renders the API endpoint indicator
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

// ========================================
// APP INITIALIZATION
// ========================================

/**
 * Initialize the application - check auth first
 */
async function initApp() {
    // Check if user is authenticated
    if (!auth.isAuthenticated()) {
        showLoginPage()
        return
    }

    // Check if token is expired
    if (auth.isTokenExpired()) {
        const refreshed = await auth.refreshTokens()
        if (!refreshed) {
            showLoginPage()
            return
        }
    }

    // User is authenticated - show app
    showApp()
}

/**
 * Initialize app content after authentication
 */
async function initAppContent() {
    // Render endpoint indicator
    renderEndpointIndicator()

    // Check API connection
    const statusDot = document.getElementById('api-status-dot')
    const statusText = document.getElementById('api-status-text')

    try {
        const connected = await api.checkConnection()
        if (connected) {
            statusDot.classList.remove('error')
            statusDot.classList.add('connected')
            statusText.textContent = 'Connected'

            // Show welcome screen with guest banner if needed
            showWelcomeScreen()

            // Load quick stats
            loadQuickStats()
        } else {
            statusDot.classList.remove('connected')
            statusDot.classList.add('error')
            statusText.textContent = 'Connection Error'
        }
    } catch (error) {
        statusDot.classList.remove('connected')
        statusDot.classList.add('error')
        statusText.textContent = 'Not Connected'
    }

    // Setup collapsible navigation groups
    setupNavigationGroups()

    // Setup navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        // Remove old listeners by cloning
        const newItem = item.cloneNode(true)
        item.parentNode.replaceChild(newItem, item)

        newItem.addEventListener('click', (e) => {
            const module = e.currentTarget.dataset.module
            if (module && modules[module]) {
                // Reset pagination
                AppState.currentPage = 0

                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'))
                e.currentTarget.classList.add('active')

                // Expand parent group of clicked item
                expandActiveModuleGroup()

                // Load module
                AppState.currentModule = module
                modules[module]()
            }
        })
    })

    // Setup modal close
    const modalCloseBtn = document.getElementById('modal-close')
    const modalClone = modalCloseBtn.cloneNode(true)
    modalCloseBtn.parentNode.replaceChild(modalClone, modalCloseBtn)
    modalClone.addEventListener('click', utils.hideModal)

    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            utils.hideModal()
        }
    })

    // Setup refresh button
    const refreshBtn = document.getElementById('refresh-btn')
    const refreshClone = refreshBtn.cloneNode(true)
    refreshBtn.parentNode.replaceChild(refreshClone, refreshBtn)
    refreshClone.addEventListener('click', () => {
        if (AppState.currentModule && modules[AppState.currentModule]) {
            modules[AppState.currentModule]()
        }
    })
}

/**
 * Show welcome screen with optional guest banner
 */
function showWelcomeScreen() {
    const contentBody = document.getElementById('content-body')
    if (AppState.currentModule) return // Don't overwrite active module

    const guestBanner = auth.getCurrentRole() === 'GUEST'
        ? '<div class="guest-banner">You have read-only access. Contact an administrator for write permissions.</div>'
        : ''

    contentBody.innerHTML = `
        ${guestBanner}
        <div class="welcome-screen">
            <h2>Welcome to Finance Accounting System</h2>
            <p>Select a module from the left menu to get started</p>
            <div class="quick-stats" id="quick-stats">
                <div class="stat-card">
                    <h4>Bank Accounts</h4>
                    <p class="stat-value" id="accounts-count">-</p>
                </div>
                <div class="stat-card">
                    <h4>Counterparties</h4>
                    <p class="stat-value" id="counterparties-count">-</p>
                </div>
                <div class="stat-card">
                    <h4>Organizations</h4>
                    <p class="stat-value" id="organizations-count">-</p>
                </div>
            </div>
        </div>
    `
}

/**
 * Setup collapsible navigation groups with accordion behavior
 */
function setupNavigationGroups() {
    const groupHeaders = document.querySelectorAll('.nav-group-header')
    const subgroupHeaders = document.querySelectorAll('.nav-subgroup-header')

    // Collapse all groups by default
    groupHeaders.forEach(header => {
        const groupName = header.dataset.group
        const groupContent = document.querySelector(`[data-group-content="${groupName}"]`)
        header.classList.add('collapsed')
        groupContent.classList.add('collapsed')
    })

    // Collapse all subgroups by default
    subgroupHeaders.forEach(header => {
        const subgroupName = header.dataset.subgroup
        const subgroupContent = document.querySelector(`[data-subgroup-content="${subgroupName}"]`)
        header.classList.add('collapsed')
        subgroupContent.classList.add('collapsed')
    })

    // Setup main groups with accordion behavior
    groupHeaders.forEach(header => {
        const groupName = header.dataset.group
        const groupContent = document.querySelector(`[data-group-content="${groupName}"]`)

        // Remove old listeners by cloning
        const newHeader = header.cloneNode(true)
        header.parentNode.replaceChild(newHeader, header)

        newHeader.addEventListener('click', () => {
            const isCurrentlyCollapsed = newHeader.classList.contains('collapsed')

            // Collapse all other groups (accordion behavior)
            document.querySelectorAll('.nav-group-header').forEach(otherHeader => {
                if (otherHeader !== newHeader) {
                    const otherGroupName = otherHeader.dataset.group
                    const otherGroupContent = document.querySelector(`[data-group-content="${otherGroupName}"]`)
                    otherHeader.classList.add('collapsed')
                    otherGroupContent.classList.add('collapsed')
                }
            })

            // Toggle current group
            if (isCurrentlyCollapsed) {
                newHeader.classList.remove('collapsed')
                groupContent.classList.remove('collapsed')
            } else {
                newHeader.classList.add('collapsed')
                groupContent.classList.add('collapsed')
            }
        })
    })

    // Setup subgroups
    subgroupHeaders.forEach(header => {
        const subgroupName = header.dataset.subgroup
        const subgroupContent = document.querySelector(`[data-subgroup-content="${subgroupName}"]`)

        const newHeader = header.cloneNode(true)
        header.parentNode.replaceChild(newHeader, header)

        newHeader.addEventListener('click', (e) => {
            e.stopPropagation()
            newHeader.classList.toggle('collapsed')
            subgroupContent.classList.toggle('collapsed')
        })
    })

    // Auto-expand parent group of active module
    expandActiveModuleGroup()
}

/**
 * Expand the parent group of the currently active module
 */
function expandActiveModuleGroup() {
    const activeItem = document.querySelector('.nav-item.active')
    if (!activeItem) return

    // Find parent group
    const parentGroupContent = activeItem.closest('[data-group-content]')
    if (parentGroupContent) {
        const groupName = parentGroupContent.dataset.groupContent
        const groupHeader = document.querySelector(`[data-group="${groupName}"]`)

        if (groupHeader && groupHeader.classList.contains('collapsed')) {
            groupHeader.classList.remove('collapsed')
            parentGroupContent.classList.remove('collapsed')
        }
    }

    // Also check for subgroup
    const parentSubgroupContent = activeItem.closest('[data-subgroup-content]')
    if (parentSubgroupContent) {
        const subgroupName = parentSubgroupContent.dataset.subgroupContent
        const subgroupHeader = document.querySelector(`[data-subgroup="${subgroupName}"]`)

        if (subgroupHeader && subgroupHeader.classList.contains('collapsed')) {
            subgroupHeader.classList.remove('collapsed')
            parentSubgroupContent.classList.remove('collapsed')
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
        ])

        const accountsEl = document.getElementById('accounts-count')
        const counterpartiesEl = document.getElementById('counterparties-count')
        const organizationsEl = document.getElementById('organizations-count')

        if (accountsEl) accountsEl.textContent = accounts.length
        if (counterpartiesEl) counterpartiesEl.textContent = counterparties.metadata?.totalElements || 0
        if (organizationsEl) organizationsEl.textContent = organizations.length
    } catch (error) {
        console.error('Failed to load stats:', error)
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp)
