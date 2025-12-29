"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("./generated/prisma/client");
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');
async function verify() {
    var _a;
    // @ts-ignore
    const prisma = new client_1.PrismaClient();
    await prisma.$connect();
    const regionCode = '3110014'; // Example Region Code (Changsin 1-dong?) - User can change this
    // Need a valid TRDAR_CD. 
    // Let's first find a valid TRDAR_CD from the DB to ensure we get data.
    const validArea = await prisma.salesCommercial.findFirst();
    if (!validArea) {
        console.log('No Sales Data found.');
        return;
    }
    const testRegionCode = validArea.TRDAR_CD;
    console.log(`Using Test Region Code: ${testRegionCode}`);
    // Copying Logic from AnalysisService
    const latestSales = await prisma.salesCommercial.findFirst({
        orderBy: { STDR_YYQU_CD: 'desc' },
        select: { STDR_YYQU_CD: true },
    });
    const stdrYyquCd = latestSales === null || latestSales === void 0 ? void 0 : latestSales.STDR_YYQU_CD;
    console.log(`Latest Quarter: ${stdrYyquCd}`);
    const [salesRaw, storeRaw, populationRaw] = await Promise.all([
        prisma.salesCommercial.findMany({
            where: { TRDAR_CD: testRegionCode, STDR_YYQU_CD: stdrYyquCd },
        }),
        prisma.storeCommercial.findMany({
            where: { TRDAR_CD: testRegionCode, STDR_YYQU_CD: stdrYyquCd },
        }),
        prisma.residentPopulationCommercial.findFirst({
            where: { TRDAR_CD: testRegionCode, STDR_YYQU_CD: stdrYyquCd },
        }),
    ]);
    let totalSales = BigInt(0);
    salesRaw.forEach(row => totalSales += row.THSMON_SELNG_AMT);
    let totalStores = 0;
    storeRaw.forEach(row => totalStores += row.STOR_CO);
    console.log('------------------------------------------------');
    console.log('Verification Result:');
    console.log(`- Total Sales: ${totalSales.toString()}`);
    console.log(`- Total Stores: ${totalStores}`);
    console.log(`- Population: ${(_a = populationRaw === null || populationRaw === void 0 ? void 0 : populationRaw.TOT_REPOP_CO) !== null && _a !== void 0 ? _a : 'N/A'}`);
    console.log('------------------------------------------------');
    await prisma.$disconnect();
}
verify().catch(console.error);
