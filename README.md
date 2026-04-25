# Kigali Mega Market - E-Commerce Platform

A full-stack digital commerce platform enabling structured interaction between buyers, sellers, administrators, and logistics partners.

## Features

### For Buyers
- Browse verified products with search functionality
- Shopping cart management
- Secure checkout process
- Real-time order tracking
- Order history

### For Sellers
- Product listing and inventory management
- Order processing and fulfillment
- Sales analytics dashboard
- Product approval workflow

### For Logistics Partners
- Available delivery listings
- Pickup and delivery management
- Real-time status updates
- Delivery tracking

### For Administrators
- User verification and approval
- Product approval system
- Order monitoring
- Dispute resolution
- Platform analytics

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **Hosting**: Can be deployed on any static hosting service

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "Kigali Mega Market"
3. Enable **Authentication** > **Email/Password** sign-in method
4. Enable **Realtime Database** with the following rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('userType').val() === 'admin'"
      }
    },
    "products": {
      ".read": true,
      "$productId": {
        ".write": "auth != null && (root.child('users').child(auth.uid).child('userType').val() === 'seller' || root.child('users').child(auth.uid).child('userType').val() === 'admin')"
      }
    },
    "orders": {
      ".read": "auth != null",
      "$orderId": {
        ".write": "auth != null"
      }
    }
  }
}
```

5. Get your Firebase configuration from Project Settings > General > Your apps
6. Copy the configuration object

### 2. Update Firebase Configuration

Open `config/firebase.js` and replace with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Initialize Database

1. Open `pages/setup.html` in your browser
2. Click "Initialize Database" button
3. This creates the admin account:
   - Email: `admin@kigalimegamarket.com`
   - Password: `admin123456`

### 4. Run the Application

#### Option 1: Using Live Server (Recommended)
1. Install Live Server extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

#### Option 2: Using Python
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`

#### Option 3: Using Node.js
```bash
npx http-server
```

## User Workflows

### Buyer Workflow
1. Register as a buyer
2. Wait for admin verification
3. Login and browse products
4. Add products to cart
5. Checkout and place order
6. Track order status

### Seller Workflow
1. Register as a seller with business details
2. Wait for admin verification
3. Login and add products
4. Wait for product approval
5. Manage inventory and process orders
6. Mark orders as ready for pickup

### Logistics Workflow
1. Register as logistics partner
2. Wait for admin verification
3. Login and view available deliveries
4. Accept delivery assignments
5. Update delivery status
6. Mark deliveries as completed

### Admin Workflow
1. Login with admin credentials
2. Verify pending users
3. Approve/reject product listings
4. Monitor all orders
5. Resolve disputes

## Database Schema

### Users Collection
```
users/
  {userId}/
    - uid: string
    - email: string
    - fullName: string
    - phone: string
    - userType: "buyer" | "seller" | "logistics" | "admin"
    - verified: boolean
    - businessName: string (sellers only)
    - businessAddress: string (sellers only)
    - vehicleType: string (logistics only)
    - licenseNumber: string (logistics only)
    - createdAt: timestamp
```

### Products Collection
```
products/
  {productId}/
    - name: string
    - description: string
    - price: number
    - stock: number
    - category: string
    - sellerId: string
    - sellerName: string
    - status: "pending" | "approved" | "rejected"
    - createdAt: timestamp
```

### Orders Collection
```
orders/
  {orderId}/
    - buyerId: string
    - buyerName: string
    - items: array
    - total: number
    - status: "pending" | "confirmed" | "ready" | "in_transit" | "delivered" | "cancelled"
    - logisticsId: string (optional)
    - logisticsName: string (optional)
    - pickupTime: timestamp (optional)
    - deliveryTime: timestamp (optional)
    - createdAt: timestamp
```

## File Structure

```
KIGALI MEGA MARKET/
├── index.html                 # Landing page
├── css/
│   ├── main.css              # Global styles and design system
│   └── landing.css           # Landing page specific styles
├── js/
│   └── app.js                # Core application logic
├── config/
│   └── firebase.js           # Firebase configuration
├── pages/
│   ├── register.html         # User registration
│   ├── login.html            # User login
│   ├── buyer-dashboard.html  # Buyer product browsing
│   ├── buyer-orders.html     # Buyer order tracking
│   ├── seller-dashboard.html # Seller management
│   ├── admin-dashboard.html  # Admin panel
│   ├── logistics-dashboard.html # Logistics management
│   └── setup.html            # Database initialization
└── README.md                 # This file
```

## Security Features

- Firebase Authentication for secure user management
- Role-based access control
- Admin verification for all users
- Product approval workflow
- Secure database rules

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Testing Checklist

1. ✓ User registration for all roles
2. ✓ Admin verification workflow
3. ✓ Product listing and approval
4. ✓ Shopping cart functionality
5. ✓ Order placement and tracking
6. ✓ Seller order management
7. ✓ Logistics delivery workflow
8. ✓ Real-time database updates

## Future Enhancements

- Payment gateway integration
- Image upload for products
- Email notifications
- SMS notifications
- Advanced search and filters
- Product reviews and ratings
- Analytics dashboard
- Mobile app version

## Support

For issues or questions, please contact the development team.

## License

© 2024 Kigali Mega Market. All rights reserved.
