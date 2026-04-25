import firebaseConfig from '../config/firebase.js';

// Initialize Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.database();
    window.auth = firebase.auth();
    window.storage = firebase.storage();
}

// Check authentication state
window.checkAuth = function() {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (user) {
                db.ref('users/' + user.uid).once('value').then((snapshot) => {
                    const userData = snapshot.val();
                    resolve({ user, userData });
                });
            } else {
                resolve(null);
            }
        });
    });
};

// Logout function
window.logout = function() {
    auth.signOut().then(() => {
        window.location.href = '../index.html';
    });
};

// Show alert
window.showAlert = function(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    }
};

// Format currency
window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: 'RWF'
    }).format(amount);
};

// Format date
window.formatDate = function(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
