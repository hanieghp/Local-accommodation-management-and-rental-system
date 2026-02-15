const CONFIG = {
    APP_NAME: 'StayLocal',
    VERSION: '1.0.0',
    API_BASE_URL: '/api/v1',
    STORAGE_PREFIX: 'staylocal_',
    CURRENCY: 'USD'
};

const Utils = {
    formatPrice: function(price) {
        return parseInt(price).toLocaleString('en-US');
    },

    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    formatDate: function(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
    },

    showToast: function(message, type = 'success', duration = 3000) {
        const existingToast = document.querySelector('.staylocal-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `staylocal-toast staylocal-toast-${type}`;
        toast.innerHTML = `
            <div class="staylocal-toast-content">
                <span class="staylocal-toast-icon">${type === 'success' ? 'OK' : type === 'error' ? 'X' : 'i'}</span>
                <span class="staylocal-toast-message">${message}</span>
                <button class="staylocal-toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        if (!document.querySelector('#staylocal-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'staylocal-toast-styles';
            styles.textContent = `
                .staylocal-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    padding: 0;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    animation: staylocal-slide-in 0.3s ease-out;
                    font-family: 'Inter', sans-serif;
                }
                
                .staylocal-toast-success {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                }
                
                .staylocal-toast-error {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                }
                
                .staylocal-toast-info {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                }
                
                .staylocal-toast-content {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    gap: 12px;
                }
                
                .staylocal-toast-icon {
                    font-size: 18px;
                }
                
                .staylocal-toast-message {
                    flex: 1;
                    font-weight: 600;
                }
                
                .staylocal-toast-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 16px;
                    line-height: 1;
                    transition: background 0.3s;
                }
                
                .staylocal-toast-close:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                @keyframes staylocal-slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @media (max-width: 480px) {
                    .staylocal-toast {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    },

    storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },

        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(CONFIG.STORAGE_PREFIX + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },

        remove: function(key) {
            try {
                localStorage.removeItem(CONFIG.STORAGE_PREFIX + key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },

        clear: function() {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(CONFIG.STORAGE_PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    },

    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone: function(phone) {
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return phoneRegex.test(phone.replace(/[\s-]/g, ''));
    },

    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    getUrlParams: function() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },

    updateUrl: function(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key]) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.pushState({}, '', url);
    },

    showLoading: function(element) {
        if (element) {
            const originalContent = element.innerHTML;
            element.setAttribute('data-original-content', originalContent);
            element.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
            element.disabled = true;
        }
    },

    hideLoading: function(element) {
        if (element && element.hasAttribute('data-original-content')) {
            element.innerHTML = element.getAttribute('data-original-content');
            element.removeAttribute('data-original-content');
            element.disabled = false;
        }
    }
};

const UserManager = {
    isLoggedIn: function() {
        return Utils.storage.get('userLoggedIn') === true || localStorage.getItem('userLoggedIn') === 'true';
    },

    getCurrentUser: function() {
        if (this.isLoggedIn()) {
            return {
                name: Utils.storage.get('userName') || localStorage.getItem('userName'),
                email: Utils.storage.get('userEmail') || localStorage.getItem('userEmail'),
                role: Utils.storage.get('userRole') || localStorage.getItem('userRole') || 'traveler',
                profile: Utils.storage.get('userProfile', {})
            };
        }
        return null;
    },

    login: function(userData) {
        Utils.storage.set('userLoggedIn', true);
        Utils.storage.set('userName', userData.name);
        Utils.storage.set('userEmail', userData.email);
        Utils.storage.set('userRole', userData.role || 'traveler');
        Utils.storage.set('userProfile', userData.profile || {});
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userRole', userData.role || 'traveler');
        Utils.showToast(`Welcome ${userData.name}!`, 'success');
    },

    logout: function() {
        Utils.storage.remove('userLoggedIn');
        Utils.storage.remove('userName');
        Utils.storage.remove('userEmail');
        Utils.storage.remove('userRole');
        Utils.storage.remove('userProfile');
        localStorage.removeItem('userLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        Utils.showToast('Successfully logged out', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    },

    requireLogin: function() {
        if (!this.isLoggedIn()) {
            Utils.showToast('Please login to access this section', 'error');
            setTimeout(() => {
                window.location.href = 'pages/loginup.html';
            }, 2000);
            return false;
        }
        return true;
    },

    isAdmin: function() {
        return this.getCurrentUser()?.role === 'admin';
    },

    isHost: function() {
        const role = this.getCurrentUser()?.role;
        return role === 'host' || role === 'admin';
    }
};

const Navigation = {
    updateNavigation: function() {
        const loginButton = document.querySelector('a[href*="loginup"], a[href*="login"]');
        
        if (UserManager.isLoggedIn()) {
            const user = UserManager.getCurrentUser();
            if (loginButton && user) {
                loginButton.innerHTML = user.name;
                loginButton.href = loginButton.href.includes('pages/') ? 'profile.html' : 'pages/profile.html';
                loginButton.title = 'User Profile';
            }
        }
    },

    fixPaths: function() {
        const isInSubfolder = window.location.pathname.includes('/pages/');
        const prefix = isInSubfolder ? '../' : '';
        
        document.querySelectorAll('link[href*="style.css"]').forEach(link => {
            link.href = prefix + 'assets/css/style.css';
        });
        
        document.querySelectorAll('img[src*="img"]').forEach(img => {
            if (!img.src.includes('http') && !img.src.includes('assets/')) {
                const imageName = img.src.split('/').pop();
                img.src = prefix + 'assets/images/' + imageName;
            }
        });
    }
};

const NotificationManager = {
    notifications: [],
    
    add: function(notification) {
        notification.id = Utils.generateId();
        notification.timestamp = new Date().toISOString();
        notification.read = false;
        this.notifications.unshift(notification);
        this.save();
        this.updateBadge();
        return notification;
    },
    
    markAsRead: function(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.save();
            this.updateBadge();
        }
    },
    
    getUnreadCount: function() {
        return this.notifications.filter(n => !n.read).length;
    },
    
    save: function() {
        Utils.storage.set('notifications', this.notifications);
    },
    
    load: function() {
        this.notifications = Utils.storage.get('notifications', []);
    },
    
    updateBadge: function() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const count = this.getUnreadCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    Navigation.fixPaths();
    Navigation.updateNavigation();
    NotificationManager.load();
    NotificationManager.updateBadge();
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

window.Utils = Utils;
window.UserManager = UserManager;
window.Navigation = Navigation;
window.NotificationManager = NotificationManager;
window.CONFIG = CONFIG;
