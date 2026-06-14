const prisma = require('../db');
const { calculateTotals } = require('../utils/calculations');

exports.getEntriesByFarmer = async (req, res, next) => {
  try {
    const farmerId = parseInt(req.params.farmerId);
    const { from, to, limit } = req.query;

    const where = { farmerId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.date.lte = toDate;
      }
    }

    const entries = await prisma.milkEntry.findMany({
      where,
      orderBy: { date: 'asc' },
      take: limit ? parseInt(limit) : undefined,
    });

    const totals = calculateTotals(entries);
    res.json({ success: true, data: { entries, totals } });
  } catch (error) {
    next(error);
  }
};

exports.createEntry = async (req, res, next) => {
  try {
    const { farmerId, date, receiptNo, litresKg, fat, snf, rate, rupees } = req.body;
    const entry = await prisma.milkEntry.create({
      data: {
        farmerId:  parseInt(farmerId),
        date:      new Date(date),
        receiptNo,
        litresKg:  parseFloat(litresKg),
        fat:       parseFloat(fat),
        snf:       parseFloat(snf),
        rate:      parseFloat(rate),
        rupees:    parseFloat(rupees),
      },
    });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

exports.updateEntry = async (req, res, next) => {
  try {
    const { date, receiptNo, litresKg, fat, snf, rate, rupees } = req.body;
    const entry = await prisma.milkEntry.update({
      where: { id: parseInt(req.params.id) },
      data: {
        date:      date      ? new Date(date)      : undefined,
        receiptNo: receiptNo ?? undefined,
        litresKg:  litresKg  ? parseFloat(litresKg) : undefined,
        fat:       fat       ? parseFloat(fat)       : undefined,
        snf:       snf       ? parseFloat(snf)       : undefined,
        rate:      rate      ? parseFloat(rate)      : undefined,
        rupees:    rupees    ? parseFloat(rupees)    : undefined,
      },
    });
    res.json({ success: true, data: entry });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    next(error);
  }
};

exports.deleteEntry = async (req, res, next) => {
  try {
    await prisma.milkEntry.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, data: { message: 'Entry deleted successfully' } });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    next(error);
  }
};
