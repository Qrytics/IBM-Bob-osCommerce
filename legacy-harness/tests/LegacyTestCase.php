<?php
/**
 * Base class for characterization tests of the legacy pricing code (LOCKED).
 *
 * The real osCommerce v2.3.4 code is already loaded (tests/bootstrap.php): call
 * tep_round(), tep_get_tax_rate(), $GLOBALS['currencies']->calculate_price(), new shoppingCart(), ...
 * directly. The database is fixtures/catalog.json, served by lib/FakeDb.php.
 */

use PHPUnit\Framework\TestCase;

abstract class LegacyTestCase extends TestCase
{
    /** True when this run has DISPLAY_PRICE_WITH_TAX == 'true'. */
    protected static function pricesIncludeTax()
    {
        return DISPLAY_PRICE_WITH_TAX == 'true';
    }

    /** Skip a test that only makes sense in one DISPLAY_PRICE_WITH_TAX mode. */
    protected function requireMode($withTax)
    {
        if (self::pricesIncludeTax() !== $withTax) {
            $this->markTestSkipped('Runs only with DISPLAY_PRICE_WITH_TAX=' . ($withTax ? 'true' : 'false'));
        }
    }

    /** Select the display currency ($currency global): USD, EUR or JPY. */
    protected function useCurrency($code)
    {
        $GLOBALS['currency'] = $code;
    }

    /** @return array fixtures/catalog.json */
    protected static function catalog()
    {
        return harness_load_catalog();
    }

    /**
     * Cases recorded from this same legacy code: fixtures/golden/functions/<group>.json.
     * Mode-dependent groups (add_tax, calculate_price, cart_calculate) are filtered to the current mode.
     * @return array list of ['args' => [...], 'expected' => ...]
     */
    protected static function golden($group)
    {
        $data = json_decode(file_get_contents(REPO_ROOT . '/fixtures/golden/functions/' . $group . '.json'), true);
        $cases = array();
        foreach ($data['cases'] as $c) {
            if (isset($c['displayPriceWithTax']) && $c['displayPriceWithTax'] !== self::pricesIncludeTax()) continue;
            $cases[] = $c;
        }
        return $cases;
    }

    /**
     * A shoppingCart filled the way add_cart() stores contents.
     * @param array $items list of ['productId' => 1, 'qty' => 2, 'attributes' => [4 => 2, 3 => 6]] (option => value)
     */
    protected function cart(array $items)
    {
        $cart = new shoppingCart();
        foreach ($items as $item) {
            $attributes = isset($item['attributes']) ? $item['attributes'] : array();
            $uprid = tep_get_uprid($item['productId'], $attributes);
            $cart->contents[$uprid] = array('qty' => (int)$item['qty']);
            if ($attributes) $cart->contents[$uprid]['attributes'] = $attributes;
        }
        return $cart;
    }

    /** Compare numbers the way the golden fixtures do: PHP float-to-string, no tolerance. */
    protected function assertLegacyNumber($expected, $actual, $message = '')
    {
        $this->assertSame((string)(float)$expected, harness_num($actual), $message);
    }
}
