const prisma = require('../db');
const { calculateTotals, calculateNetAmount } = require('../utils/calculations');

exports.getPaymentsByFarmer = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { farmerId: parseInt(req.params.farmerId) },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentById = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { farmer: true },
    });
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    const entries = await prisma.milkEntry.findMany({
      where: {
        farmerId: payment.farmerId,
        date: { gte: payment.periodStart, lte: payment.periodEnd },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, data: { ...payment, entries } });
  } catch (error) {
    next(error);
  }
};

exports.generatePayment = async (req, res, next) => {
  try {
    const { farmerId, periodStart, periodEnd, cattleFeed, cattleMedicine } = req.body;

    const start = new Date(periodStart);
    const end   = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    const entries = await prisma.milkEntry.findMany({
      where: {
        farmerId: parseInt(farmerId),
        date: { gte: start, lte: end },
      },
    });

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No milk entries found for this period',
      });
    }

    const totals = calculateTotals(entries);

    const [stampDutySetting, mfssSetting] = await Promise.all([
      prisma.systemSettings.findUnique({ where: { key: 'stamp_duty' } }),
      prisma.systemSettings.findUnique({ where: { key: 'mfss_fund_rate' } }),
    ]);
    const stampDuty       = stampDutySetting ? parseFloat(stampDutySetting.value) : 25.00;
    const mfssFundRate    = mfssSetting      ? parseFloat(mfssSetting.value)      : 1.00;
    const feedAmt         = parseFloat(cattleFeed     ?? 0) || 0;
    const medicineAmt     = parseFloat(cattleMedicine ?? 0) || 0;
    const mfssFund        = Math.round(mfssFundRate * totals.totalLitres * 100) / 100;
    const netAmount       = calculateNetAmount(totals.totalRupees, stampDuty, feedAmt, medicineAmt, mfssFund);

    const farmer = await prisma.farmer.findUnique({ where: { id: parseInt(farmerId) } });

    const payment = await prisma.payment.create({
      data: {
        farmerId:      parseInt(farmerId),
        periodStart:   start,
        periodEnd:     end,
        totalLitres:   totals.totalLitres,
        avgFat:        totals.avgFat,
        avgSnf:        totals.avgSnf,
        grossAmount:   totals.totalRupees,
        stampDuty,
        cattleFeed:     feedAmt,
        cattleMedicine: medicineAmt,
        mfssFund,
        netAmount,
        bankAccount:   farmer?.bankAccount || '',
        bankName:      farmer?.bankName    || '',
      },
      include: { farmer: true },
    });

    res.status(201).json({ success: true, data: { ...payment, entries } });
  } catch (error) {
    next(error);
  }
};

exports.deletePayment = async (req, res, next) => {
  try {
    await prisma.payment.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, data: { message: 'Payment deleted successfully' } });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    next(error);
  }
};
