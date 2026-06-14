const prisma = require('../db');

exports.getSummary = async (req, res, next) => {
  try {
    const { from, to, farmerId } = req.query;

    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }
    if (farmerId) where.farmerId = parseInt(farmerId);

    const entries = await prisma.milkEntry.findMany({
      where,
      include: { farmer: { select: { id: true, name: true, fmsNo: true } } },
    });

    const totalLitres = entries.reduce((s, e) => s + e.litresKg, 0);
    const totalRupees = entries.reduce((s, e) => s + e.rupees,   0);
    const avgFat      = entries.length ? entries.reduce((s, e) => s + e.fat, 0) / entries.length : 0;
    const avgSnf      = entries.length ? entries.reduce((s, e) => s + e.snf, 0) / entries.length : 0;

    const farmerMap = {};
    for (const entry of entries) {
      const fid = entry.farmerId;
      if (!farmerMap[fid]) {
        farmerMap[fid] = { farmer: entry.farmer, litres: 0, rupees: 0, entryCount: 0 };
      }
      farmerMap[fid].litres += entry.litresKg;
      farmerMap[fid].rupees += entry.rupees;
      farmerMap[fid].entryCount += 1;
    }

    const farmerBreakdown = Object.values(farmerMap)
      .map(f => ({
        ...f.farmer,
        totalLitres: Math.round(f.litres * 100) / 100,
        totalRupees: Math.round(f.rupees * 100) / 100,
        entryCount:  f.entryCount,
      }))
      .sort((a, b) => b.totalLitres - a.totalLitres);

    res.json({
      success: true,
      data: {
        totalFarmers: Object.keys(farmerMap).length,
        totalLitres:  Math.round(totalLitres * 100) / 100,
        totalRupees:  Math.round(totalRupees * 100) / 100,
        avgFat:       Math.round(avgFat      * 100) / 100,
        avgSnf:       Math.round(avgSnf      * 100) / 100,
        farmerBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};
