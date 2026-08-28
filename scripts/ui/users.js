/**
 * Users Module - admin user management
 */

if (typeof modules === 'undefined') {
    window.modules = {}
}

const USER_ROLES = ['GUEST', 'USER', 'ADMIN']

Object.assign(modules, {
    async users() {
        document.getElementById('module-title').textContent = 'Users'
        const contentBody = document.getElementById('content-body')

        if (!auth.isAdmin()) {
            contentBody.innerHTML = `
                <div class="welcome-screen">
                    <h2>Access denied</h2>
                    <p>User management is available to administrators only</p>
                </div>
            `
            return
        }

        contentBody.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                        <tr><td colspan="4" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="users-pagination"></div>
        `

        try {
            const data = await api.getUsers(AppState.currentPage, AppState.pageSize)
            const tbody = document.getElementById('users-tbody')

            if (data.content.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No users found</td></tr>'
                return
            }

            const currentUserId = auth.getCurrentUser()?.id
            tbody.innerHTML = data.content.map(user => modules.renderUserRow(user, currentUserId)).join('')

            modules.renderPagination('users-pagination', data.metadata, () => modules.users())
        } catch (error) {
            utils.showToast('Error loading users: ' + error.message, 'error')
        }
    },

    /**
     * Renders a single user row. The current admin cannot change their own role
     * or status - the backend rejects it, so those controls are disabled.
     */
    renderUserRow(user, currentUserId) {
        const isSelf = String(user.id) === String(currentUserId)
        const roleOptions = USER_ROLES
            .map(role => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>`)
            .join('')

        return `
            <tr>
                <td><strong>${user.email}</strong>${isSelf ? ' <span class="badge">you</span>' : ''}</td>
                <td>
                    <select ${isSelf ? 'disabled' : ''}
                            onchange="modules.changeUserRole(${user.id}, this.value)">
                        ${roleOptions}
                    </select>
                </td>
                <td>
                    <span class="badge badge-${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon" onclick="modules.viewUser(${user.id})" title="View">👁️</button>
                    <button class="btn-icon" ${isSelf ? 'disabled' : ''}
                            onclick="modules.toggleUserStatus(${user.id}, ${!user.isActive})"
                            title="${user.isActive ? 'Deactivate' : 'Activate'}">
                        ${user.isActive ? '🚫' : '✅'}
                    </button>
                </td>
            </tr>
        `
    },

    async viewUser(id) {
        try {
            const user = await api.getUser(id)
            const lockStatus = user.lockedUntil
                ? `Locked until ${utils.formatDateTime(user.lockedUntil)}`
                : 'Not locked'

            utils.showModal('User Details', `
                <div class="user-details">
                    <div class="detail-row"><strong>Email:</strong> ${user.email}</div>
                    <div class="detail-row"><strong>Role:</strong> ${user.role}</div>
                    <div class="detail-row"><strong>Status:</strong> ${user.isActive
                        ? '<span class="badge badge-active">Active</span>'
                        : '<span class="badge badge-inactive">Inactive</span>'}</div>
                    <div class="detail-row"><strong>Organization ID:</strong> ${user.organizationId ?? '-'}</div>
                    <div class="detail-row"><strong>Failed logins:</strong> ${user.failedLoginAttempts}</div>
                    <div class="detail-row"><strong>Lock:</strong> ${lockStatus}</div>
                    <div class="detail-row"><strong>Created:</strong> ${utils.formatDateTime(user.createdAt)}</div>
                    <div class="detail-row"><strong>Updated:</strong> ${utils.formatDateTime(user.updatedAt)}</div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="utils.hideModal()">Close</button>
                </div>
            `)
        } catch (error) {
            utils.showToast('Error loading user: ' + error.message, 'error')
        }
    },

    async changeUserRole(id, role) {
        try {
            await api.changeUserRole(id, role)
            utils.showToast('Role changed successfully')
        } catch (error) {
            utils.showToast('Error changing role: ' + error.message, 'error')
        }
        modules.users()
    },

    async toggleUserStatus(id, active) {
        const action = active ? 'Activate' : 'Deactivate'
        if (!await utils.confirm(`${action} this user?`)) {
            return
        }

        try {
            await api.changeUserStatus(id, active)
            utils.showToast(`User ${active ? 'activated' : 'deactivated'} successfully`)
        } catch (error) {
            utils.showToast('Error changing status: ' + error.message, 'error')
        }
        modules.users()
    }
})
