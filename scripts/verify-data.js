const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Verifying imported data...');
    
    // Check suppliers
    const suppliers = await prisma.supplier.findMany();
    console.log(`\nFound ${suppliers.length} suppliers:`);
    suppliers.forEach(s => console.log(`- ${s.name} (${s.id})`));
    
    // Check products
    const products = await prisma.product.findMany();
    console.log(`\nFound ${products.length} products:`);
    for (const p of products) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: p.supplierId }
      });
      console.log(`- ${p.name} (${p.language}) from ${supplier ? supplier.name : 'Unknown'}`);
    }
    
    // Check prices
    const prices = await prisma.price.findMany();
    console.log(`\nFound ${prices.length} prices:`);
    for (const p of prices) {
      const product = await prisma.product.findUnique({
        where: { id: p.productId }
      });
      const supplier = await prisma.supplier.findUnique({
        where: { id: p.supplierId }
      });
      console.log(`- ${product.name} from ${supplier.name}: ${p.price} ${p.currency}`);
    }
    
    console.log('\nData verification complete!');
  } catch (error) {
    console.error('Error during verification:', error);
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