function calculateRate(fat, snf, settings = {}) {
  const BASE_RATE   = parseFloat(settings.base_rate   ?? 180.00);
  const STD_FAT     = parseFloat(settings.std_fat     ?? 4.00);
  const STD_SNF     = parseFloat(settings.std_snf     ?? 8.00);
  const FAT_PREMIUM = parseFloat(settings.fat_premium ?? 2.50);
  const SNF_PREMIUM = parseFloat(settings.snf_premium ?? 1.80);

  const fatBonus = ((fat - STD_FAT) / 0.1) * FAT_PREMIUM;
  const snfBonus = ((snf - STD_SNF) / 0.1) * SNF_PREMIUM;
  return Math.round((BASE_RATE + fatBonus + snfBonus) * 100) / 100;
}

function calculateRupees(litresKg, rate) {
  return Math.round(litresKg * rate * 100) / 100;
}

function calculateTotals(entries) {
  if (!entries || entries.length === 0)
    return { totalLitres: 0, totalRupees: 0, avgFat: 0, avgSnf: 0 };

  const totalLitres = entries.reduce((s, e) => s + e.litresKg, 0);
  const totalRupees = entries.reduce((s, e) => s + e.rupees,   0);
  const avgFat      = entries.reduce((s, e) => s + e.fat,      0) / entries.length;
  const avgSnf      = entries.reduce((s, e) => s + e.snf,      0) / entries.length;

  return {
    totalLitres: Math.round(totalLitres * 100) / 100,
    totalRupees: Math.round(totalRupees * 100) / 100,
    avgFat:      Math.round(avgFat      * 100) / 100,
    avgSnf:      Math.round(avgSnf      * 100) / 100,
  };
}

function calculateNetAmount(grossAmount, stampDuty = 25.00, cattleFeed = 0, cattleMedicine = 0, mfssFund = 0) {
  return Math.round((grossAmount - stampDuty - cattleFeed - cattleMedicine - mfssFund) * 100) / 100;
}

module.exports = { calculateRate, calculateRupees, calculateTotals, calculateNetAmount };
