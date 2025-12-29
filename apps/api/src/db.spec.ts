
import 'dotenv/config';
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');
import { PrismaClient } from '../generated/prisma/client';

describe('DB Connection Check', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    console.log('Initializing Prisma...');
    prisma = new PrismaClient({});
    console.log('Prisma initialized.');
    
    console.log('Connecting...');
    try {
        await prisma.$connect();
        console.log('Connected successfully.');
    } catch (e) {
        console.error('Connection failed:', e);
    }
    
    console.log('Prisma Keys:', Object.keys(prisma));
    // @ts-ignore
    console.log('Has SalesCommercial?', !!prisma.salesCommercial);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should fetch SalesCommercial data', async () => {
    try {
        const sales = await prisma.salesCommercial.findFirst({ take: 1 });
        console.log('--- SalesCommercial Data ---');
        console.log(JSON.stringify(sales, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
        expect(sales).toBeDefined();
    } catch (error) {
        console.error('Error fetching SalesCommercial:', error);
        throw error;
    }
  });

  it('should fetch StoreCommercial data', async () => {
    try {
        const store = await prisma.storeCommercial.findFirst({ take: 1 });
        console.log('--- StoreCommercial Data ---');
        console.log(JSON.stringify(store, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
        expect(store).toBeDefined();
    } catch (error) {
        console.error('Error fetching StoreCommercial:', error);
        throw error;
    }
  });

  it('should fetch ResidentPopulationCommercial data', async () => {
     try {
        const population = await prisma.residentPopulationCommercial.findFirst({ take: 1 });
        console.log('--- ResidentPopulationCommercial Data ---');
        console.log(JSON.stringify(population, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2));
        expect(population).toBeDefined();
     } catch (error) {
        console.error('Error fetching ResidentPopulationCommercial:', error);
        throw error;
     }
  });
});
