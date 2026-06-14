const prisma = require('../db');

exports.getAllSettings = async (req, res, next) => {
  try {
    const rows = await prisma.systemSettings.findMany();
    const data = {};
    for (const row of rows) data[row.key] = row.value;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;
    await Promise.all(
      Object.entries(updates).map(([key, value]) =>
        prisma.systemSettings.upsert({
          where:  { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    const rows = await prisma.systemSettings.findMany();
    const data = {};
    for (const row of rows) data[row.key] = row.value;
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
