<?php
/**
 * LOCKED. Re-runs every recorded function-level case against the legacy code.
 * Proves fixtures/golden/functions still describe what osCommerce v2.3.4 does.
 * (Scenario fixtures are re-verified by `npm run golden:verify`: each scenario needs its own process.)
 */

class GoldenFunctionsTest extends LegacyTestCase
{
    public function testTepRound()
    {
        foreach (self::golden('tep_round') as $c) {
            $this->assertSame($c['expected'], harness_num(tep_round($c['args'][0], $c['args'][1])), json_encode($c['args']));
        }
    }

    public function testTaxRateAndDescription()
    {
        foreach (self::golden('tax_rate') as $c) {
            $this->assertSame($c['expected'], harness_num(tep_get_tax_rate($c['args'][0], $c['args'][1], $c['args'][2])), json_encode($c['args']));
        }
        foreach (self::golden('tax_description') as $c) {
            $this->assertSame($c['expected'], tep_get_tax_description($c['args'][0], $c['args'][1], $c['args'][2]), json_encode($c['args']));
        }
    }

    public function testAddAndCalculateTax()
    {
        foreach (self::golden('add_tax') as $c) {
            $this->assertSame($c['expected'], harness_num(tep_add_tax($c['args'][0], $c['args'][1])), json_encode($c['args']));
        }
        foreach (self::golden('calculate_tax') as $c) {
            $this->assertSame($c['expected'], harness_num(tep_calculate_tax($c['args'][0], $c['args'][1])), json_encode($c['args']));
        }
    }

    public function testCalculatePriceAndFormat()
    {
        foreach (self::golden('calculate_price') as $c) {
            $this->useCurrency($c['args'][3]);
            $this->assertSame($c['expected'], harness_num($GLOBALS['currencies']->calculate_price($c['args'][0], $c['args'][1], $c['args'][2])), json_encode($c['args']));
        }
        foreach (self::golden('format') as $c) {
            $this->assertSame($c['expected'], $GLOBALS['currencies']->format($c['args'][0], $c['args'][2], $c['args'][1], $c['args'][3]), json_encode($c['args']));
        }
        $this->useCurrency('USD');
    }

    public function testCartCalculate()
    {
        foreach (self::golden('cart_calculate') as $c) {
            $this->useCurrency($c['args'][0]);
            $items = array();
            foreach ($c['args'][1] as $i) {
                $attrs = array();
                foreach ($i['attributes'] as $a) $attrs[$a['optionId']] = $a['valueId'];
                $items[] = array('productId' => $i['productId'], 'qty' => $i['qty'], 'attributes' => $attrs);
            }
            $cart = $this->cart($items);
            $this->assertSame($c['expected']['total'], harness_num($cart->show_total()), json_encode($c['args']));
            $this->assertSame($c['expected']['weight'], harness_num($cart->show_weight()), json_encode($c['args']));
            $this->assertSame($c['expected']['count'], (int)$cart->count_contents(), json_encode($c['args']));
        }
        $this->useCurrency('USD');
    }
}
