
import 'dotenv/config';
import { PrismaClient } from './generated/prisma/client';

// @ts-ignore
const prisma = new PrismaClient({});

async function main() {
  console.log('Connecting to DB...');
  try {
    const sales = await prisma.salesCommercial.findFirst({ take: 1 });
    console.log('✅ Sales Data:', JSON.stringify(sales, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
  } catch (e) {
    console.error('❌ Sales Data Error:', e);
  }

  try {
    const store = await prisma.storeCommercial.findFirst({ take: 1 });
    console.log('✅ Store Data:', JSON.stringify(store, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
  } catch (e) {
    console.error('❌ Store Data Error:', e);
  }

  try {
    const population = await prisma.residentPopulationCommercial.findFirst({ take: 1 });
    console.log('✅ Population Data:', JSON.stringify(population, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
  } catch (e) {
    console.error('❌ Population Data Error:', e);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
