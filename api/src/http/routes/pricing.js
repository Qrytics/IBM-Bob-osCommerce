'use strict';

/** Pricing endpoints backed by the translated domain layer (PROVIDED, LOCKED). */

const express = require('express');
const { body, taxRateRequest, cartRequest, checkoutRequest } = require('../validate');
const repo = require('../../data/catalogRepo');
const { getTaxRate, getTaxDescription } = require('../../domain/tax');
const { calculateCart, getProducts } = require('../../domain/cart');
const { checkoutTotals, resolveSettings } = require('../../domain');

const router = express.Router();

router.post('/tax/rate', body(taxRateRequest), (req, res) => {
  const { taxClassId, countryId, zoneId } = req.body;
  const catalog = repo.getCatalog();
  res.json({
    taxClassId, countryId, zoneId,
    rate: getTaxRate(catalog, taxClassId, countryId, zoneId),
    description: getTaxDescription(catalog, taxClassId, countryId, zoneId),
  });
});

router.post('/cart/calculate', body(cartRequest), (req, res) => {
  const catalog = repo.getCatalog();
  const { pricing } = resolveSettings(req.body.settings, catalog);
  const cart = calculateCart(req.body.items, catalog, pricing);
  res.json({ ...cart, currency: pricing.currency.code, products: getProducts(req.body.items, catalog) });
});

router.post('/checkout/totals', body(checkoutRequest), (req, res) => {
  res.json(checkoutTotals(req.body, repo.getCatalog()));
});

module.exports = router;
