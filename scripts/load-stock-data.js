const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting to load stock data...');
  
  try {
    // First ensure we have suppliers in the database
    const creativeToysSupplier = await getOrCreateSupplier('Creative toys');
    const rebelSupplier = await getOrCreateSupplier('Rebel');
    
    console.log('Suppliers created/updated');
    
    // Now create products and their associated prices
    
    // 1. PE BB English from Creative toys
    const peBbProduct = await getOrCreateProduct('PE BB', 'English', 'Booster Box', creativeToysSupplier.id);
    await getOrCreatePrice(peBbProduct.id, creativeToysSupplier.id, 25.5915);
    
    // 2. SV09 ETB English from Rebel
    const sv09EtbProduct = await getOrCreateProduct('SV09 ETB', 'English', 'Elite Trainer Box', rebelSupplier.id);
    await getOrCreatePrice(sv09EtbProduct.id, rebelSupplier.id, 28.98);
    
    // 3. SV09 BB English from Rebel and Creative toys
    const sv09BbProduct = await getOrCreateProduct('SV09 BB', 'English', 'Booster Box', rebelSupplier.id);
    await getOrCreatePrice(sv09BbProduct.id, rebelSupplier.id, 90.36);
    await getOrCreatePrice(sv09BbProduct.id, creativeToysSupplier.id, 115.2);
    
    console.log('All stock data has been imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  }
}

async function getOrCreateSupplier(name) {
  try {
    // Check if supplier exists
    let supplier = await prisma.supplier.findFirst({
      where: { name }
    });
    
    // If not, create it
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name,
          contact: '',
          notes: 'Added via import script'
        }
      });
      console.log(`Created supplier: ${name}`);
    } else {
      console.log(`Found existing supplier: ${name}`);
    }
    
    return supplier;
  } catch (error) {
    console.error(`Error with supplier ${name}:`, error);
    throw error;
  }
}

async function getOrCreateProduct(name, language, type, supplierId) {
  try {
    // Check if product exists
    let product = await prisma.product.findFirst({
      where: {
        name,
        language
      }
    });
    
    // If not, create it
    if (!product) {
      product = await prisma.product.create({
        data: {
          name,
          language,
          type,
          supplierId
        }
      });
      console.log(`Created product: ${name} (${language})`);
    } else {
      console.log(`Found existing product: ${name} (${language})`);
    }
    
    return product;
  } catch (error) {
    console.error(`Error with product ${name}:`, error);
    throw error;
  }
}

async function getOrCreatePrice(productId, supplierId, price) {
  try {
    // Check if price exists
    let priceRecord = await prisma.price.findFirst({
      where: {
        productId,
        supplierId
      }
    });
    
    // If not, create it; if yes, update it
    if (!priceRecord) {
      priceRecord = await prisma.price.create({
        data: {
          productId,
          supplierId,
          price,
          currency: 'EUR',
          notes: 'Imported from spreadsheet'
        }
      });
      console.log(`Created price: ${price} for product ${productId} from supplier ${supplierId}`);
    } else {
      priceRecord = await prisma.price.update({
        where: { id: priceRecord.id },
        data: { price }
      });
      console.log(`Updated price to ${price} for product ${productId} from supplier ${supplierId}`);
    }
    
    return priceRecord;
  } catch (error) {
    console.error(`Error with price for product ${productId} from supplier ${supplierId}:`, error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 