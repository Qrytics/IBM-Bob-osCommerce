'use strict';

/**
 * Request validation (PROVIDED, LOCKED).
 *
 * The legacy pages trusted $_POST and the session. The API validates every
 * request against the catalog up front, so the domain layer only ever sees
 * well-formed, existing products, attributes, locations and currencies.
 */

const { z } = require('zod');
const { getCatalog } = require('../data/catalogRepo');

const DECIMAL = /^\d{1,9}(\.\d{1,4})?$/;
const decimal = z
  .union([z.string(), z.number().nonnegative()])
  .transform((v) => (typeof v === 'number' ? String(v) : v))
  .refine((v) => DECIMAL.test(v), { message: 'must be a non-negative decimal with at most 4 decimal places' });
const id = z.number().int().nonnegative();

const attribute = z.object({ optionId: id, valueId: id }).strict();

const cartItem = z
  .object({
    productId: id,
    qty: z.number().int().min(1).max(10000),
    attributes: z.array(attribute).max(10).default([]),
  })
  .strict();

const items = z.array(cartItem).max(50);

const pricingSettings = {
  displayPriceWithTax: z.boolean().default(false),
  currency: z.string().default('USD'),
};

const settings = z
  .object({
    ...pricingSettings,
    freeShipping: z
      .object({
        enabled: z.boolean(),
        over: decimal,
        destination: z.enum(['national', 'international', 'both']),
      })
      .strict()
      .optional(),
    shippingBox: z
      .object({ weight: decimal, padding: decimal, maxWeight: decimal.refine((v) => Number(v) > 0, { message: 'must be > 0' }) })
      .strict()
      .optional(),
  })
  .strict()
  .default({});

const location = z.object({ countryId: id, zoneId: id }).strict();

const TABLE = /^\d+(\.\d+)?:\d+(\.\d+)?(,\d+(\.\d+)?:\d+(\.\d+)?)*$/;
const shipping = z.discriminatedUnion('module', [
  z.object({ module: z.literal('flat'), cost: decimal, taxClassId: id.default(0) }).strict(),
  z.object({ module: z.literal('item'), cost: decimal, handling: decimal.default('0'), taxClassId: id.default(0) }).strict(),
  z
    .object({
      module: z.literal('table'),
      table: z.string().regex(TABLE, 'must look like "25:8.50,50:5.50,10000:0.00"'),
      mode: z.enum(['weight', 'price']).default('weight'),
      handling: decimal.default('0'),
      taxClassId: id.default(0),
    })
    .strict(),
]);

// ---- catalog-aware checks ----------------------------------------------------

function checkCurrency(ctx, code, pathPrefix) {
  if (!getCatalog().currencies.some((c) => c.code === code)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...pathPrefix, 'currency'], message: `unknown currency ${code}` });
  }
}

function checkItems(ctx, list) {
  const c = getCatalog();
  const seen = new Set();
  list.forEach((item, i) => {
    if (!c.products.some((p) => p.products_id === item.productId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', i, 'productId'], message: `unknown product ${item.productId}` });
      return;
    }
    const options = new Set();
    item.attributes.forEach((a, j) => {
      if (options.has(a.optionId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', i, 'attributes', j], message: `option ${a.optionId} chosen twice` });
      }
      options.add(a.optionId);
      const ok = c.products_attributes.some((r) => r.products_id === item.productId && r.options_id === a.optionId && r.options_values_id === a.valueId);
      if (!ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', i, 'attributes', j], message: `product ${item.productId} has no option ${a.optionId} value ${a.valueId}` });
      }
    });
    const key = `${item.productId}${item.attributes.map((a) => `{${a.optionId}}${a.valueId}`).join('')}`;
    if (seen.has(key)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', i], message: 'duplicate cart line: merge the quantities instead' });
    }
    seen.add(key);
  });
}

function checkLocation(ctx, loc, pathPrefix) {
  const c = getCatalog();
  if (!c.countries.some((x) => x.countries_id === loc.countryId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...pathPrefix, 'countryId'], message: `unknown country ${loc.countryId}` });
    return;
  }
  if (loc.zoneId !== 0 && !c.zones.some((x) => x.zone_id === loc.zoneId && x.zone_country_id === loc.countryId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...pathPrefix, 'zoneId'], message: `zone ${loc.zoneId} is not in country ${loc.countryId} (use 0 for none)` });
  }
}

function checkTaxClass(ctx, taxClassId, pathPrefix) {
  if (taxClassId !== 0 && !getCatalog().tax_class.some((t) => t.tax_class_id === taxClassId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: pathPrefix, message: `unknown tax class ${taxClassId}` });
  }
}

// ---- request bodies ------------------------------------------------------------

const taxRateRequest = z
  .object({ taxClassId: id, countryId: id, zoneId: id })
  .strict()
  .superRefine((v, ctx) => {
    checkTaxClass(ctx, v.taxClassId, ['taxClassId']);
    checkLocation(ctx, v, []);
  });

const cartRequest = z
  .object({ items, settings: z.object(pricingSettings).strict().default({}) })
  .strict()
  .superRefine((v, ctx) => {
    checkItems(ctx, v.items);
    checkCurrency(ctx, v.settings.currency, ['settings']);
  });

const checkoutRequest = z
  .object({ items, settings, delivery: location, shipping })
  .strict()
  .superRefine((v, ctx) => {
    checkItems(ctx, v.items);
    checkCurrency(ctx, v.settings.currency, ['settings']);
    checkLocation(ctx, v.delivery, ['delivery']);
    checkTaxClass(ctx, v.shipping.taxClassId, ['shipping', 'taxClassId']);
  });

/** Express middleware factory: replaces req.body with the parsed value or answers 400. */
function body(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'The request body is invalid.',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

module.exports = { body, taxRateRequest, cartRequest, checkoutRequest };
