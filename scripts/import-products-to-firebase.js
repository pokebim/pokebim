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
const productsCollection = collection(db, 'products');
const suppliersCollection = collection(db, 'suppliers');

// Helper function to find a supplier by name, or create if doesn't exist
async function findOrCreateSupplier(name) {
  if (!name || name.trim() === '') {
    name = 'Unknown';
  }

  const q = query(suppliersCollection, where("name", "==", name));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    console.log(`Supplier not found: ${name}, creating new supplier`);
    const newSupplierRef = await addDoc(suppliersCollection, {
      name,
      contact: '',
      notes: 'Added via product import script',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { id: newSupplierRef.id, name };
  }
  
  const supplier = querySnapshot.docs[0];
  return { id: supplier.id, ...supplier.data() };
}

// Helper function to check if a product exists by name and language
async function productExists(name, language) {
  if (!name || name.trim() === '') return false;
  
  const q = query(
    productsCollection, 
    where("name", "==", name),
    where("language", "==", language)
  );
  const querySnapshot = await getDocs(q);
  
  return !querySnapshot.empty;
}

// Function to add a new product
async function addProduct(name, language, type = 'Booster Box') {
  if (!name || name.trim() === '') return null;
  if (!language || language.trim() === '') language = 'Unknown';
  
  try {
    // Check if product already exists
    const exists = await productExists(name, language);
    
    if (exists) {
      console.log(`Product already exists: ${name} (${language})`);
      return null;
    }
    
    // Get the default supplier
    const supplier = await findOrCreateSupplier('Unknown');
    
    // Create the product
    const productData = {
      name,
      language,
      type,
      supplierId: supplier.id,
      description: `${name} - ${language} language`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const productRef = await addDoc(productsCollection, productData);
    console.log(`Added product with ID: ${productRef.id} - ${name} (${language})`);
    return productRef.id;
  } catch (error) {
    console.error(`Error adding product ${name} (${language}):`, error);
    return null;
  }
}

// Main function to import products
async function importProducts() {
  try {
    console.log('Starting to import products to Firebase...');
    
    // Extract unique products from the data
    // Format: product name, language, type
    const productsToAdd = [
      // Japanese products
      ['Battle Partners Caja 30', 'Japanese', 'Booster Box'],
      ['151', 'Japanese', 'Booster Box'],
      ['Heat Wave Caja 30', 'Japanese', 'Booster Box'],
      ['Shiny Treasures', 'Japanese', 'Booster Box'],
      ['Eeve Heroes', 'Japanese', 'Booster Box'],
      ['Terastal Festival', 'Japanese', 'Booster Box'],
      ['Super Electric breaker', 'Japanese', 'Booster Box'],
      ['Crimsone Haze', 'Japanese', 'Booster Box'],
      ['Lost Abyss', 'Japanese', 'Booster Box'],
      ['VStar Universe', 'Japanese', 'Booster Box'],
      ['Fusion ARTS', 'Japanese', 'Booster Box'],
      ['Blue Sky Stream', 'Japanese', 'Booster Box'],
      ['Team Rocket', 'Japanese', 'Booster Box'],
      ['Surging', 'Japanese', 'Booster Box'],
      
      // Korean products
      ['Battle Partners Caja 30', 'Korean', 'Booster Box'],
      ['151', 'Korean', 'Booster Box'],
      ['Heat Wave Caja 30', 'Korean', 'Booster Box'],
      ['Shiny Treasures', 'Korean', 'Booster Box'],
      ['Eeve Heroes', 'Korean', 'Booster Box'],
      ['Terastal Festival', 'Korean', 'Booster Box'],
      ['Super Electric breaker', 'Korean', 'Booster Box'],
      ['Crimsone Haze', 'Korean', 'Booster Box'],
      ['Lost Abyss', 'Korean', 'Booster Box'],
      ['VStar Universe', 'Korean', 'Booster Box'],
      ['Fusion ARTS', 'Korean', 'Booster Box'],
      ['Blue Sky Stream', 'Korean', 'Booster Box'],
      
      // Chinese products
      ['151 Slim', 'Chinese', 'Slim Pack'],
      ['Gem Pack box', 'Chinese', 'Booster Pack'],
      ['151 Jumbo', 'Chinese', 'Jumbo Pack'],
      ['PTCG Pokemon 8.0 slim pack', 'Chinese', 'Slim Pack'],
      ['Necrozma gift box', 'Chinese', 'Gift Box'],
      ['PTCG Advanced gift box eevolution', 'Chinese', 'Gift Box'],
      ['Rayquaza gift box', 'Chinese', 'Gift Box'],
      ['Mewtwo Vstar Box', 'Chinese', 'Gift Box'],
      ['Charizard Vstar Box', 'Chinese', 'Gift Box'],
      ['Charizard Vmax Box', 'Chinese', 'Gift Box'],
      ['Charizard Vmax Classic Box', 'Chinese', 'Gift Box']
    ];
    
    // Add each product
    for (const [name, language, type] of productsToAdd) {
      await addProduct(name, language, type);
    }
    
    console.log('Product import completed successfully!');
  } catch (error) {
    console.error('Error importing products:', error);
  }
}

// Run the import
importProducts()
  .then(() => console.log('Import script completed'))
  .catch(error => console.error('Error running import script:', error)); 