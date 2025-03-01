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
const productsCollection = collection(db, 'products');
const stockCollection = collection(db, 'stock');

// Helper function to parse date string
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'npi') return null;
  
  // Parse dates in format DD/MM
  const match = dateStr.match(/(\d+)\/(\d+)/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // JavaScript months are 0-indexed
    const year = new Date().getFullYear(); // Current year
    return new Date(year, month, day);
  }
  
  return null;
}

// Helper function to convert "Sí"/"No" to boolean
function parseBoolean(str) {
  return str === 'Sí' || str === 'Si';
}

// Helper function to find a supplier by name
async function findSupplierByName(name) {
  const q = query(suppliersCollection, where("name", "==", name));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    console.log(`Supplier not found: ${name}, creating new supplier`);
    const newSupplierRef = await addDoc(suppliersCollection, {
      name,
      contact: '',
      notes: 'Added via import script',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { id: newSupplierRef.id, name };
  }
  
  const supplier = querySnapshot.docs[0];
  return { id: supplier.id, ...supplier.data() };
}

// Helper function to find a product by name and language
async function findProductByNameAndLanguage(name, language) {
  const q = query(
    productsCollection, 
    where("name", "==", name),
    where("language", "==", language)
  );
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    console.log(`Product not found: ${name} (${language}), creating new product`);
    const supplier = await findSupplierByName('Unknown');
    const newProductRef = await addDoc(productsCollection, {
      name,
      language,
      type: 'Unknown',
      supplierId: supplier.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { id: newProductRef.id, name, language };
  }
  
  const product = querySnapshot.docs[0];
  return { id: product.id, ...product.data() };
}

// Function to add stock items
async function addStockItem(stockData) {
  try {
    // Find or create supplier
    const supplier = await findSupplierByName(stockData.supplier);
    
    // Find or create product
    const product = await findProductByNameAndLanguage(stockData.product, stockData.language);
    
    // Create stock item
    const stockItem = {
      productId: product.id,
      quantity: parseInt(stockData.quantity) || 0,
      storeQuantity: parseInt(stockData.storeQuantity) || 0,
      investmentQuantity: parseInt(stockData.investmentQuantity) || 0,
      holdStore: parseInt(stockData.holdStore) || 0,
      unitPrice: parseFloat(stockData.unitPrice) || 0,
      totalPrice: parseFloat(stockData.totalPrice) || 0,
      vatIncluded: parseBoolean(stockData.vatIncluded),
      arrivalDate: parseDate(stockData.arrivalDate),
      isPaid: parseBoolean(stockData.isPaid),
      storeTotalPrice: parseFloat(stockData.storeTotalPrice) || null,
      costPerPerson: parseFloat(stockData.costPerPerson) || null,
      wallapopPrice: parseFloat(stockData.wallapopPrice) || null,
      amazonPrice: parseFloat(stockData.amazonPrice) || null,
      cardmarketPrice: parseFloat(stockData.cardmarketPrice) || null,
      approxSellingPrice: parseFloat(stockData.approxSellingPrice) || null,
      profitPerUnit: parseFloat(stockData.profitPerUnit) || null,
      profitPercentage: parseFloat(stockData.profitPercentage) || null,
      totalProfit: parseFloat(stockData.totalProfit) || null,
      tikTokPrice: parseFloat(stockData.tikTokPrice) || null,
      storePrice: parseFloat(stockData.storePrice) || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Include supplier info for easier reference
      supplierName: supplier.name,
      productName: product.name,
      productLanguage: product.language
    };
    
    const stockRef = await addDoc(stockCollection, stockItem);
    console.log(`Added stock item with ID: ${stockRef.id} for ${stockData.product} (${stockData.language}) from ${stockData.supplier}`);
    return stockRef.id;
  } catch (error) {
    console.error(`Error adding stock item for ${stockData.product}:`, error);
    throw error;
  }
}

// Main function to import all data
async function importStockData() {
  try {
    console.log('Starting to import stock data to Firebase...');
    
    // Data from the spreadsheet
    const stockDataItems = [
      {
        product: 'PE BB',
        language: 'English',
        supplier: 'Creative toys',
        quantity: '60',
        unitPrice: '25.5915',
        totalPrice: '1535.49',
        vatIncluded: 'Sí',
        arrivalDate: 'npi',
        storeQuantity: '0',
        investmentQuantity: '0',
        holdStore: '60',
        isPaid: 'Sí',
        storeTotalPrice: '1535.49',
        costPerPerson: '511.83',
        wallapopPrice: '',
        amazonPrice: '',
        cardmarketPrice: '',
        approxSellingPrice: '65',
        profitPerUnit: '25.7585',
        profitPercentage: '153.9905828',
        totalProfit: '0',
        tikTokPrice: '',
        storePrice: ''
      },
      {
        product: 'SV09 ETB',
        language: 'English',
        supplier: 'Rebel',
        quantity: '10',
        unitPrice: '28.98',
        totalPrice: '289.8',
        vatIncluded: 'OI',
        arrivalDate: '28/03',
        storeQuantity: '10',
        investmentQuantity: '0',
        holdStore: '0',
        isPaid: 'No',
        storeTotalPrice: '289.8',
        costPerPerson: '96.6',
        wallapopPrice: '',
        amazonPrice: '',
        cardmarketPrice: '',
        approxSellingPrice: '70',
        profitPerUnit: '26.32',
        profitPercentage: '141.5458937',
        totalProfit: '263.2',
        tikTokPrice: '',
        storePrice: ''
      },
      {
        product: 'SV09 BB',
        language: 'English',
        supplier: 'Rebel',
        quantity: '10',
        unitPrice: '90.36',
        totalPrice: '903.6',
        vatIncluded: 'OI',
        arrivalDate: '28/03',
        storeQuantity: '10',
        investmentQuantity: '0',
        holdStore: '0',
        isPaid: 'No',
        storeTotalPrice: '903.6',
        costPerPerson: '301.2',
        wallapopPrice: '',
        amazonPrice: '',
        cardmarketPrice: '',
        approxSellingPrice: '180',
        profitPerUnit: '51.84',
        profitPercentage: '99.20318725',
        totalProfit: '518.4',
        tikTokPrice: '',
        storePrice: ''
      },
      {
        product: 'SV09 BB',
        language: 'English',
        supplier: 'Creative toys',
        quantity: '24',
        unitPrice: '115.2',
        totalPrice: '2764.8',
        vatIncluded: 'Sí',
        arrivalDate: '28/03',
        storeQuantity: '24',
        investmentQuantity: '0',
        holdStore: '0',
        isPaid: 'No',
        storeTotalPrice: '2764.8',
        costPerPerson: '921.6',
        wallapopPrice: '',
        amazonPrice: '',
        cardmarketPrice: '',
        approxSellingPrice: '180',
        profitPerUnit: '27',
        profitPercentage: '56.25',
        totalProfit: '648',
        tikTokPrice: '',
        storePrice: ''
      }
    ];
    
    // Import each stock item
    for (const stockData of stockDataItems) {
      if (stockData.product && stockData.quantity) {
        await addStockItem(stockData);
      }
    }
    
    console.log('Stock data import completed successfully!');
  } catch (error) {
    console.error('Error importing stock data:', error);
  }
}

// Run the import
importStockData()
  .then(() => console.log('Import script completed'))
  .catch(error => console.error('Error running import script:', error)); 