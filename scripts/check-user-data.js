const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserData() {
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log('\n📊 FIREBASE DATABASE CHECK\n');
    console.log(`Found ${usersSnapshot.size} user(s)\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      console.log(`👤 User: ${userData.full_name} (${userData.email})`);
      console.log(`   ID: ${userDoc.id}`);
      
      // Check assets
      const assetsSnapshot = await db.collection('assets')
        .where('user_id', '==', userDoc.id)
        .where('is_active', '==', true)
        .get();
      
      console.log(`\n   🏠 Assets (${assetsSnapshot.size}):`);
      assetsSnapshot.forEach(doc => {
        const asset = doc.data();
        console.log(`      - ${asset.asset_name} (${asset.asset_type})`);
      });
      
      // Check policies
      const policiesSnapshot = await db.collection('policies')
        .where('user_id', '==', userDoc.id)
        .where('is_active', '==', true)
        .get();
      
      console.log(`\n   🛡️  Policies (${policiesSnapshot.size}):`);
      policiesSnapshot.forEach(doc => {
        const policy = doc.data();
        console.log(`      - ${policy.policy_number} (${policy.insurance_company} - ${policy.policy_type})`);
      });
      
      console.log('\n' + '='.repeat(60) + '\n');
    }
    
    console.log('✅ This is REAL data from Firebase, not mock data!');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkUserData();

