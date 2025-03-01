// Import required Firebase modules
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
} = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collections
const suppliersCollection = collection(db, 'suppliers');

// Helper function to check if a supplier exists
async function supplierExists(name) {
  if (!name || name.trim() === '') return false;
  
  const q = query(suppliersCollection, where("name", "==", name));
  const querySnapshot = await getDocs(q);
  
  return !querySnapshot.empty;
}

// Function to add a new supplier
async function addSupplier(name, contact = '', website = '', notes = '', region = '') {
  if (!name || name.trim() === '') return null;
  
  try {
    // Check if supplier already exists
    const exists = await supplierExists(name);
    
    if (exists) {
      console.log(`Supplier already exists: ${name}`);
      return null;
    }
    
    // Create the supplier
    const supplierData = {
      name,
      contact,
      website,
      notes,
      region,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const supplierRef = await addDoc(suppliersCollection, supplierData);
    console.log(`Added supplier with ID: ${supplierRef.id} - ${name}`);
    return supplierRef.id;
  } catch (error) {
    console.error(`Error adding supplier ${name}:`, error);
    return null;
  }
}

// Main function to import suppliers
async function importSuppliers() {
  try {
    console.log('Starting to import suppliers to Firebase...');
    
    // List of suppliers to add
    // Format: [name, contact, website, notes, region]
    const suppliersToAdd = [
      ['Samurai Ken', 'Instagram @Samurai Ken', '', 'Japanese supplier', 'Japan'],
      ['korean pokemon cards wholesaler', 'Instagram @korean pokemon cards wholesaler', '', 'Korean supplier', 'Korea'],
      ['John Jung', 'Instagram @John Jung', '', 'Korean supplier', 'Korea'],
      ['Collectors Coast', 'Instagram @Collectors Coast', '', 'Korean supplier', 'Korea'],
      ['Junta Nakatsuka', 'Instagram @Junta Nakatsuka', '', 'Japanese supplier', 'Japan'],
      ['Japan pokemon Card Expert', 'Instagram @Japan pokemon Card Expert', '', 'Japanese supplier', 'Japan'],
      ['HIRO JAPAN', 'Instagram @HIRO JAPAN', '', 'Japanese supplier', 'Japan'],
      ['poke_mon_japan', 'Instagram @poke_mon_japan', '', 'Japanese supplier', 'Japan'],
      ['Yoshi', 'Instagram @Yoshi', '', 'Japanese supplier', 'Japan'],
      ['Emma', 'Instagram @Emma', '', 'Japanese supplier', 'Japan'],
      ['Pokemon.com.jp', 'Instagram @Pokemon.com.jp', '', 'Japanese supplier, also offers Chinese products', 'Japan'],
      ['Pokemon Chinese Ver', 'Instagram @Pokemon Chinese Ver', '', 'Chinese supplier', 'China'],
      ['Tina Cai', 'Alibaba contact', '', 'Chinese supplier', 'China'],
      ['Hui Zhang', 'Alibaba contact', '', 'Chinese supplier, varieties, officials, rayquaza boxes', 'China'],
      ['SISI Zhang', 'Alibaba - Yiwu Riheng E-Commerce Co., Ltd.', '', 'Chinese supplier', 'China'],
      ['Mizuki', 'Instagram @Mizuki', '', 'Japanese supplier', 'Japan'],
      ['Japanese TCG Sell and buy', 'Instagram @Japanese TCG Sell and buy', '', 'Japanese supplier', 'Japan'],
      ['Carol Chen Zhengzhou', 'Alibaba contact', '', 'Chinese supplier', 'China'],
      ['Buyee', 'Website', 'https://buyee.jp', 'Japanese proxy service', 'Japan'],
      ['Jiake Yiwu', 'Alibaba contact', '', 'Chinese supplier', 'China'],
      ['kyosho japanese pokemon card', 'Instagram @kyosho japanese pokemon card', '', 'Japanese supplier', 'Japan'],
      ['japanese tcg rikiya', 'Instagram @japanese tcg rikiya', '', 'Japanese supplier', 'Japan'],
      ['mintman', 'Instagram @mintman', '', 'Japanese supplier', 'Japan'],
      ['tcgex', 'Instagram @tcgex', '', 'Japanese supplier', 'Japan'],
      ['takahiro', 'Instagram @takahiro', '', 'Japanese supplier', 'Japan'],
      ['Camin Pokemon', 'Unknown contact', '', 'Chinese supplier', 'China'],
      ['Creative toys', 'Previous supplier', '', 'From previous imports', 'Unknown'],
      ['Rebel', 'Previous supplier', '', 'From previous imports', 'Unknown']
    ];
    
    // Add each supplier
    for (const [name, contact, website, notes, region] of suppliersToAdd) {
      await addSupplier(name, contact, website, notes, region);
    }
    
    console.log('Supplier import completed successfully!');
  } catch (error) {
    console.error('Error importing suppliers:', error);
  }
}

// Run the import
importSuppliers()
  .then(() => console.log('Import script completed'))
  .catch(error => console.error('Error running import script:', error)); 