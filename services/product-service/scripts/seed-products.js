const mongoose = require('mongoose');

const products = [
  {
    name: 'Alpha Growth Fund',
    symbol: 'AGF',
    type: 'MUTUAL_FUND',
    currentPrice: 1625,
    riskLevel: 'MODERATE',
    status: true
  },
  {
    name: 'Nifty 50 ETF',
    symbol: 'NIFTYETF',
    type: 'ETF',
    currentPrice: 2450,
    riskLevel: 'MODERATE',
    status: true
  },
  {
    name: 'TCS Limited',
    symbol: 'TCS',
    type: 'STOCK',
    currentPrice: 3900,
    riskLevel: 'HIGH',
    status: true
  },
  {
    name: 'Government Bond 2035',
    symbol: 'GB2035',
    type: 'BOND',
    currentPrice: 1000,
    riskLevel: 'LOW',
    status: true
  },
  {
    name: 'Balanced Wealth Fund',
    symbol: 'BWF',
    type: 'MUTUAL_FUND',
    currentPrice: 980,
    riskLevel: 'LOW',
    status: true
  }
];

async function seed() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(uri);

  const collection = mongoose.connection.collection('products');
  await collection.deleteMany({});
  await collection.insertMany(products);

  await mongoose.disconnect();
  console.log('Products seeded');
}

seed().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
