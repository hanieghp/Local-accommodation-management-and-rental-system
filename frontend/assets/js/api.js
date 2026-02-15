/**
 * StayLocal API Service
 * Handles all communication with the backend API
 */

const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('authToken');
    }

    // Set auth token
    setToken(token) {
        localStorage.setItem('authToken', token);
    }

    // Remove auth token
    removeToken() {
        localStorage.removeItem('authToken');
    }

    // Default headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.auth !== false),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ============ AUTH ENDPOINTS ============

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
            auth: false
        });

        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            this.saveUserData(response.data.user);
        }

        return response;
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            auth: false
        });

        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            this.saveUserData(response.data.user);
        }

        return response;
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateProfile(profileData) {
        return this.request('/auth/updateprofile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/changepassword', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    logout() {
        this.removeToken();
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        window.location.href = '/frontend/index.html';
    }

    saveUserData(user) {
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userId', user.id);
    }

    isLoggedIn() {
        return !!this.getToken() && localStorage.getItem('userLoggedIn') === 'true';
    }

    // ============ PROPERTIES ENDPOINTS ============

    async getProperties(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/properties?${queryParams}` : '/properties';
        return this.request(endpoint, { auth: false });
    }

    async getProperty(id) {
        return this.request(`/properties/${id}`, { auth: false });
    }

    async createProperty(propertyData) {
        return this.request('/properties', {
            method: 'POST',
            body: JSON.stringify(propertyData)
        });
    }

    async updateProperty(id, propertyData) {
        return this.request(`/properties/${id}`, {
            method: 'PUT',
            body: JSON.stringify(propertyData)
        });
    }

    async deleteProperty(id) {
        return this.request(`/properties/${id}`, {
            method: 'DELETE'
        });
    }

    async getMyProperties() {
        return this.request('/properties/host/my-properties');
    }

    async getPendingProperties() {
        return this.request('/properties/admin/pending');
    }

    async approveProperty(id) {
        return this.request(`/properties/${id}/approve`, {
            method: 'PUT'
        });
    }

    // ============ RESERVATIONS ENDPOINTS ============

    async getMyReservations(status = null) {
        const endpoint = status ? `/reservations?status=${status}` : '/reservations';
        return this.request(endpoint);
    }

    async getHostReservations(status = null) {
        const endpoint = status ? `/reservations/host?status=${status}` : '/reservations/host';
        return this.request(endpoint);
    }

    async getReservation(id) {
        return this.request(`/reservations/${id}`);
    }

    async createReservation(reservationData) {
        return this.request('/reservations', {
            method: 'POST',
            body: JSON.stringify(reservationData)
        });
    }

    async confirmReservation(id) {
        return this.request(`/reservations/${id}/confirm`, {
            method: 'PUT'
        });
    }

    async cancelReservation(id, reason = '') {
        return this.request(`/reservations/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason })
        });
    }

    async addReview(reservationId, rating, comment = '') {
        return this.request(`/reservations/${reservationId}/review`, {
            method: 'PUT',
            body: JSON.stringify({ rating, comment })
        });
    }

    async getAllReservations(page = 1, status = null) {
        let endpoint = `/reservations/admin/all?page=${page}`;
        if (status) endpoint += `&status=${status}`;
        return this.request(endpoint);
    }

    // ============ NOTIFICATIONS ENDPOINTS ============

    async getNotifications(page = 1, unreadOnly = false) {
        let endpoint = `/notifications?page=${page}`;
        if (unreadOnly) endpoint += '&unread=true';
        return this.request(endpoint);
    }

    async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, {
            method: 'PUT'
        });
    }

    async markAllNotificationsRead() {
        return this.request('/notifications/read-all', {
            method: 'PUT'
        });
    }

    async deleteNotification(id) {
        return this.request(`/notifications/${id}`, {
            method: 'DELETE'
        });
    }

    // ============ USERS ENDPOINTS (Admin) ============

    async getUsers(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/users?${queryParams}` : '/users';
        return this.request(endpoint);
    }

    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async updateUserRole(id, role) {
        return this.request(`/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    }

    async updateUserStatus(id, isActive) {
        return this.request(`/users/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // ============ REPORTS ENDPOINTS ============

    async getDashboardStats() {
        return this.request('/reports/dashboard');
    }

    async getHostStats() {
        return this.request('/reports/host-stats');
    }

    async getUserActivityReport(startDate = null, endDate = null) {
        let endpoint = '/reports/user-activity';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (params.toString()) endpoint += `?${params.toString()}`;
        return this.request(endpoint);
    }

    async getRevenueReport(period = 'monthly') {
        return this.request(`/reports/revenue?period=${period}`);
    }

    // ============ HEALTH CHECK ============

    async healthCheck() {
        return this.request('/health', { auth: false });
    }
}

// Create global instance
const api = new ApiService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiService, api };
}
