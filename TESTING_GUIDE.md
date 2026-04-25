# Quick Testing Guide - Authentication System

## 🚀 Quick Start

### Step 1: Initialize Database (First Time Only)
1. Open `pages/setup.html` in your browser
2. Click "Initialize Database" button
3. Admin account created:
   - **Email:** `admin@kigalimegamarket.com`
   - **Password:** `admin123456`

### Step 2: Test Authentication Flow
1. Open `pages/auth-test.html` in your browser
2. Click "Check Auth State" - should show "No user logged in"
3. Click "Test Login" - should login successfully
4. You'll be redirected to admin dashboard in 3 seconds

### Step 3: Test Session Persistence
1. After logging in, close the browser completely
2. Reopen browser and go to `index.html`
3. You should be automatically redirected to admin dashboard
4. This confirms session persistence is working ✅

### Step 4: Test Registration
1. Logout from admin dashboard
2. Go to `pages/register.html`
3. Register a new buyer account:
   - Full Name: Test Buyer
   - Email: buyer@test.com
   - Phone: +250788123456
   - Password: test123456
   - Role: Buyer
4. After registration, you'll be redirected to login page
5. Try to login - should show "pending verification" message ✅

### Step 5: Test Admin Verification
1. Login as admin
2. Go to admin dashboard
3. Find the pending user in "User Verification" tab
4. Click "Approve" to verify the user
5. Logout

### Step 6: Test Verified User Login
1. Login with the buyer account you created
2. Should successfully login and redirect to buyer dashboard ✅

### Step 7: Test Page Protection
1. While logged in as buyer, try to access `pages/seller-dashboard.html`
2. Should show error and redirect to buyer dashboard ✅
3. Try to access `pages/admin-dashboard.html`
4. Should show error and redirect to buyer dashboard ✅

## 🧪 Test Scenarios

### ✅ Successful Login Test
```
1. Go to pages/login.html
2. Enter: admin@kigalimegamarket.com / admin123456
3. Click Login
4. Expected: Success message → Redirect to admin-dashboard.html
```

### ✅ Failed Login Test (Wrong Password)
```
1. Go to pages/login.html
2. Enter: admin@kigalimegamarket.com / wrongpassword
3. Click Login
4. Expected: Error message "Incorrect password. Please try again."
```

### ✅ Failed Login Test (Unverified User)
```
1. Register new user (don't verify with admin)
2. Try to login with that user
3. Expected: Error message "Your account is pending admin verification..."
```

### ✅ Session Persistence Test
```
1. Login successfully
2. Close browser completely
3. Reopen browser
4. Visit index.html
5. Expected: Automatic redirect to your dashboard
```

### ✅ Homepage Redirect Test
```
1. Login successfully
2. Visit index.html
3. Expected: Immediate redirect to your dashboard (no landing page shown)
```

### ✅ Registration Test
```
1. Go to pages/register.html
2. Fill all fields correctly
3. Click Create Account
4. Expected: Success message → Redirect to login.html after 3 seconds
```

### ✅ Logout Test
```
1. Login successfully
2. Click Logout button
3. Expected: Redirect to index.html
4. Try to access dashboard
5. Expected: Redirect to login.html
```

## 🔍 What to Check in Browser Console

### On Successful Login:
```
✅ Firebase initialized successfully
✅ User logged in: {uid} Role: {role}
Redirecting to: {role}-dashboard.html
```

### On Registration:
```
✅ Firebase initialized successfully
✅ User registered: {uid} Role: {role}
```

### On Page Load (Logged In):
```
✅ Firebase initialized successfully
✅ Auth persistence enabled
User already logged in, redirecting to dashboard...
```

## 🐛 Common Issues & Solutions

### Issue: "Firebase initialization failed"
**Solution:** Check `config/firebase.js` has correct credentials

### Issue: "User data not found"
**Solution:** Run `pages/setup.html` to initialize database

### Issue: Not redirected after login
**Solution:** Check browser console for errors. Clear cache and try again.

### Issue: Session not persisting
**Solution:** Enable localStorage in browser settings. Try incognito mode.

### Issue: Can't login as admin
**Solution:** Run setup.html again to recreate admin account

## 📊 Test Results Checklist

- [ ] Admin login works
- [ ] Buyer registration works
- [ ] Seller registration works
- [ ] Unverified user cannot login
- [ ] Admin can verify users
- [ ] Verified user can login
- [ ] Session persists after browser restart
- [ ] Homepage redirects logged-in users
- [ ] Login page redirects logged-in users
- [ ] Dashboard pages are protected
- [ ] Wrong role cannot access other dashboards
- [ ] Logout works correctly
- [ ] Error messages are user-friendly
- [ ] Loading states show during operations

## 🎯 Quick Test Commands

### Test in Chrome:
```bash
start chrome "e:\FINTECH PROJECT\KIGALI MEGA MARKET\pages\auth-test.html"
```

### Test in Firefox:
```bash
start firefox "e:\FINTECH PROJECT\KIGALI MEGA MARKET\pages\auth-test.html"
```

### Test in Edge:
```bash
start msedge "e:\FINTECH PROJECT\KIGALI MEGA MARKET\pages\auth-test.html"
```

## 📝 Test User Accounts

### Admin Account (Pre-created)
- Email: `admin@kigalimegamarket.com`
- Password: `admin123456`
- Role: Admin
- Verified: Yes

### Create Test Buyer
- Email: `buyer@test.com`
- Password: `test123456`
- Role: Buyer
- Verified: No (needs admin approval)

### Create Test Seller
- Email: `seller@test.com`
- Password: `test123456`
- Role: Seller
- Business Name: Test Shop
- Verified: No (needs admin approval)

## 🔐 Security Checks

- [ ] Passwords are not visible in console
- [ ] Auth tokens are stored securely
- [ ] Unverified users cannot access dashboards
- [ ] Users cannot access wrong role dashboards
- [ ] Logout clears all session data
- [ ] Database rules enforce permissions

## ✨ Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Visit index.html (not logged in) | Show landing page |
| Visit index.html (logged in) | Redirect to dashboard |
| Visit login.html (logged in) | Redirect to dashboard |
| Visit register.html (logged in) | Redirect to dashboard |
| Login with correct credentials | Success → Redirect to dashboard |
| Login with wrong password | Error message shown |
| Login with unverified account | Verification message shown |
| Register new account | Success → Redirect to login |
| Logout | Redirect to homepage |
| Access dashboard (not logged in) | Redirect to login |
| Access wrong role dashboard | Error → Redirect to correct dashboard |
| Close and reopen browser | Session maintained |

---

**All tests passing = Authentication system working correctly! ✅**
