'use strict';

/** Error responses (PROVIDED, LOCKED). */

const { NotImplemented } = require('../domain/errors');

function notFound(req, res) {
  res.status(404).json({ error: 'NotFound', message: `No route for ${req.method} ${req.path}` });
}

function errorHandler(err, req, res, next) {
  if (err instanceof NotImplemented) {
    res.status(501).json({ error: 'NotImplemented', message: err.message, task: err.task, function: err.fn });
    return;
  }
  if (err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'ValidationError', message: 'Malformed JSON body.' });
    return;
  }
  if (err && err.type === 'entity.too.large') {
    res.status(413).json({ error: 'PayloadTooLarge', message: 'Request body is too large.' });
    return;
  }
  if (process.env.NODE_ENV !== 'test') console.error(err); // eslint-disable-line no-console
  res.status(500).json({ error: 'InternalError', message: 'Unexpected server error.' });
}

module.exports = { notFound, errorHandler };
