# ⚡ PromptHub v2 – Premium AI Prompt Sharing Platform

## 🚀 Changes in This Version

### Fixes & New Features
1. ✅ Removed all user-side login/register/profile/saved pages (no user auth on public side)
2. ✅ Removed all sample/demo data — shows only real Firebase data
3. ✅ Added **Contact** page with form (messages go to admin)
4. ✅ Added **About** page with mission, values, stats, Alvortix section
5. ✅ Admin **Messages** page to receive & reply to contact messages
6. ✅ Brand new **Admin Login** page with email + Google sign-in
7. ✅ Admin dashboard now works correctly with proper authentication
8. ✅ Testimonials auto-scroll carousel (6 reviews × infinite loop)
9. ✅ Donate section on prompt detail page with **QR code** + UPI ID `mageshwaranm@nyes`
10. ✅ Footer: "Developed by **Alvortix Tech Services**" on all pages

## 📁 Structure

```
prompthub/
├── index.html                # Landing page (no user auth)
├── assets/
│   └── qr-donate.jpg         # ✅ Your Navi UPI QR code
├── css/
│   ├── main.css              # Design system + new donate/carousel styles
│   └── animations.css        # All animations
├── js/
│   ├── firebase-config.js    # Firebase + Cloudinary + DB helpers
│   ├── admin-auth.js         # Admin-only auth (NEW)
│   ├── utils.js              # No user auth — public utilities
│   └── main.js               # (legacy, not used)
├── pages/
│   ├── feed.html             # Prompt feed + filters
│   ├── prompt.html           # Detail + DONATE section with QR
│   ├── search.html           # Search page
│   ├── categories.html       # Categories
│   ├── videos.html           # AI Videos
│   ├── about.html            # NEW: About page
│   └── contact.html          # NEW: Contact page → saves to Firestore
└── admin/
    ├── login.html            # NEW: Admin-only login
    ├── index.html            # Dashboard (fixed auth)
    ├── upload.html           # Upload/edit prompts
    ├── posts.html            # Manage all posts
    ├── users.html            # Manage users + grant admin
    ├── messages.html         # NEW: View contact messages
    └── analytics.html        # Charts & analytics
```

## 🔐 Admin Setup

### Step 1: Create your Firebase account
1. Go to `admin/login.html`
2. Sign in with Google or Email/Password
3. Your account is created in Firebase Auth

### Step 2: Grant admin role (one-time)
Open Firebase Console → Firestore → Create document:
- **Collection**: `users`
- **Document ID**: your Firebase UID (from Auth → Users)
- **Fields**: `role: "admin"`, `displayName: "Your Name"`, `email: "your@email.com"`

**Or** use the helper in admin panel:
- Go to `admin/users.html` → "Grant Admin Access" section
- Paste your UID → Click "Grant Admin"

### Step 3: Done! Access admin panel
- `admin/login.html` → sign in → redirects to dashboard

## 💳 Donate UPI Setup
The QR code image (`assets/qr-donate.jpg`) is your Navi UPI QR code.
UPI ID: `mageshwaranm@nyes`
Shown on every prompt detail page automatically.

## 📬 Contact Messages
- Users submit form on `/pages/contact.html`
- Messages saved to Firestore `contacts` collection
- Admin reads them at `admin/messages.html`
- Click any message to view full text + reply via email

## 🚀 Deploy
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```
