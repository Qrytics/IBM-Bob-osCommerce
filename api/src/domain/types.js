'use strict';

/**
 * Shared data shapes for the domain layer (PROVIDED, LOCKED).
 *
 * Catalog rows keep the legacy column names and are strings wherever MySQL
 * returned strings (prices, weights, rates). Convert them with phpToNumber().
 *
 * Domain functions may return numbers where the legacy code returned numeric
 * strings, or the other way round. Tests compare values after PHP-style
 * normalisation (phpFloatToString(phpToNumber(x))), so "10.70" and 10.7 are equal.
 */

/**
 * @typedef {Object} Catalog  Contents of fixtures/catalog.json
 * @property {{countryId:number, zoneId:number, languageId:number}} store
 * @property {Array<Object>} countries
 * @property {Array<Object>} zones
 * @property {Array<{geo_zone_id:number}>} geo_zones
 * @property {Array<{association_id:number, zone_country_id:number, zone_id:number, geo_zone_id:number}>} zones_to_geo_zones
 * @property {Array<{tax_class_id:number, tax_class_title:string}>} tax_class
 * @property {Array<{tax_rates_id:number, tax_zone_id:number, tax_class_id:number, tax_priority:number, tax_rate:string, tax_description:string}>} tax_rates
 * @property {Array<Currency>} currencies
 * @property {Array<{products_id:number, products_model:string, products_price:string, products_weight:string, products_tax_class_id:number, products_name:string}>} products
 * @property {Array<{specials_id:number, products_id:number, specials_new_products_price:string, expires_date:(string|null), status:string}>} specials
 * @property {Array<{products_options_id:number, language_id:number, products_options_name:string}>} products_options
 * @property {Array<{products_options_values_id:number, language_id:number, products_options_values_name:string}>} products_options_values
 * @property {Array<{products_attributes_id:number, products_id:number, options_id:number, options_values_id:number, options_values_price:string, price_prefix:string}>} products_attributes
 */

/**
 * @typedef {Object} Currency  A row of the `currencies` table
 * @property {string} code
 * @property {string} title
 * @property {string} symbol_left
 * @property {string} symbol_right
 * @property {string} decimal_point
 * @property {string} thousands_point
 * @property {string} decimal_places  e.g. "2" (the legacy class casts it with (int))
 * @property {string} value           exchange rate vs. the default currency, e.g. "0.8870"
 */

/**
 * @typedef {Object} PricingContext  What the legacy code read from globals and constants
 * @property {boolean} displayPriceWithTax  DISPLAY_PRICE_WITH_TAX == 'true'
 * @property {Currency} currency            $currencies->currencies[$currency]
 */

/**
 * @typedef {Object} CartItem  One line of $cart->contents
 * @property {number} productId
 * @property {number} qty
 * @property {Array<{optionId:number, valueId:number}>} attributes  in the order the customer chose them
 */

/**
 * @typedef {Object} CartTotals  Result of shoppingCart::calculate()
 * @property {number} total
 * @property {number} weight
 * @property {number} count   count_contents(): sum of quantities
 */

/**
 * @typedef {Object} CartProduct  One element of shoppingCart::get_products()
 * @property {string} id          uprid, e.g. "1{4}2{3}6"
 * @property {number} productId
 * @property {string} name
 * @property {string} model
 * @property {number|string} price       special price if one is active, else products_price
 * @property {number} quantity
 * @property {number|string} weight
 * @property {number} finalPrice  price + attributes_price()
 * @property {number} taxClassId
 * @property {Array<{optionId:number, valueId:number}>} attributes
 */

/**
 * @typedef {Object} Location
 * @property {number} countryId
 * @property {number} zoneId
 */

/**
 * @typedef {Object} OrderProduct  One element of $order->products
 * @property {string} id
 * @property {number} qty
 * @property {string} name
 * @property {string} model
 * @property {number|string} price
 * @property {number} finalPrice
 * @property {number|string} weight
 * @property {number} tax             rate in percent, from getTaxRate()
 * @property {string} taxDescription
 * @property {Array<{optionId:number, valueId:number, optionName:string, valueName:string, prefix:string, price:(number|string)}>} attributes
 */

/**
 * @typedef {Object} OrderInfo  $order->info (the parts the math uses)
 * @property {string} currency
 * @property {number|string} currencyValue
 * @property {string} shippingMethod
 * @property {number|string} shippingCost
 * @property {number} subtotal
 * @property {number} tax
 * @property {Array<{description:string, amount:number}>} taxGroups  insertion-ordered, like the PHP array
 * @property {number} total
 */

/**
 * @typedef {Object} Order
 * @property {string} contentType   'physical' (downloads are disabled in this slice)
 * @property {Location} delivery
 * @property {Array<OrderProduct>} products
 * @property {OrderInfo} info
 */

/**
 * @typedef {Object} ShippingConfig  Store configuration of the selected shipping module
 * @property {'flat'|'item'|'table'} module
 * @property {string} [cost]        flat: MODULE_SHIPPING_FLAT_COST; item: MODULE_SHIPPING_ITEM_COST
 * @property {string} [handling]    item/table: *_HANDLING
 * @property {string} [table]       table: MODULE_SHIPPING_TABLE_COST, e.g. "25:8.50,50:5.50,10000:0.00"
 * @property {'weight'|'price'} [mode]  table: MODULE_SHIPPING_TABLE_MODE
 * @property {number} [taxClassId]  *_TAX_CLASS (0 = untaxed)
 */

/**
 * @typedef {Object} Shipment  Globals set by shipping::quote()
 * @property {number} shippingWeight  $shipping_weight (per box, padded)
 * @property {number} numBoxes        $shipping_num_boxes
 */

/**
 * @typedef {Object} QuoteContext  Everything a shipping module's quote() reads
 * @property {Order} order
 * @property {number} cartTotal   $cart->show_total()
 * @property {number} cartCount   $total_count
 * @property {Shipment} shipment
 * @property {ShippingConfig} config
 * @property {Catalog} catalog
 */

/**
 * @typedef {Object} Quote  Return value of a shipping module's quote()
 * @property {string} id
 * @property {string} module
 * @property {Array<{id:string, title:string, cost:(number|string)}>} methods
 * @property {number} [tax]   only when config.taxClassId > 0
 */

/**
 * @typedef {Object} ShippingSelection  The session $shipping array
 * @property {string} id      e.g. "flat_flat" or "free_free"
 * @property {string} title
 * @property {number|string} cost
 */

/**
 * @typedef {Object} FreeShippingSettings  MODULE_ORDER_TOTAL_SHIPPING_*
 * @property {boolean} enabled
 * @property {string} over          threshold, e.g. "50"
 * @property {'national'|'international'|'both'} destination
 */

/**
 * @typedef {Object} OrderTotalContext  Globals the ot_* modules read
 * @property {Catalog} catalog
 * @property {boolean} displayPriceWithTax
 * @property {Currency} currency           the order's currency row
 * @property {FreeShippingSettings} freeShipping
 * @property {number} storeCountryId
 * @property {ShippingSelection} selectedShipping  $GLOBALS['shipping']
 * @property {Object<string, number>} installedShippingTaxClasses  module code -> tax class, i.e.
 *   $GLOBALS[$module]->tax_class for each installed shipping module ("free" is never installed)
 */

/**
 * @typedef {Object} OtLine  One entry of $this->output in an ot_* module
 * @property {string} title
 * @property {string} text
 * @property {number|string} value
 */

module.exports = {};
