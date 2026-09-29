'use strict';

/** Process entry point (PROVIDED, LOCKED). */

const { createApp } = require('./http/app');

const port = Number(process.env.PORT) || 3000;
const server = createApp().listen(port, () => {
  console.log(`CleanCart API listening on http://localhost:${port} (docs at /docs)`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
