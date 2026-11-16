const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', env.TRUST_PROXY);
app.use(helmet());

const allowed = env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => (!origin || allowed.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json({ limit: '20kb' }));

app.use('/api', routes);
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin'))); // admin dashboard (same origin as API)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
