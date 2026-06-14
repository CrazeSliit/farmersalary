const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ── System Settings ──────────────────────────────────────────────
  const settings = [
    { key: 'company_name',    value: 'MILCO (Private) Limited' },
    { key: 'default_region',  value: 'UVA' },
    { key: 'default_centre',  value: 'WELLAWAYA' },
    { key: 'stamp_duty',      value: '25.00' },
    { key: 'base_rate',       value: '180.00' },
    { key: 'std_fat',         value: '4.00' },
    { key: 'std_snf',         value: '8.00' },
    { key: 'fat_premium',     value: '2.50' },
    { key: 'snf_premium',     value: '1.80' },
  ];

  for (const s of settings) {
    await prisma.systemSettings.upsert({
      where:  { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✅ System settings seeded');

  // ── Sample Farmer ─────────────────────────────────────────────────
  const farmer = await prisma.farmer.upsert({
    where:  { fmsNo: '763' },
    update: {},
    create: {
      fmsNo:       '763',
      fmsName:     'U A D M DUMINDA LAKMAL',
      name:        'Duminda Lakmal',
      address:     'Wewapara,\nUnawatuna,\nButtala',
      region:      'UVA',
      centre:      'WELLAWAYA',
      bankAccount: '000501010102086',
      bankName:    'Regional Development Bank, Buttala',
    },
  });
  console.log(`✅ Farmer seeded: ${farmer.name} (FMS ${farmer.fmsNo})`);

  // ── Sample Milk Entries — Period 2026-05-01 to 2026-05-15 ────────
  const entries = [
    { date: '2026-05-01', receiptNo: '237222', litresKg: 14.30, fat: 5.90, snf: 8.66, rate: 198.78, rupees: 2842.55 },
    { date: '2026-05-02', receiptNo: '237308', litresKg: 17.40, fat: 6.00, snf: 8.54, rate: 198.62, rupees: 3455.99 },
    { date: '2026-05-03', receiptNo: '237369', litresKg: 14.70, fat: 5.40, snf: 8.43, rate: 182.66, rupees: 2685.10 },
    { date: '2026-05-04', receiptNo: '237424', litresKg: 14.40, fat: 5.20, snf: 8.46, rate: 181.15, rupees: 2608.56 },
    { date: '2026-05-05', receiptNo: '237488', litresKg: 16.90, fat: 5.30, snf: 8.43, rate: 181.77, rupees: 3071.91 },
    { date: '2026-05-06', receiptNo: '237544', litresKg: 15.10, fat: 5.40, snf: 8.34, rate: 181.87, rupees: 2746.24 },
    { date: '2026-05-07', receiptNo: '237605', litresKg: 14.50, fat: 5.30, snf: 8.61, rate: 183.36, rupees: 2658.72 },
    { date: '2026-05-08', receiptNo: '237665', litresKg: 16.30, fat: 5.00, snf: 8.54, rate: 180.06, rupees: 2934.98 },
    { date: '2026-05-09', receiptNo: '237725', litresKg: 14.40, fat: 6.00, snf: 8.34, rate: 187.00, rupees: 2692.80 },
    { date: '2026-05-10', receiptNo: '237787', litresKg: 15.10, fat: 6.20, snf: 8.38, rate: 198.94, rupees: 3003.99 },
    { date: '2026-05-11', receiptNo: '237846', litresKg: 15.10, fat: 5.50, snf: 8.43, rate: 183.53, rupees: 2771.30 },
    { date: '2026-05-12', receiptNo: '237910', litresKg: 24.90, fat: 5.60, snf: 8.47, rate: 184.74, rupees: 4600.03 },
    { date: '2026-05-13', receiptNo: '237971', litresKg: 15.00, fat: 5.80, snf: 8.55, rate: 185.41, rupees: 2781.15 },
    { date: '2026-05-14', receiptNo: '238037', litresKg: 14.70, fat: 5.40, snf: 8.40, rate: 182.39, rupees: 2681.13 },
    { date: '2026-05-15', receiptNo: '238097', litresKg: 14.50, fat: 6.10, snf: 8.56, rate: 199.57, rupees: 2893.77 },
  ];

  await prisma.milkEntry.deleteMany({ where: { farmerId: farmer.id } });
  await prisma.milkEntry.createMany({
    data: entries.map(e => ({
      farmerId:  farmer.id,
      date:      new Date(e.date),
      receiptNo: e.receiptNo,
      litresKg:  e.litresKg,
      fat:       e.fat,
      snf:       e.snf,
      rate:      e.rate,
      rupees:    e.rupees,
    })),
  });
  console.log(`✅ ${entries.length} milk entries seeded`);
  console.log('🌿 Seed complete — Total: 230.30 L | Gross: Rs. 43,119.22');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
