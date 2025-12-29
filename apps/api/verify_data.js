"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./generated/prisma/client");
// @ts-ignore
const prisma = new client_1.PrismaClient({});
async function main() {
    console.log('--- Verifying SalesCommercial Data ---');
    const sales = await prisma.salesCommercial.findFirst({
        take: 1,
    });
    console.log('Sales Data Sample:', sales ? JSON.stringify(sales, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2) : 'No data found');
    console.log('\n--- Verifying StoreCommercial Data ---');
    const store = await prisma.storeCommercial.findFirst({
        take: 1,
    });
    console.log('Store Data Sample:', store ? JSON.stringify(store, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2) : 'No data found');
    console.log('\n--- Verifying ResidentPopulationCommercial Data ---');
    const population = await prisma.residentPopulationCommercial.findFirst({
        take: 1,
    });
    console.log('Population Data Sample:', population ? JSON.stringify(population, (key, value) => (typeof value === 'bigint' ? value.toString() : value), 2) : 'No data found');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
