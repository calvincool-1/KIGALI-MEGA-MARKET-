const ROUTES = Object.freeze({
    home: 'index.html',
    login: 'pages/login.html',
    register: 'pages/register.html',
    'buyer-dashboard': 'pages/buyer-dashboard.html',
    'buyer-requests': 'pages/buyer-requests.html',
    'buyer-orders': 'pages/buyer-orders.html',
    'seller-dashboard': 'pages/seller-dashboard.html',
    'admin-dashboard': 'pages/admin-dashboard.html',
    'logistics-dashboard': 'pages/logistics-dashboard.html',
    setup: 'pages/setup.html',
    'database-setup': 'pages/database-setup.html',
    'auth-test': 'pages/auth-test.html',
    'system-test': 'pages/system-test.html'
});

const ROLE_ROUTES = Object.freeze({
    buyer: 'buyer-dashboard',
    seller: 'seller-dashboard',
    admin: 'admin-dashboard',
    logistics: 'logistics-dashboard'
});

function isPagesDirectory(pathname = window.location.pathname) {
    return pathname.replace(/\\/g, '/').toLowerCase().includes('/pages/');
}

function splitRouteTarget(target = '') {
    const value = String(target).trim();

    if (!value || value.startsWith('#')) {
        return { base: value, suffix: '' };
    }

    const match = value.match(/^([^?#]+)(.*)$/);
    return {
        base: match ? match[1] : value,
        suffix: match ? match[2] : ''
    };
}

function resolveRoute(target = 'home') {
    const { base, suffix } = splitRouteTarget(target);
    const mappedBase = ROUTES[base] || base;

    if (!mappedBase || mappedBase.startsWith('#') || /^[a-z]+:/i.test(mappedBase)) {
        return `${mappedBase}${suffix}`;
    }

    const normalizedBase = mappedBase
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '');

    if (isPagesDirectory()) {
        if (normalizedBase.startsWith('pages/')) {
            return `${normalizedBase.slice('pages/'.length)}${suffix}`;
        }

        return `../${normalizedBase}${suffix}`;
    }

    return `${normalizedBase}${suffix}`;
}

function getRouteForRole(role) {
    return ROLE_ROUTES[role] || null;
}

function navigateTo(target, options = {}) {
    const destination = resolveRoute(target);

    if (options.replace) {
        window.location.replace(destination);
    } else {
        window.location.href = destination;
    }

    return destination;
}

function bindInternalLinks(root = document) {
    const nodes = root.querySelectorAll('[data-route]');

    nodes.forEach((node) => {
        const routeTarget = node.getAttribute('data-route');

        if (!routeTarget) {
            return;
        }

        const resolvedTarget = resolveRoute(routeTarget);

        if (node.tagName === 'A') {
            node.setAttribute('href', resolvedTarget);
            return;
        }

        if (node.dataset.routeBound === 'true') {
            return;
        }

        node.dataset.routeBound = 'true';
        node.addEventListener('click', (event) => {
            if (node.disabled) {
                return;
            }

            event.preventDefault();
            navigateTo(routeTarget);
        });
    });

    return nodes.length;
}

const routeApi = {
    ROUTES,
    ROLE_ROUTES,
    isPagesDirectory,
    resolveRoute,
    getRouteForRole,
    navigateTo,
    bindInternalLinks
};

window.appRoutes = routeApi;
window.resolveRoute = resolveRoute;
window.navigateTo = navigateTo;
window.bindInternalLinks = bindInternalLinks;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bindInternalLinks());
} else {
    bindInternalLinks();
}

export {
    ROUTES,
    ROLE_ROUTES,
    isPagesDirectory,
    resolveRoute,
    getRouteForRole,
    navigateTo,
    bindInternalLinks
};
