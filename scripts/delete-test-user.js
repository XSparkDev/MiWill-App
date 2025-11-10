/**
 * Helper script to delete a test user from Firebase
 * Run this if you need to clean up a test account
 * 
 * Usage: node scripts/delete-test-user.js <email>
 */

const admin = require('firebase-admin');

// You'll need to add your Firebase Admin SDK credentials
// Download from Firebase Console > Project Settings > Service Accounts
// Save as service-account-key.json in the project root

try {
  const serviceAccount = require('../service-account-key.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error: Could not find service-account-key.json');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/delete-test-user.js <email>');
  process.exit(1);
}

async function deleteUser(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.uid} (${user.email})`);
    
    // Delete user from Auth
    await admin.auth().deleteUser(user.uid);
    console.log('✅ Deleted user from Firebase Auth');
    
    // Delete user document from Firestore
    await admin.firestore().collection('users').doc(user.uid).delete();
    console.log('✅ Deleted user document from Firestore');
    
    console.log('\n✅ User successfully deleted!');
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
  }
}

deleteUser(email);

