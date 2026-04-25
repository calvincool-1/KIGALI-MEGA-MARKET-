/**
 * KIGALI MEGA MARKET - CORE APPLICATION MODULE
 * Production-ready authentication, routing, and utility functions
 * @version 2.1
 */

import firebaseConfig from '../config/firebase.js';
import { bindInternalLinks, getRouteForRole, navigateTo, resolveRoute } from './routes.js';

let app = null;
let auth = null;
let db = null;
let storage = null;

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK is not loaded.');
    }

    app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.database();
    storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('Auth persistence enabled');
        })
        .catch((error) => {
            console.error('Auth persistence error:', error);
        });

    window.auth = auth;
    window.db = db;

    if (storage) {
        window.storage = storage;
    }

    console.log('Firebase initialized successfully');

    if (!storage) {
        console.warn('Firebase Storage SDK not loaded. Continuing without storage.');
    }
}

function assertFirebaseReady() {
    if (!auth || !db) {
        throw new Error('Firebase is not initialized. Check your configuration and SDK imports.');
    }
}

try {
    initializeFirebase();
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

const registerUser = async function(userData) {
    try {
        assertFirebaseReady();

        const { email, password, fullName, phone, role, ...additionalData } = userData;

        if (!email || !password || !fullName || !role) {
            throw new Error('All fields are required');
        }

        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const userDbData = {
            uid: user.uid,
            email,
            fullName,
            phone: phone || '',
            userType: role,
            verified: false,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            ...additionalData
        };

        await db.ref(`users/${user.uid}`).set(userDbData);
        await auth.signOut();

        console.log('User registered:', user.uid, 'Role:', role);
        return { user, userData: userDbData };
    } catch (error) {
        console.error('Registration error:', error);
        throw handleAuthError(error);
    }
};
window.registerUser = registerUser;

const loginUser = async function(email, password) {
    try {
        assertFirebaseReady();

        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        const snapshot = await db.ref(`users/${user.uid}`).once('value');
        const userData = snapshot.val();

        if (!userData) {
            await auth.signOut();
            throw new Error('User data not found. Please contact support.');
        }

        if (!userData.verified && userData.userType !== 'admin') {
            await auth.signOut();
            throw new Error('Your account is pending admin verification. Please wait for approval.');
        }

        await db.ref(`users/${user.uid}`).update({
            lastLogin: Date.now()
        });

        console.log('User logged in:', user.uid, 'Role:', userData.userType);
        return { user, userData };
    } catch (error) {
        console.error('Login error:', error);
        throw handleAuthError(error);
    }
};
window.loginUser = loginUser;

const logoutUser = async function(redirectTarget = 'home') {
    try {
        assertFirebaseReady();
        await auth.signOut();
        console.log('User logged out');
        navigateTo(redirectTarget);
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Logout failed. Please try again.', 'error');
    }
};
window.logoutUser = logoutUser;

const getCurrentUser = async function() {
    if (!auth || !db) {
        return null;
    }

    return new Promise((resolve) => {
        let unsubscribe = null;

        unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (unsubscribe) {
                unsubscribe();
            }

            if (!user) {
                resolve(null);
                return;
            }

            try {
                const snapshot = await db.ref(`users/${user.uid}`).once('value');
                const userData = snapshot.val();
                resolve({ user, userData });
            } catch (error) {
                console.error('Error fetching user data:', error);
                resolve(null);
            }
        });
    });
};
window.getCurrentUser = getCurrentUser;

const redirectByRole = function(role) {
    const routeKey = getRouteForRole(role);

    if (!routeKey) {
        console.error('Unknown role:', role);
        navigateTo('home');
        return;
    }

    const targetPage = resolveRoute(routeKey);
    const currentPage = window.location.pathname.replace(/\\/g, '/').split('/').pop();
    const targetFile = targetPage.split(/[?#]/)[0].split('/').pop();

    if (currentPage !== targetFile) {
        console.log('Redirecting to:', targetPage);
        navigateTo(routeKey);
    }
};
window.redirectByRole = redirectByRole;

const protectPage = async function(allowedRoles) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        navigateTo('login');
        return null;
    }

    const { userData } = currentUser;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userData.userType)) {
        showAlert('Access denied. Redirecting to your dashboard...', 'error');
        setTimeout(() => redirectByRole(userData.userType), 2000);
        return null;
    }

    return currentUser;
};
window.protectPage = protectPage;

function handleAuthError(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please login instead.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/user-disabled': 'This account has been disabled.'
    };

    const message = errorMessages[error.code] || error.message;
    return new Error(message);
}

const showAlert = function(message, type = 'info') {
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach((alert) => alert.remove());

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; float: right; font-size: 1.2rem;">&times;</button>
    `;

    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
};
window.showAlert = showAlert;

const setButtonLoading = function(button, loading, text = 'Submit') {
    if (loading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span> Loading...';
        return;
    }

    button.disabled = false;
    button.textContent = button.dataset.originalText || text;
};
window.setButtonLoading = setButtonLoading;

const showLoading = function(container, show = true) {
    if (show) {
        container.innerHTML = '<div class="spinner" style="margin: 2rem auto;"></div>';
    }
};
window.showLoading = showLoading;

const formatCurrency = function(amount) {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0
    }).format(amount);
};
window.formatCurrency = formatCurrency;

const formatDate = function(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
window.formatDate = formatDate;

const validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
window.validateEmail = validateEmail;

const validatePhone = function(phone) {
    const re = /^(\+?250|0)?[7][0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
};
window.validatePhone = validatePhone;

const createDocument = async function(collection, data) {
    try {
        assertFirebaseReady();

        const ref = await db.ref(collection).push({
            ...data,
            createdAt: data.createdAt || Date.now()
        });

        console.log(`Document created in ${collection}:`, ref.key);
        return ref.key;
    } catch (error) {
        console.error(`Error creating document in ${collection}:`, error);
        throw error;
    }
};
window.createDocument = createDocument;

const updateDocument = async function(collection, docId, data) {
    try {
        assertFirebaseReady();

        await db.ref(`${collection}/${docId}`).update({
            ...data,
            updatedAt: Date.now()
        });

        console.log(`Document updated in ${collection}:`, docId);
    } catch (error) {
        console.error(`Error updating document in ${collection}:`, error);
        throw error;
    }
};
window.updateDocument = updateDocument;

const deleteDocument = async function(collection, docId) {
    try {
        assertFirebaseReady();
        await db.ref(`${collection}/${docId}`).remove();
        console.log(`Document deleted from ${collection}:`, docId);
    } catch (error) {
        console.error(`Error deleting document from ${collection}:`, error);
        throw error;
    }
};
window.deleteDocument = deleteDocument;

const getDocument = async function(collection, docId) {
    try {
        assertFirebaseReady();
        const snapshot = await db.ref(`${collection}/${docId}`).once('value');
        return snapshot.val();
    } catch (error) {
        console.error(`Error getting document from ${collection}:`, error);
        throw error;
    }
};
window.getDocument = getDocument;

const queryCollection = async function(collection, options = {}) {
    try {
        assertFirebaseReady();

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
        console.error(`Error querying ${collection}:`, error);
        throw error;
    }
};
window.queryCollection = queryCollection;

console.log('Kigali Mega Market Core Module Loaded');
bindInternalLinks();

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
    showAlert,
    setButtonLoading,
    showLoading,
    formatCurrency,
    formatDate,
    validateEmail,
    validatePhone,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    queryCollection,
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    redirectByRole,
    protectPage
};
