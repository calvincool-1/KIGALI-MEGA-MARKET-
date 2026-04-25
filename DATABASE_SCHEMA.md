# 🗄️ Kigali Mega Market - Database Schema

## Database Type: Firebase Realtime Database

## 📊 Database Structure

### 1. Users Collection
**Path:** `/users/{userId}`

```json
{
  "users": {
    "{userId}": {
      "uid": "string (Firebase Auth UID)",
      "email": "string (unique)",
      "fullName": "string",
      "phone": "string",
      "userType": "buyer | seller | logistics | admin",
      "verified": "boolean",
      "createdAt": "timestamp",
      
      // Seller-specific fields
      "businessName": "string (optional)",
      "businessAddress": "string (optional)",
      
      // Logistics-specific fields
      "vehicleType": "motorcycle | car | van | truck (optional)",
      "licenseNumber": "string (optional)"
    }
  }
}
```

**Indexes:**
- Primary: `userId` (auto-indexed)
- Query: `userType` (for filtering by role)
- Query: `verified` (for admin verification workflow)

**Relationships:**
- One-to-Many with Products (seller → products)
- One-to-Many with Orders (buyer → orders)
- One-to-Many with Orders (logistics → deliveries)

---

### 2. Products Collection
**Path:** `/products/{productId}`

```json
{
  "products": {
    "{productId}": {
      "name": "string",
      "description": "string",
      "price": "number (RWF)",
      "stock": "number",
      "category": "electronics | fashion | food | home | beauty | other",
      "sellerId": "string (references users/{userId})",
      "sellerName": "string",
      "status": "pending | approved | rejected",
      "createdAt": "timestamp"
    }
  }
}
```

**Indexes:**
- Primary: `productId` (auto-indexed)
- Query: `sellerId` (for seller's products)
- Query: `status` (for admin approval workflow)
- Query: `category` (for product filtering)

**Relationships:**
- Many-to-One with Users (product → seller)
- Many-to-Many with Orders (through order items)

---

### 3. Orders Collection
**Path:** `/orders/{orderId}`

```json
{
  "orders": {
    "{orderId}": {
      "buyerId": "string (references users/{userId})",
      "buyerName": "string",
      "items": [
        {
          "id": "string (references products/{productId})",
          "name": "string",
          "price": "number",
          "quantity": "number",
          "sellerId": "string (references users/{userId})"
        }
      ],
      "total": "number (RWF)",
      "status": "pending | confirmed | preparing | ready | in_transit | delivered | cancelled",
      "logisticsId": "string (references users/{userId}, optional)",
      "logisticsName": "string (optional)",
      "pickupTime": "timestamp (optional)",
      "deliveryTime": "timestamp (optional)",
      "createdAt": "timestamp"
    }
  }
}
```

**Indexes:**
- Primary: `orderId` (auto-indexed)
- Query: `buyerId` (for buyer's orders)
- Query: `status` (for order tracking)
- Query: `logisticsId` (for logistics deliveries)

**Relationships:**
- Many-to-One with Users (order → buyer)
- Many-to-One with Users (order → logistics)
- Many-to-Many with Products (through items array)
- Many-to-One with Users (order items → seller)

---

## 🔗 Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ - uid (PK)                                               │   │
│  │ - email                                                  │   │
│  │ - fullName                                               │   │
│  │ - userType (buyer|seller|logistics|admin)                │   │
│  │ - verified                                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ (seller)           │ (buyer)            │ (logistics)
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PRODUCTS      │  │     ORDERS      │  │     ORDERS      │
│  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │ - id (PK) │  │  │  │ - id (PK) │  │  │  │ - id (PK) │  │
│  │ - name    │  │  │  │ - buyerId │──┼──┼──│ - logisticsId│
│  │ - price   │  │  │  │ - items[] │  │  │  │ - status  │  │
│  │ - stock   │  │  │  │ - total   │  │  │  │ - pickup  │  │
│  │ - sellerId│──┼──┼──│ - status  │  │  │  │ - delivery│  │
│  │ - status  │  │  │  └───────────┘  │  │  └───────────┘  │
│  └───────────┘  │  └─────────────────┘  └─────────────────┘
└─────────────────┘           │
         ▲                    │
         │                    │
         └────────────────────┘
              (items array)
```

---

## 🔐 Security Rules

### Users Collection
- **Read:** Authenticated users can read any user profile
- **Write:** Users can only update their own profile OR admin can update any profile
- **Validation:** Required fields must be present

### Products Collection
- **Read:** Public (anyone can browse products)
- **Write:** Only sellers and admins can create/update products
- **Validation:** All required fields, price > 0, stock >= 0, valid category and status

### Orders Collection
- **Read:** Authenticated users only (filtered by role)
- **Write:** Authenticated users can create/update orders
- **Validation:** Required fields, total > 0, valid status

---

## 📈 Query Patterns

### 1. Get Seller's Products
```javascript
db.ref('products')
  .orderByChild('sellerId')
  .equalTo(sellerId)
  .once('value')
```

### 2. Get Approved Products
```javascript
db.ref('products')
  .orderByChild('status')
  .equalTo('approved')
  .once('value')
```

### 3. Get Buyer's Orders
```javascript
db.ref('orders')
  .orderByChild('buyerId')
  .equalTo(buyerId)
  .once('value')
```

### 4. Get Available Deliveries
```javascript
db.ref('orders')
  .orderByChild('status')
  .equalTo('ready')
  .once('value')
```

### 5. Get Logistics Active Deliveries
```javascript
db.ref('orders')
  .orderByChild('logisticsId')
  .equalTo(logisticsId)
  .once('value')
```

### 6. Get Pending Users (Admin)
```javascript
db.ref('users')
  .orderByChild('verified')
  .equalTo(false)
  .once('value')
```

---

## 🔄 Data Flow Examples

### 1. Product Creation Flow
```
Seller → Create Product → products/{productId}
                          ↓
                    status: 'pending'
                          ↓
Admin → Approve Product → status: 'approved'
                          ↓
                    Visible to Buyers
```

### 2. Order Lifecycle
```
Buyer → Create Order → orders/{orderId}
                       status: 'pending'
                          ↓
Seller → Confirm → status: 'confirmed'
                          ↓
Seller → Prepare → status: 'ready'
                          ↓
Logistics → Accept → status: 'in_transit'
                     logisticsId: {uid}
                          ↓
Logistics → Deliver → status: 'delivered'
                      deliveryTime: {timestamp}
```

### 3. User Verification Flow
```
User → Register → users/{userId}
                  verified: false
                          ↓
Admin → Review → verified: true
                          ↓
                  User can login
```

---

## 💾 Data Integrity Rules

### 1. Referential Integrity
- `products.sellerId` must reference valid `users.uid` with `userType: 'seller'`
- `orders.buyerId` must reference valid `users.uid` with `userType: 'buyer'`
- `orders.logisticsId` must reference valid `users.uid` with `userType: 'logistics'`
- `orders.items[].id` must reference valid `products.productId`

### 2. Business Logic Constraints
- Product stock must be >= 0
- Product price must be > 0
- Order total must match sum of (item.price × item.quantity)
- Order items quantity must be <= product stock
- Only verified users can perform actions
- Only approved products are visible to buyers

### 3. Status Transitions
**Product Status:**
- pending → approved (admin only)
- pending → rejected (admin only)

**Order Status:**
- pending → confirmed (seller)
- confirmed → ready (seller)
- ready → in_transit (logistics)
- in_transit → delivered (logistics)
- Any status → cancelled (buyer/admin)

---

## 🧪 Test Data

### Admin Account
- Email: admin@kigalimegamarket.com
- Password: admin123456
- Type: admin
- Verified: true

### Test Buyer
- Email: buyer@test.com
- Password: buyer123
- Type: buyer
- Verified: true

### Test Seller
- Email: seller@test.com
- Password: seller123
- Type: seller
- Business: Test Shop
- Verified: true

### Test Logistics
- Email: logistics@test.com
- Password: logistics123
- Type: logistics
- Vehicle: motorcycle
- Verified: true

---

## 📊 Database Indexes (Recommended)

For optimal query performance, create these indexes in Firebase Console:

1. **users**
   - `userType` (ascending)
   - `verified` (ascending)

2. **products**
   - `sellerId` (ascending)
   - `status` (ascending)
   - `category` (ascending)

3. **orders**
   - `buyerId` (ascending)
   - `status` (ascending)
   - `logisticsId` (ascending)
   - `createdAt` (descending)

---

## 🔧 Maintenance Operations

### Backup Strategy
- Use Firebase Console to export data regularly
- Store backups in secure location
- Test restore procedures

### Data Cleanup
- Archive old orders (> 1 year)
- Remove rejected products (> 30 days)
- Clean up unverified users (> 7 days)

### Monitoring
- Track database size
- Monitor read/write operations
- Set up alerts for unusual activity

---

**Database Version:** 1.0
**Last Updated:** 2024
**Status:** Production Ready ✅
