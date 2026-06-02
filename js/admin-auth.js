// ================================================
// ADMIN AUTH - Only for admin pages
// ================================================
const ADMIN_EMAIL = ""; // optional: restrict to specific email

let adminUser = null;

function initAdminAuth(callback) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      
    // Smart redirect - works from both /admin/ and root
    const isInAdmin = window.location.pathname.includes('/admin/');
    window.location.href = isInAdmin ? 'login.html' : 'admin/login.html';
      return;
    }
    // Check admin role in Firestore
    try {
      const userData = await DB.getUser(user.uid);
      if (!userData || userData.role !== 'admin') {
        auth.signOut();
        
    const isInAdmin2 = window.location.pathname.includes('/admin/');
    window.location.href = isInAdmin2 ? 'login.html?error=notadmin' : 'admin/login.html?error=notadmin';
        return;
      }
      adminUser = user;
      // Update admin info display
      const info = document.getElementById('adminUserInfo');
      if (info) info.textContent = `👑 ${user.displayName || user.email}`;
      const avatar = document.getElementById('adminAvatar');
      if (avatar) avatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName||'A')}&background=7C3AED&color=fff`;
      if (callback) callback(user, userData);
    } catch(e) {
      console.error('Auth check failed:', e);
      
    // Smart redirect - works from both /admin/ and root
    const isInAdmin = window.location.pathname.includes('/admin/');
    window.location.href = isInAdmin ? 'login.html' : 'admin/login.html';
    }
  });
}

async function adminSignOut() {
  await auth.signOut();
  
    // Smart redirect - works from both /admin/ and root
    const isInAdmin = window.location.pathname.includes('/admin/');
    window.location.href = isInAdmin ? 'login.html' : 'admin/login.html';
}

async function adminLoginEmail(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    const userData = await DB.getUser(result.user.uid);
    if (!userData || userData.role !== 'admin') {
      await auth.signOut();
      showToast('Access denied. Admin only.', 'error');
      return false;
    }
    return true;
  } catch(e) {
    const msgs = {
      'auth/user-not-found': 'No account found.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email.',
      'auth/too-many-requests': 'Too many attempts. Try later.'
    };
    showToast(msgs[e.code] || e.message, 'error');
    return false;
  }
}

async function adminLoginGoogle() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    const userData = await DB.getUser(result.user.uid);
    if (!userData || userData.role !== 'admin') {
      await auth.signOut();
      showToast('Access denied. Admin only.', 'error');
      return false;
    }
    return true;
  } catch(e) {
    showToast('Google sign-in failed: ' + e.message, 'error');
    return false;
  }
}

// Make user admin (run once from console)
async function makeUserAdmin(uid) {
  await db.collection('users').doc(uid).set({ role: 'admin', createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  console.log('✅ User', uid, 'is now admin');
}
