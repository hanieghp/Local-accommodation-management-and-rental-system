/**
 * Kojaja Utilities
 * Common JavaScript functions and utilities for the accommodation management system
 */

// Configuration
const CONFIG = {
    APP_NAME: 'کُجاجا',
    VERSION: '1.0.0',
    API_BASE_URL: '/api/v1',
    STORAGE_PREFIX: 'kojaja_',
    CURRENCY: 'تومان'
};

// Utility Functions
const Utils = {
    // Format numbers to persian with commas
    formatPrice: function(price) {
        return parseInt(price).toLocaleString('fa-IR');
    },

    // Convert english numbers to persian
    toPersianNumbers: function(str) {
        const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return str.toString().replace(/[0-9]/g, function(w) {
            return persianNumbers[+w];
        });
    },

    // Convert persian numbers to english
    toEnglishNumbers: function(str) {
        const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        
        let result = str;
        for (let i = 0; i < persianNumbers.length; i++) {
            result = result.replace(new RegExp(persianNumbers[i], 'g'), englishNumbers[i]);
        }
        return result;
    },

    // Format date to persian
    formatPersianDate: function(date) {
        const persianMonths = [
            'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
            'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
        ];
        
        const d = new Date(date);
        return `${d.getDate()} ${persianMonths[d.getMonth()]} ${d.getFullYear()}`;
    },

    // Show toast notification
    showToast: function(message, type = 'success', duration = 3000) {
        // Remove existing toast
        const existingToast = document.querySelector('.kojaja-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `kojaja-toast kojaja-toast-${type}`;
        toast.innerHTML = `
            <div class="kojaja-toast-content">
                <span class="kojaja-toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="kojaja-toast-message">${message}</span>
                <button class="kojaja-toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles if not exists
        if (!document.querySelector('#kojaja-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'kojaja-toast-styles';
            styles.textContent = `
                .kojaja-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    padding: 0;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    animation: kojaja-slide-in 0.3s ease-out;
                    font-family: 'Vazir', sans-serif;
                }
                
                .kojaja-toast-success {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                }
                
                .kojaja-toast-error {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                }
                
                .kojaja-toast-info {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                }
                
                .kojaja-toast-content {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    gap: 12px;
                }
                
                .kojaja-toast-icon {
                    font-size: 18px;
                }
                
                .kojaja-toast-message {
                    flex: 1;
                    font-weight: 600;
                }
                
                .kojaja-toast-close {
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
                
                .kojaja-toast-close:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                @keyframes kojaja-slide-in {
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
                    .kojaja-toast {
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to document
        document.body.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    },

    // Local storage helpers
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

    // Validate email
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate iranian phone number
    isValidPhone: function(phone) {
        const phoneRegex = /^(\+98|0)?9\d{9}$/;
        return phoneRegex.test(phone.replace(/[\s-]/g, ''));
    },

    // Generate unique ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Debounce function
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

    // Get URL parameters
    getUrlParams: function() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },

    // Update URL without reload
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

    // Loading indicator
    showLoading: function(element) {
        if (element) {
            const originalContent = element.innerHTML;
            element.setAttribute('data-original-content', originalContent);
            element.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>در حال بارگذاری...';
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

// User management
const UserManager = {
    // Check if user is logged in
    isLoggedIn: function() {
        return Utils.storage.get('userLoggedIn') === true;
    },

    // Get current user data
    getCurrentUser: function() {
        if (this.isLoggedIn()) {
            return {
                name: Utils.storage.get('userName'),
                email: Utils.storage.get('userEmail'),
                profile: Utils.storage.get('userProfile', {})
            };
        }
        return null;
    },

    // Login user
    login: function(userData) {
        Utils.storage.set('userLoggedIn', true);
        Utils.storage.set('userName', userData.name);
        Utils.storage.set('userEmail', userData.email);
        Utils.storage.set('userProfile', userData.profile || {});
        Utils.showToast(`خوش آمدید ${userData.name}!`, 'success');
    },

    // Logout user
    logout: function() {
        Utils.storage.remove('userLoggedIn');
        Utils.storage.remove('userName');
        Utils.storage.remove('userEmail');
        Utils.storage.remove('userProfile');
        Utils.showToast('با موفقیت خارج شدید', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    },

    // Require login
    requireLogin: function() {
        if (!this.isLoggedIn()) {
            Utils.showToast('برای دسترسی به این بخش ابتدا وارد شوید', 'error');
            setTimeout(() => {
                window.location.href = 'pages/loginup.html';
            }, 2000);
            return false;
        }
        return true;
    }
};

// Navigation helper
const Navigation = {
    // Update navigation based on user status
    updateNavigation: function() {
        const loginButton = document.querySelector('a[href*="loginup"], a[href*="login"]');
        
        if (UserManager.isLoggedIn()) {
            const user = UserManager.getCurrentUser();
            if (loginButton && user) {
                loginButton.innerHTML = `👤 ${user.name}`;
                loginButton.href = 'pages/profile.html';
                loginButton.title = 'پروفایل کاربری';
            }
        }
    },

    // Fix relative paths based on current location
    fixPaths: function() {
        const isInSubfolder = window.location.pathname.includes('/pages/');
        const prefix = isInSubfolder ? '../' : '';
        
        // Update CSS paths
        document.querySelectorAll('link[href*="style.css"]').forEach(link => {
            link.href = prefix + 'assets/css/style.css';
        });
        
        // Update image paths
        document.querySelectorAll('img[src*="img"]').forEach(img => {
            if (!img.src.includes('http') && !img.src.includes('assets/')) {
                const imageName = img.src.split('/').pop();
                img.src = prefix + 'assets/images/' + imageName;
            }
        });
        
        // Update navigation links
        document.querySelectorAll('a[href$=".html"]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href.includes('http') && !href.includes('../')) {
                if (href === 'homePage.html' || href === 'index.html') {
                    link.href = prefix + 'index.html';
                } else {
                    link.href = prefix + 'pages/' + href;
                }
            }
        });
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Fix paths for current page
    Navigation.fixPaths();
    
    // Update navigation
    Navigation.updateNavigation();
    
    // Add smooth scrolling to all anchor links
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

// Export for global access
window.Utils = Utils;
window.UserManager = UserManager;
window.Navigation = Navigation;
window.CONFIG = CONFIG;
