
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log('Loading dotenv...');
        require('dotenv').config();
        
        console.log('Importing PrismaClient...');
        const clientModule = require('./generated/prisma/client');
        const PrismaClient = clientModule.PrismaClient;
        
        console.log('Initializing PrismaClient...');
        const prisma = new PrismaClient();
        
        console.log('Connecting...');
        await prisma.$connect();
        
        console.log('--- Verifying SalesCommercial Data ---');
        const sales = await prisma.salesCommercial.findFirst({ take: 1 });
        console.log('Sales Data Sample:', sales ? JSON.stringify(sales, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2) : 'No data found');
        
        console.log('\n--- Verifying StoreCommercial Data ---');
        const store = await prisma.storeCommercial.findFirst({ take: 1 });
        console.log('Store Data Sample:', store ? JSON.stringify(store, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2) : 'No data found');
        
        console.log('\n--- Verifying ResidentPopulationCommercial Data ---');
        const population = await prisma.residentPopulationCommercial.findFirst({ take: 1 });
        console.log('Population Data Sample:', population ? JSON.stringify(population, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2) : 'No data found');
        
        await prisma.$disconnect();
    } catch (e) {
        console.error('ERROR OCCURRED:');
        console.error(e);
        fs.writeFileSync('error_detailed.log', e.toString() + '\n' + e.stack);
    }
}

main();
