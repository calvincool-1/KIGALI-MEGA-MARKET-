/**
 * KIGALI MEGA MARKET - CORE APPLICATION MODULE
 * Production-ready authentication, routing, and utility functions
 * @version 2.0
 */

import firebaseConfig from '../config/firebase.js';

// ============================================
// FIREBASE INITIALIZATION
// ============================================

let app, auth, db, storage;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();
    storage = firebase.storage();
    
    // Enable auth state persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('✅ Auth persistence enabled');
        })
        .catch((error) => {
            console.error('⚠️ Auth persistence error:', error);
        });
    
    // Make globally accessible
    window.auth = auth;
    window.db = db;
    window.storage = storage;
    
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Register new user with role-based data
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User credential and data
 */
window.registerUser = async function(userData) {
    try {
        const { email, password, fullName, phone, role, ...additionalData } = userData;
        
        // Validate required fields
        if (!email || !password || !fullName || !role) {
            throw new Error('All fields are required');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
        
        // Create authentication account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Prepare user database entry
        const userDbData = {
            uid: user.uid,
            email: email,
            fullName: fullName,
            phone: phone || '',
            userType: role,
            verified: false, // All users need admin verification except admin
            createdAt: Date.now(),
            lastLogin: Date.now(),
            ...additionalData
        };
        
        // Save to database
        await db.ref('users/' + user.uid).set(userDbData);
        
        // Sign out immediately after registration (user needs verification)
        await auth.signOut();
        
        console.log('✅ User registered:', user.uid, 'Role:', role);
        return { user, userData: userDbData };
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        throw handleAuthError(error);
    }
};

/**
 * Login user and redirect based on role
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with role
 */
window.loginUser = async function(email, password) {
    try {
        // Validate inputs
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        // Authenticate user
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Fetch user data from database
        const snapshot = await db.ref('users/' + user.uid).once('value');
        const userData = snapshot.val();
        
        if (!userData) {
            await auth.signOut();
            throw new Error('User data not found. Please contact support.');
        }
        
        // Check if user is verified (admin accounts are auto-verified)
        if (!userData.verified && userData.userType !== 'admin') {
            await auth.signOut();
            throw new Error('Your account is pending admin verification. Please wait for approval.');
        }
        
        // Update last login timestamp
        await db.ref('users/' + user.uid).update({
            lastLogin: Date.now()
        });
        
        console.log('✅ User logged in:', user.uid, 'Role:', userData.userType);
        return { user, userData };
        
    } catch (error) {
        console.error('❌ Login error:', error);
        throw handleAuthError(error);
    }
};

/**
 * Logout current user
 * @param {string} redirectPath - Path to redirect after logout
 */
window.logoutUser = async function(redirectPath = '../index.html') {
    try {
        await auth.signOut();
        console.log('✅ User logged out');
        window.location.href = redirectPath;
    } catch (error) {
        console.error('❌ Logout error:', error);
        showAlert('Logout failed. Please try again.', 'error');
    }
};

/**
 * Get current authenticated user with data
 * @returns {Promise<Object|null>} User object or null
 */
window.getCurrentUser = async function() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const snapshot = await db.ref('users/' + user.uid).once('value');
                    const userData = snapshot.val();
                    resolve({ user, userData });
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
};

/**
 * Redirect user based on their role
 * @param {string} role - User role (buyer, seller, admin)
 */
window.redirectByRole = function(role) {
    const roleRoutes = {
        'buyer': 'buyer-dashboard.html',
        'seller': 'seller-dashboard.html',
        'admin': 'admin-dashboard.html'
    };
    
    const targetPage = roleRoutes[role];
    if (targetPage) {
        // Check if we're already on the target page
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage !== targetPage) {
            console.log('Redirecting to:', targetPage);
            window.location.href = targetPage;
        }
    } else {
        console.error('Unknown role:', role);
        window.location.href = '../index.html';
    }
};

/**
 * Protect page - ensure user is authenticated and has correct role
 * @param {string|Array} allowedRoles - Allowed role(s) for this page
 */
window.protectPage = async function(allowedRoles) {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
        // Not logged in - redirect to login
        window.location.href = 'login.html';
        return null;
    }
    
    const { userData } = currentUser;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userData.userType)) {
        // Wrong role - redirect to correct dashboard
        showAlert('Access denied. Redirecting to your dashboard...', 'error');
        setTimeout(() => redirectByRole(userData.userType), 2000);
        return null;
    }
    
    return currentUser;
};

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Convert Firebase errors to user-friendly messages
 * @param {Error} error - Firebase error object
 * @returns {Error} Formatted error
 */
function handleAuthError(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please login instead.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/user-disabled': 'This account has been disabled.',
    };
    
    const message = errorMessages[error.code] || error.message;
    return new Error(message);
}

// ============================================
// UI UTILITY FUNCTIONS
// ============================================

/**
 * Show alert message to user
 * @param {string} message - Alert message
 * @param {string} type - Alert type (success, error, info, warning)
 */
window.showAlert = function(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; float: right; font-size: 1.2rem;">&times;</button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
};

/**
 * Show loading state on button
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Loading state
 * @param {string} text - Button text when not loading
 */
window.setButtonLoading = function(button, loading, text = 'Submit') {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span> Loading...';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || text;
    }
};

/**
 * Show loading spinner in container
 * @param {HTMLElement} container - Container element
 * @param {boolean} show - Show/hide spinner
 */
window.showLoading = function(container, show = true) {
    if (show) {
        container.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
    }
};

/**
 * Format currency (Rwandan Franc)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0
    }).format(amount);
};

/**
 * Format date/time
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date
 */
window.formatDate = function(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Valid or not
 */
window.validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

/**
 * Validate phone number (Rwanda format)
 * @param {string} phone - Phone to validate
 * @returns {boolean} Valid or not
 */
window.validatePhone = function(phone) {
    const re = /^(\+?250|0)?[7][0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
};

// ============================================
// DATABASE HELPER FUNCTIONS
// ============================================

/**
 * Create new document in collection
 * @param {string} collection - Collection name
 * @param {Object} data - Data to save
 * @returns {Promise<string>} Document ID
 */
window.createDocument = async function(collection, data) {
    try {
        const ref = await db.ref(collection).push({
            ...data,
            createdAt: data.createdAt || Date.now()
        });
        console.log(`✅ Document created in ${collection}:`, ref.key);
        return ref.key;
    } catch (error) {
        console.error(`❌ Error creating document in ${collection}:`, error);
        throw error;
    }
};

/**
 * Update document in collection
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 */
window.updateDocument = async function(collection, docId, data) {
    try {
        await db.ref(`${collection}/${docId}`).update({
            ...data,
            updatedAt: Date.now()
        });
        console.log(`✅ Document updated in ${collection}:`, docId);
    } catch (error) {
        console.error(`❌ Error updating document in ${collection}:`, error);
        throw error;
    }
};

/**
 * Delete document from collection
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 */
window.deleteDocument = async function(collection, docId) {
    try {
        await db.ref(`${collection}/${docId}`).remove();
        console.log(`✅ Document deleted from ${collection}:`, docId);
    } catch (error) {
        console.error(`❌ Error deleting document from ${collection}:`, error);
        throw error;
    }
};

/**
 * Get document by ID
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data
 */
window.getDocument = async function(collection, docId) {
    try {
        const snapshot = await db.ref(`${collection}/${docId}`).once('value');
        return snapshot.val();
    } catch (error) {
        console.error(`❌ Error getting document from ${collection}:`, error);
        throw error;
    }
};

/**
 * Query collection with filters
 * @param {string} collection - Collection name
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of documents
 */
window.queryCollection = async function(collection, options = {}) {
    try {
        let query = db.ref(collection);
        
        if (options.orderBy) {
            query = query.orderByChild(options.orderBy);
        }
        
        if (options.equalTo !== undefined) {
            query = query.equalTo(options.equalTo);
        }
        
        if (options.limitToFirst) {
            query = query.limitToFirst(options.limitToFirst);
        }
        
        if (options.limitToLast) {
            query = query.limitToLast(options.limitToLast);
        }
        
        const snapshot = await query.once('value');
        const results = [];
        
        snapshot.forEach((child) => {
            results.push({
                id: child.key,
                ...child.val()
            });
        });
        
        return results;
    } catch (error) {
        console.error(`❌ Error querying ${collection}:`, error);
        throw error;
    }
};

// ============================================
// INITIALIZATION
// ============================================

console.log('🚀 Kigali Mega Market Core Module Loaded');

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

export {
    auth,
    db,
    storage,
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    redirectByRole,
    protectPage
};
