require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const Parse = require('parse/node');

const { initParse } = require('./config/parseClient');
const categoriesRoutes = require('./routes/categories');
const authRoutes = require('./routes/auth');
const servicesRoutes = require('./routes/services');
const requestsRoutes = require('./routes/requests');
const externalRoutes = require('./routes/external');

function buildCors() {
  const allowed = (process.env.CORS_ALLOWED_ORIGINS || '*')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  if (allowed.includes('*')) {
    return cors();
  }

  return cors({
    origin: function (origin, callback) {
      if (!origin || allowed.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Origin not allowed by CORS'));
    }
  });
}

initParse();

const app = express();

app.use(helmet());
app.use(buildCors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    parseServer: Boolean(Parse.serverURL)
  });
});

app.use('/auth', authRoutes);
app.use('/services', servicesRoutes);
app.use('/requests', requestsRoutes);
app.use('/external', externalRoutes);
app.use('/categories', categoriesRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
  next();
});

app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

module.exports = app;
