/**
 * Firebase Integration Test Script
 * Tests registration, login, and user data saving
 * Run with: npx ts-node scripts/test-firebase.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, Timestamp } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test data
const TEST_EMAIL = `test-${Date.now()}@miwill-test.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_USER_DATA = {
  email: TEST_EMAIL,
  phone: '+27123456789',
  full_name: 'Test User',
  id_number: '1234567890123',
  policy_number: 'POL-TEST-001',
  profile_picture_path: '/Users/test/Desktop/MiWill-App/storage/profile_pictures/test-user/profile.jpg',
  notification_frequency: 'weekly',
  custom_frequency_days: undefined,
};

async function testRegistration() {
  console.log('\n🧪 Testing Registration...');
  console.log(`Email: ${TEST_EMAIL}`);
  
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const userId = userCredential.user.uid;
    console.log(`✅ Auth user created: ${userId}`);
    
    // Create user document in Firestore
    const userDoc = {
      user_id: userId,
      email: TEST_USER_DATA.email,
      phone: TEST_USER_DATA.phone,
      full_name: TEST_USER_DATA.full_name,
      id_number: TEST_USER_DATA.id_number,
      policy_number: TEST_USER_DATA.policy_number,
      profile_picture_path: TEST_USER_DATA.profile_picture_path,
      notification_frequency: TEST_USER_DATA.notification_frequency,
      custom_frequency_days: TEST_USER_DATA.custom_frequency_days,
      account_created: Timestamp.now(),
      last_seen: Timestamp.now(),
      email_verified: false,
      phone_verified: false,
      is_active: true,
      onboarding_completed: false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    
    const { setDoc } = await import('firebase/firestore');
    await setDoc(doc(db, 'users', userId), userDoc);
    console.log('✅ User document created in Firestore');
    
    // Verify data was saved correctly
    const savedDoc = await getDoc(doc(db, 'users', userId));
    if (savedDoc.exists()) {
      const data = savedDoc.data();
      console.log('\n📋 Saved User Data:');
      console.log(`  - user_id: ${data.user_id}`);
      console.log(`  - email: ${data.email}`);
      console.log(`  - full_name: ${data.full_name}`);
      console.log(`  - phone: ${data.phone}`);
      console.log(`  - id_number: ${data.id_number}`);
      console.log(`  - policy_number: ${data.policy_number}`);
      console.log(`  - profile_picture_path: ${data.profile_picture_path}`);
      console.log(`  - notification_frequency: ${data.notification_frequency}`);
      console.log(`  - is_active: ${data.is_active}`);
      console.log(`  - onboarding_completed: ${data.onboarding_completed}`);
      
      // Validate all required fields
      const requiredFields = [
        'user_id', 'email', 'phone', 'full_name', 'id_number', 
        'policy_number', 'notification_frequency', 'account_created',
        'last_seen', 'email_verified', 'phone_verified', 'is_active',
        'onboarding_completed', 'created_at', 'updated_at'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in data));
      if (missingFields.length > 0) {
        console.error(`❌ Missing fields: ${missingFields.join(', ')}`);
        return false;
      }
      
      console.log('\n✅ All required fields present!');
      return { userId, email: TEST_EMAIL, password: TEST_PASSWORD };
    } else {
      console.error('❌ User document not found after creation');
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Registration failed: ${error.message}`);
    return false;
  }
}

async function testLogin(email: string, password: string) {
  console.log('\n🧪 Testing Login...');
  
  try {
    // Sign out first (in case already logged in)
    await signOut(auth);
    
    // Sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Login successful: ${userCredential.user.uid}`);
    
    // Verify user document exists
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      console.log('✅ User document found in Firestore');
      return true;
    } else {
      console.error('❌ User document not found after login');
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Login failed: ${error.message}`);
    return false;
  }
}

async function cleanup(userId: string) {
  console.log('\n🧹 Cleaning up test data...');
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', userId));
    console.log('✅ Test user document deleted');
    
    // Note: Auth user deletion requires Admin SDK, so we'll leave it
    // The test email is unique, so it won't conflict
    console.log('ℹ️  Auth user left in Firebase (requires Admin SDK to delete)');
  } catch (error: any) {
    console.error(`⚠️  Cleanup warning: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting Firebase Integration Tests\n');
  console.log('=' .repeat(50));
  
  // Test 1: Registration
  const registrationResult = await testRegistration();
  if (!registrationResult) {
    console.error('\n❌ Registration test failed. Stopping tests.');
    process.exit(1);
  }
  
  // Test 2: Login
  const loginResult = await testLogin(registrationResult.email, registrationResult.password);
  if (!loginResult) {
    console.error('\n❌ Login test failed.');
    process.exit(1);
  }
  
  // Cleanup
  await cleanup(registrationResult.userId);
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests passed!');
  console.log('\n📝 Summary:');
  console.log('  ✅ User registration works');
  console.log('  ✅ User data saved to Firestore correctly');
  console.log('  ✅ Login authentication works');
  console.log('  ✅ All required fields are present');
  
  process.exit(0);
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

