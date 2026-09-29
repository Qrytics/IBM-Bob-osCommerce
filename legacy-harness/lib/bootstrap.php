<?php
/**
 * Boots just enough of osCommerce v2.3.4 to run its pricing code unmodified.
 *
 * Replaces the parts of includes/application_top.php that the pricing slice
 * needs: configuration constants (normally loaded from the `configuration`
 * table), language strings, the DB layer (FakeDb) and the session helpers.
 * Everything under legacy-baseline/ is required as-is; nothing there is edited.
 *
 * Constants cannot be redefined within one PHP process, so each scenario (and
 * each DISPLAY_PRICE_WITH_TAX mode) runs in its own process.
 */

define('HARNESS_ROOT', dirname(__DIR__));
define('REPO_ROOT', dirname(HARNESS_ROOT));
define('LEGACY_CATALOG', REPO_ROOT . '/legacy-baseline/catalog/');

error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
ini_set('display_errors', '0');
ini_set('precision', '14');
ini_set('serialize_precision', '-1');

/** Notices the legacy code raised (it raises many; they are informational). */
$GLOBALS['HARNESS_NOTICES'] = array();

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    // A missing configuration constant silently becomes its own name as a
    // string in PHP 7. That would corrupt results, so fail loudly instead.
    if (strpos($errstr, 'Use of undefined constant') !== false) {
        throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
    }
    if (!(error_reporting() & $errno)) return true;
    $GLOBALS['HARNESS_NOTICES'][] = basename($errfile) . ':' . $errline . ' ' . $errstr;
    return true;
});

require_once __DIR__ . '/FakeDb.php';

function harness_load_catalog()
{
    return json_decode(file_get_contents(REPO_ROOT . '/fixtures/catalog.json'), true);
}

/**
 * @param array $settings scenario "settings" block (see docs/scenario-format.md)
 * @param array $shipping scenario "shipping" block, or null
 */
function harness_boot(array $catalog, array $settings, $shipping = null)
{
    FakeDb::load($catalog);

    // --- paths (application_top.php / configure.php) ---
    define('DIR_WS_INCLUDES', LEGACY_CATALOG . 'includes/');
    define('DIR_WS_CLASSES', DIR_WS_INCLUDES . 'classes/');
    define('DIR_WS_FUNCTIONS', DIR_WS_INCLUDES . 'functions/');
    define('DIR_WS_MODULES', DIR_WS_INCLUDES . 'modules/');
    define('DIR_WS_LANGUAGES', DIR_WS_INCLUDES . 'languages/');
    require LEGACY_CATALOG . 'includes/database_tables.php';

    // --- store configuration (normally the `configuration` table) ---
    define('STORE_COUNTRY', (int)$catalog['store']['countryId']);
    define('STORE_ZONE', (int)$catalog['store']['zoneId']);
    define('DISPLAY_PRICE_WITH_TAX', !empty($settings['displayPriceWithTax']) ? 'true' : 'false');
    define('DOWNLOAD_ENABLED', 'false');
    define('DEFAULT_ORDERS_STATUS_ID', '1');

    // --- values english.php interpolates into its strings (not used by the math) ---
    define('STORE_NAME', 'CleanCart Demo Store');
    define('FILENAME_DEFAULT', 'index.php');
    foreach (array('ENTRY_CITY_MIN_LENGTH', 'ENTRY_EMAIL_ADDRESS_MIN_LENGTH', 'ENTRY_FIRST_NAME_MIN_LENGTH',
                   'ENTRY_LAST_NAME_MIN_LENGTH', 'ENTRY_PASSWORD_MIN_LENGTH', 'ENTRY_POSTCODE_MIN_LENGTH',
                   'ENTRY_STATE_MIN_LENGTH', 'ENTRY_STREET_ADDRESS_MIN_LENGTH', 'ENTRY_TELEPHONE_MIN_LENGTH',
                   'REVIEW_TEXT_MIN_LENGTH') as $c) {
        define($c, '2');
    }

    $box = isset($settings['shippingBox']) ? $settings['shippingBox'] : array();
    define('SHIPPING_BOX_WEIGHT', isset($box['weight']) ? (string)$box['weight'] : '3');
    define('SHIPPING_BOX_PADDING', isset($box['padding']) ? (string)$box['padding'] : '10');
    define('SHIPPING_MAX_WEIGHT', isset($box['maxWeight']) ? (string)$box['maxWeight'] : '50');

    // --- order total modules ---
    $free = isset($settings['freeShipping']) ? $settings['freeShipping'] : array();
    define('MODULE_ORDER_TOTAL_INSTALLED', 'ot_subtotal.php;ot_shipping.php;ot_tax.php;ot_total.php');
    define('MODULE_ORDER_TOTAL_SUBTOTAL_STATUS', 'true');
    define('MODULE_ORDER_TOTAL_SUBTOTAL_SORT_ORDER', '1');
    define('MODULE_ORDER_TOTAL_SHIPPING_STATUS', 'true');
    define('MODULE_ORDER_TOTAL_SHIPPING_SORT_ORDER', '2');
    define('MODULE_ORDER_TOTAL_SHIPPING_FREE_SHIPPING', !empty($free['enabled']) ? 'true' : 'false');
    define('MODULE_ORDER_TOTAL_SHIPPING_FREE_SHIPPING_OVER', isset($free['over']) ? (string)$free['over'] : '50');
    define('MODULE_ORDER_TOTAL_SHIPPING_DESTINATION', isset($free['destination']) ? $free['destination'] : 'national');
    define('MODULE_ORDER_TOTAL_TAX_STATUS', 'true');
    define('MODULE_ORDER_TOTAL_TAX_SORT_ORDER', '3');
    define('MODULE_ORDER_TOTAL_TOTAL_STATUS', 'true');
    define('MODULE_ORDER_TOTAL_TOTAL_SORT_ORDER', '4');

    // --- shipping modules (only the selected one is "installed") ---
    $module = $shipping ? $shipping['module'] : 'flat';
    define('MODULE_SHIPPING_INSTALLED', $module . '.php');
    $taxClass = $shipping && isset($shipping['taxClassId']) ? (string)$shipping['taxClassId'] : '0';
    foreach (array('FLAT', 'ITEM', 'TABLE') as $m) {
        define("MODULE_SHIPPING_{$m}_STATUS", 'True');
        define("MODULE_SHIPPING_{$m}_TAX_CLASS", $taxClass);
        define("MODULE_SHIPPING_{$m}_ZONE", '0');
        define("MODULE_SHIPPING_{$m}_SORT_ORDER", '0');
    }
    define('MODULE_SHIPPING_FLAT_COST', $shipping && isset($shipping['cost']) ? (string)$shipping['cost'] : '5.00');
    define('MODULE_SHIPPING_ITEM_COST', $shipping && isset($shipping['cost']) ? (string)$shipping['cost'] : '2.50');
    define('MODULE_SHIPPING_ITEM_HANDLING', $shipping && isset($shipping['handling']) ? (string)$shipping['handling'] : '0');
    define('MODULE_SHIPPING_TABLE_COST', $shipping && isset($shipping['table']) ? (string)$shipping['table'] : '25:8.50,50:5.50,10000:0.00');
    define('MODULE_SHIPPING_TABLE_MODE', $shipping && isset($shipping['mode']) ? $shipping['mode'] : 'weight');
    define('MODULE_SHIPPING_TABLE_HANDLING', $shipping && isset($shipping['handling']) ? (string)$shipping['handling'] : '0');

    // --- session / language globals ---
    $GLOBALS['language'] = 'english';
    $GLOBALS['languages_id'] = (int)$catalog['store']['languageId'];
    $GLOBALS['currency'] = isset($settings['currency']) ? $settings['currency'] : 'USD';
    $GLOBALS['customer_id'] = 0;
    $GLOBALS['customer_default_address_id'] = 0;
    $GLOBALS['payment'] = '';
    $GLOBALS['comments'] = '';
    $GLOBALS['HTTP_POST_VARS'] = array();
    $GLOBALS['PHP_SELF'] = 'checkout_confirmation.php';

    // --- legacy code, unmodified ---
    require LEGACY_CATALOG . 'includes/languages/english.php';
    require LEGACY_CATALOG . 'includes/functions/general.php';
    require LEGACY_CATALOG . 'includes/classes/currencies.php';
    require LEGACY_CATALOG . 'includes/classes/shopping_cart.php';
    require LEGACY_CATALOG . 'includes/classes/order.php';
    require LEGACY_CATALOG . 'includes/classes/shipping.php';
    require LEGACY_CATALOG . 'includes/classes/order_total.php';

    $GLOBALS['currencies'] = new currencies();
}

/** Link builder used by english.php string constants; URLs are irrelevant here. */
function tep_href_link($page = '', $parameters = '', $connection = 'NONSSL')
{
    return $page;
}

/** Guest session: nobody is logged in. */
function tep_session_is_registered($variable)
{
    return false;
}

/**
 * Normalise a legacy numeric result for comparison: PHP float cast, then the
 * PHP string conversion (precision = 14). "10.70" (string) and 10.7 (float)
 * both become "10.7".
 */
function harness_num($value)
{
    return (string)(float)$value;
}

function harness_emit(array $payload)
{
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), "\n";
}

function harness_run(callable $fn)
{
    try {
        $result = $fn();
        harness_emit(array('ok' => true, 'result' => $result, 'notices' => array_values(array_unique($GLOBALS['HARNESS_NOTICES']))));
    } catch (Throwable $e) {
        harness_emit(array('ok' => false, 'error' => get_class($e) . ': ' . $e->getMessage() . ' @ ' . basename($e->getFile()) . ':' . $e->getLine(), 'queries' => FakeDb::$log));
    }
}
