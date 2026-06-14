const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/farmers',      require('./routes/farmerRoutes'));
app.use('/api/milk-entries', require('./routes/milkEntryRoutes'));
app.use('/api/payments',     require('./routes/paymentRoutes'));
app.use('/api/reports',      require('./routes/reportRoutes'));
app.use('/api/settings',     require('./routes/settingsRoutes'));
app.use('/api/dashboard',    require('./routes/dashboardRoutes'));

app.use(require('./middleware/errorHandler'));

module.exports = app;
