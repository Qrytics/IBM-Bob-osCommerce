'use strict';

/** Express application (PROVIDED, LOCKED). */

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const pricing = require('./routes/pricing');
const catalog = require('./routes/catalog');
const { notFound, errorHandler } = require('./errors');
const pkg = require('../../package.json');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Render / most PaaS terminate TLS in front of the app

  app.use(helmet());
  app.use(cors({ methods: ['GET', 'POST'] }));
  app.use(express.json({ limit: '100kb' }));

  const openapi = YAML.parse(fs.readFileSync(path.join(__dirname, '../../openapi.yaml'), 'utf8'));
  app.get('/openapi.json', (req, res) => res.json(openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'CleanCart API' }));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: pkg.name, version: pkg.version }));

  app.use(
    '/api',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }),
  );
  app.use('/api/v1', catalog);
  app.use('/api/v1', pricing);

  app.use(express.static(path.join(__dirname, '../../public'), { extensions: ['html'] }));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
