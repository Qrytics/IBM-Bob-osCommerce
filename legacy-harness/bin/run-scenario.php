<?php
/**
 * Run one checkout scenario through the real osCommerce v2.3.4 code and print
 * the result as JSON.
 *
 *   php legacy-harness/bin/run-scenario.php legacy-harness/scenarios/<name>.json
 *
 * The flow follows the storefront pages request by request:
 *   shopping_cart.php         -> $cart->calculate()
 *   checkout_shipping.php     -> new order, box weights, free-shipping check, quote
 *   checkout_confirmation.php -> new order (with shipping), order_total->process()
 */

require dirname(__DIR__) . '/lib/bootstrap.php';

harness_run(function () use ($argv) {
    $scenario = json_decode(file_get_contents($argv[1]), true);
    if (!is_array($scenario)) throw new RuntimeException('Cannot read scenario ' . $argv[1]);

    $catalog = harness_load_catalog();
    harness_boot($catalog, $scenario['settings'], $scenario['shipping']);

    global $cart, $order, $sendto, $billto, $shipping, $total_weight, $total_count,
           $shipping_weight, $shipping_num_boxes, $currencies, $language;

    // ---- the cart (session contents keyed by uprid, as add_cart() stores them)
    $cart = new shoppingCart();
    foreach ($scenario['items'] as $item) {
        $attributes = array();
        if (!empty($item['attributes'])) {
            foreach ($item['attributes'] as $a) $attributes[(int)$a['optionId']] = (int)$a['valueId'];
        }
        $uprid = tep_get_uprid($item['productId'], $attributes);
        $cart->contents[$uprid] = array('qty' => (int)$item['qty']);
        if ($attributes) $cart->contents[$uprid]['attributes'] = $attributes;
    }

    $cartTotal = $cart->show_total();
    $cartWeight = $cart->show_weight();

    // ---- guest delivery address (sendto/billto as arrays, like guest checkout add-ons)
    $d = $scenario['delivery'];
    $country = null;
    foreach ($catalog['countries'] as $c) if ((int)$c['countries_id'] === (int)$d['countryId']) $country = $c;
    $zoneName = '';
    foreach ($catalog['zones'] as $z) if ((int)$z['zone_id'] === (int)$d['zoneId']) $zoneName = $z['zone_name'];
    $sendto = array(
        'firstname' => 'Guest', 'lastname' => 'Customer', 'company' => '', 'street_address' => '1 Main St',
        'suburb' => '', 'postcode' => '00000', 'city' => 'Anytown',
        'zone_id' => (string)$d['zoneId'], 'zone_name' => $zoneName,
        'country_id' => (string)$d['countryId'], 'country_name' => $country ? $country['countries_name'] : '',
        'country_iso_code_2' => $country ? $country['countries_iso_code_2'] : '',
        'country_iso_code_3' => $country ? $country['countries_iso_code_3'] : '',
        'address_format_id' => $country ? (string)$country['address_format_id'] : '1',
    );
    $billto = $sendto;

    // ================= checkout_shipping.php =================
    $order = new order();
    $orderBeforeShipping = $order->info;

    $total_weight = $cart->show_weight();
    $total_count = $cart->count_contents();

    $shipping_modules = new shipping();

    // Free-shipping pre-check, transcribed from checkout_shipping.php lines 73-100
    // (page-level code that cannot be included without rendering the page).
    $free_shipping = false;
    if (defined('MODULE_ORDER_TOTAL_SHIPPING_FREE_SHIPPING') && (MODULE_ORDER_TOTAL_SHIPPING_FREE_SHIPPING == 'true')) {
        $pass = false;
        switch (MODULE_ORDER_TOTAL_SHIPPING_DESTINATION) {
            case 'national':
                if ($order->delivery['country_id'] == STORE_COUNTRY) $pass = true;
                break;
            case 'international':
                if ($order->delivery['country_id'] != STORE_COUNTRY) $pass = true;
                break;
            case 'both':
                $pass = true;
                break;
        }
        if (($pass == true) && ($order->info['total'] >= MODULE_ORDER_TOTAL_SHIPPING_FREE_SHIPPING_OVER)) {
            $free_shipping = true;
            include(DIR_WS_LANGUAGES . $language . '/modules/order_total/ot_shipping.php');
        }
    }

    // Shipping selection, transcribed from checkout_shipping.php lines 112-129.
    $module = $scenario['shipping']['module'];
    $quotes = $shipping_modules->quote($module, $module);
    $quote = array('module' => $quotes[0]['module'], 'methods' => $quotes[0]['methods']);
    if (isset($quotes[0]['tax'])) $quote['tax'] = $quotes[0]['tax'];
    if ($free_shipping) {
        $shipping = array('id' => 'free_free', 'title' => FREE_SHIPPING_TITLE, 'cost' => '0');
    } else {
        $shipping = array('id' => $module . '_' . $module,
                          'title' => $quotes[0]['module'] . ' (' . $quotes[0]['methods'][0]['title'] . ')',
                          'cost' => $quotes[0]['methods'][0]['cost']);
    }

    // ================= checkout_confirmation.php =================
    $order = new order();
    $orderBeforeTotals = $order->info;

    $order_total_modules = new order_total();
    $totals = $order_total_modules->process();

    // ---- collect results
    $products = array();
    foreach ($order->products as $p) {
        $attrs = array();
        if (isset($p['attributes'])) {
            foreach ($p['attributes'] as $a) {
                $attrs[] = array('optionId' => (int)$a['option_id'], 'valueId' => (int)$a['value_id'],
                                 'optionName' => $a['option'], 'valueName' => $a['value'],
                                 'prefix' => $a['prefix'], 'price' => harness_num($a['price']));
            }
        }
        $products[] = array(
            'id' => (string)$p['id'],
            'qty' => (int)$p['qty'],
            'name' => $p['name'],
            'model' => $p['model'],
            'price' => harness_num($p['price']),
            'finalPrice' => harness_num($p['final_price']),
            'weight' => harness_num($p['weight']),
            'tax' => harness_num($p['tax']),
            'taxDescription' => $p['tax_description'],
            'attributes' => $attrs,
        );
    }

    $info = function (array $i) {
        $groups = array();
        foreach ($i['tax_groups'] as $k => $v) $groups[] = array('description' => (string)$k, 'amount' => harness_num($v));
        return array(
            'currency' => $i['currency'],
            'currencyValue' => harness_num($i['currency_value']),
            'shippingMethod' => (string)$i['shipping_method'],
            'shippingCost' => harness_num($i['shipping_cost']),
            'subtotal' => harness_num($i['subtotal']),
            'tax' => harness_num($i['tax']),
            'taxGroups' => $groups,
            'total' => harness_num($i['total']),
        );
    };

    $otLines = array();
    foreach ($totals as $t) {
        $otLines[] = array('code' => $t['code'], 'title' => $t['title'], 'text' => $t['text'],
                           'value' => harness_num($t['value']), 'sortOrder' => (int)$t['sort_order']);
    }

    $quoteOut = array('id' => $quotes[0]['id'], 'module' => $quote['module'],
                      'methods' => array(), 'tax' => isset($quote['tax']) ? harness_num($quote['tax']) : null);
    foreach ($quote['methods'] as $m) $quoteOut['methods'][] = array('id' => $m['id'], 'title' => $m['title'], 'cost' => harness_num($m['cost']));

    return array(
        'cart' => array('total' => harness_num($cartTotal), 'weight' => harness_num($cartWeight), 'count' => (int)$total_count),
        'shipment' => array('shippingWeight' => harness_num($shipping_weight), 'numBoxes' => (int)$shipping_num_boxes),
        'freeShippingOffered' => $free_shipping,
        'quote' => $quoteOut,
        'selectedShipping' => array('id' => $shipping['id'], 'title' => $shipping['title'], 'cost' => harness_num($shipping['cost'])),
        'products' => $products,
        'orderBeforeShipping' => $info($orderBeforeShipping),
        'orderBeforeTotals' => $info($orderBeforeTotals),
        'orderAfterTotals' => $info($order->info),
        'orderTotals' => $otLines,
        // Full-precision copies (json_encode, serialize_precision = -1) of values that
        // stage-by-stage checks feed back in as inputs. Not compared themselves.
        'exact' => array('selectedShipping' => $shipping),
    );
});
