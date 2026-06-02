// ================================================
// PROMPTHUB - AUTHENTICATION
// ================================================

let currentUser = null;

// Auth state listener
auth.onAuthStateChanged(async (user) => {
  currentUser = user;
  if (user) {
    await handleSignedIn(user);
  } else {
    handleSignedOut();
  }
});

async function handleSignedIn(user) {
  // Update UI
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const userAvatar = document.getElementById('userAvatar');
  
  if (authButtons) authButtons.style.display = 'none';
  if (userMenu) userMenu.style.display = 'flex';
  
  if (userAvatar) {
    userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=7C3AED&color=fff`;
    userAvatar.addEventListener('click', () => {
      const menu = document.getElementById('dropdownMenu');
      if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
  }

  // Check admin role
  const userData = await DB.getUser(user.uid);
  if (userData?.role === 'admin') {
    const adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.style.display = 'flex';
  }

  // Ensure user exists in Firestore
  if (!userData) {
    await DB.createUser(user.uid, {
      displayName: user.displayName || 'Anonymous',
      email: user.email,
      photoURL: user.photoURL || '',
      bio: ''
    });
  }
}

function handleSignedOut() {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  if (authButtons) authButtons.style.display = 'flex';
  if (userMenu) userMenu.style.display = 'none';
}

// Sign out
function signOutUser() {
  auth.signOut().then(() => {
    showToast('Logged out successfully', 'success');
    window.location.href = '/index.html';
  });
}

// Google Sign In
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    showToast('Welcome back, ' + (result.user.displayName || 'User') + '!', 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 1000);
  } catch (error) {
    showToast('Google sign-in failed: ' + error.message, 'error');
  }
}

// Email Sign Up
async function signUpWithEmail(email, password, displayName) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({ displayName });
    await DB.createUser(result.user.uid, {
      displayName,
      email,
      photoURL: '',
      bio: ''
    });
    showToast('Account created successfully! 🎉', 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 1000);
  } catch (error) {
    const messages = {
      'auth/email-already-in-use': 'Email already in use.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.'
    };
    showToast(messages[error.code] || error.message, 'error');
  }
}

// Email Sign In
async function signInWithEmail(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    showToast('Welcome back!', 'success');
    setTimeout(() => { window.location.href = '/index.html'; }, 1000);
  } catch (error) {
    const messages = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    showToast(messages[error.code] || error.message, 'error');
  }
}

// Forgot Password
async function sendPasswordReset(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    showToast('Password reset email sent!', 'success');
  } catch (error) {
    showToast('Error: ' + error.message, 'error');
  }
}

// Require auth (redirect if not logged in)
function requireAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = '/pages/login.html';
      } else {
        resolve(user);
      }
    });
  });
}

// Require admin
async function requireAdmin() {
  const user = await requireAuth();
  const userData = await DB.getUser(user.uid);
  if (userData?.role !== 'admin') {
    window.location.href = '/index.html';
    return null;
  }
  return { user, userData };
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  const dropdownMenu = document.getElementById('dropdownMenu');
  if (userMenu && dropdownMenu && !userMenu.contains(e.target)) {
    dropdownMenu.style.display = 'none';
  }
});
