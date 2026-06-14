const prisma = require('../db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [totalFarmers, monthlyEntries, recentFarmers] = await Promise.all([
      prisma.farmer.count({ where: { isActive: true } }),
      prisma.milkEntry.findMany({
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.farmer.findMany({
        where:   { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const monthlyLitres  = monthlyEntries.reduce((s, e) => s + e.litresKg, 0);
    const monthlyPayment = monthlyEntries.reduce((s, e) => s + e.rupees,   0);

    res.json({
      success: true,
      data: {
        totalFarmers,
        monthlyLitres:  Math.round(monthlyLitres  * 100) / 100,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        recentFarmers,
      },
    });
  } catch (error) {
    next(error);
  }
};
