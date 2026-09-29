<?php
/**
 * PHPUnit bootstrap (LOCKED): boots the unmodified legacy code once per process.
 *
 * DISPLAY_PRICE_WITH_TAX is a PHP constant, so it is fixed per run. npm run legacy:test
 * runs the suite twice: LEGACY_DISPLAY_PRICE_WITH_TAX=false and =true.
 */

require dirname(__DIR__) . '/lib/bootstrap.php';
require __DIR__ . '/LegacyTestCase.php';

// PHPUnit reports warnings and notices itself; the harness only collects them.
restore_error_handler();
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE & ~E_WARNING);

harness_boot(harness_load_catalog(), array(
    'displayPriceWithTax' => getenv('LEGACY_DISPLAY_PRICE_WITH_TAX') === 'true',
    'currency' => 'USD',
));
