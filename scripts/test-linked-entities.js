// Firebase Linked Entities Test
// Run with: node scripts/test-linked-entities.js

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  deleteDoc,
  Timestamp,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TEST_EMAIL = `linked-${Date.now()}@miwill-test.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function createUserAndLinked() {
  console.log('\n🧪 Creating user and linked entities...');
  const cred = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
  const userId = cred.user.uid;

  const userDoc = {
    user_id: userId,
    email: TEST_EMAIL,
    phone: '+27111111111',
    full_name: 'Linked Test',
    id_number: '9901011234088',
    policy_number: 'POL-LINK-001',
    profile_picture_path: '/Users/test/Desktop/MiWill-App/storage/profile_pictures/test/profile.jpg',
    notification_frequency: 'weekly',
    account_created: Timestamp.now(),
    last_seen: Timestamp.now(),
    email_verified: false,
    phone_verified: false,
    is_active: true,
    onboarding_completed: false,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  };

  await setDoc(doc(db, 'users', userId), userDoc);

  // Attorney
  const attorneyRef = doc(collection(db, 'attorneys'));
  await setDoc(attorneyRef, {
    attorney_id: attorneyRef.id,
    user_id: userId,
    attorney_name: 'Attorney A',
    attorney_email: 'attorney@example.com',
    attorney_phone: '+27123456780',
    attorney_firm: 'Law & Co',
    attorney_address: '123 Legal St',
    relationship_type: 'estate_lawyer',
    is_primary: true,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Executor
  const executorRef = doc(collection(db, 'executors'));
  await setDoc(executorRef, {
    executor_id: executorRef.id,
    user_id: userId,
    executor_name: 'Executor E',
    executor_email: 'executor@example.com',
    executor_phone: '+27123456781',
    executor_id_number: '9001011234089',
    relationship_to_user: 'Brother',
    executor_address: '456 Estate Ave',
    is_primary: true,
    verification_status: 'pending',
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  // Secondary Contact
  const contactRef = doc(collection(db, 'secondary_contacts'));
  await setDoc(contactRef, {
    secondary_contact_id: contactRef.id,
    user_id: userId,
    contact_name: 'Secondary S',
    contact_email: 'secondary@example.com',
    contact_phone: '+27123456782',
    relationship_to_user: 'Friend',
    is_verified: false,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  return { userId, attorneyId: attorneyRef.id, executorId: executorRef.id, contactId: contactRef.id };
}

async function verifyLinked(userId) {
  console.log('\n🔍 Verifying linked entities...');

  const userSnap = await getDoc(doc(db, 'users', userId));
  if (!userSnap.exists()) throw new Error('User doc missing');

  const attorneyQ = query(collection(db, 'attorneys'), where('user_id', '==', userId));
  const attorneys = await getDocs(attorneyQ);
  if (attorneys.empty) throw new Error('Attorney not found');

  const executorQ = query(collection(db, 'executors'), where('user_id', '==', userId));
  const executors = await getDocs(executorQ);
  if (executors.empty) throw new Error('Executor not found');

  const contactQ = query(collection(db, 'secondary_contacts'), where('user_id', '==', userId));
  const contacts = await getDocs(contactQ);
  if (contacts.empty) throw new Error('Secondary contact not found');

  console.log('✅ All linked entities found and tied to user_id');
}

async function cleanup(ids) {
  console.log('\n🧹 Cleaning up test docs...');
  await deleteDoc(doc(db, 'users', ids.userId));
  await deleteDoc(doc(db, 'attorneys', ids.attorneyId));
  await deleteDoc(doc(db, 'executors', ids.executorId));
  await deleteDoc(doc(db, 'secondary_contacts', ids.contactId));
  await signOut(auth);
  console.log('✅ Cleanup complete');
}

(async () => {
  try {
    const ids = await createUserAndLinked();
    await verifyLinked(ids.userId);
    await cleanup(ids);
    console.log('\n✅ Test passed: user + linked entities');
  } catch (e) {
    console.error('❌ Test failed:', e.message);
    process.exit(1);
  }
})();
