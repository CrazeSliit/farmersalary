const prisma = require('../db');

exports.getAllFarmers = async (req, res, next) => {
  try {
    const { search, region, limit, sort = 'createdAt', order = 'desc' } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name:    { contains: search } },
        { fmsNo:   { contains: search } },
        { fmsName: { contains: search } },
      ];
    }
    if (region) where.region = region;

    const farmers = await prisma.farmer.findMany({
      where,
      orderBy: { [sort]: order },
      take: limit ? parseInt(limit) : undefined,
    });

    res.json({ success: true, data: farmers });
  } catch (error) {
    next(error);
  }
};

exports.getFarmerById = async (req, res, next) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: farmer });
  } catch (error) {
    next(error);
  }
};

exports.createFarmer = async (req, res, next) => {
  try {
    const { fmsNo, fmsName, name, address, region, centre, bankAccount, bankName } = req.body;
    const farmer = await prisma.farmer.create({
      data: {
        fmsNo,
        fmsName,
        name,
        address,
        region:      region      || '',
        centre:      centre      || '',
        bankAccount: bankAccount || '',
        bankName:    bankName    || '',
      },
    });
    res.status(201).json({ success: true, data: farmer });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'FMS number already exists' });
    }
    next(error);
  }
};

exports.updateFarmer = async (req, res, next) => {
  try {
    const { fmsNo, fmsName, name, address, region, centre, bankAccount, bankName, isActive } = req.body;
    const farmer = await prisma.farmer.update({
      where: { id: parseInt(req.params.id) },
      data: { fmsNo, fmsName, name, address, region, centre, bankAccount, bankName, isActive },
    });
    res.json({ success: true, data: farmer });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'FMS number already exists' });
    }
    next(error);
  }
};

exports.deleteFarmer = async (req, res, next) => {
  try {
    await prisma.farmer.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, data: { message: 'Farmer deleted successfully' } });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    next(error);
  }
};
