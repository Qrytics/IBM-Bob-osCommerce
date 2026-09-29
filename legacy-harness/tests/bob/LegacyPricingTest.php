<?php
/**
 * Characterization tests for the legacy pricing math, written by Bob (BOB_TASKS.md T2).
 *
 * Mode: 🧪 CleanCart Legacy Tester. May edit: legacy-harness/tests/bob/*Test.php only.
 * Run:  npm run legacy:test
 *
 * Rules for these tests:
 *  - Call the REAL legacy code (it is already loaded). Never re-implement it here.
 *  - Assert what the code returns TODAY, including its quirks (docs/legacy-quirks.md).
 *  - Name every test after the business rule it pins down, e.g. testBR07RoundsUnitPriceBeforeQuantity.
 *  - Use requireMode(true|false) for rules that only apply in one DISPLAY_PRICE_WITH_TAX mode.
 *  - Replace every markTestIncomplete() below. The suite fails while any remain.
 */

class LegacyPricingTest extends LegacyTestCase
{
    // -------------------------------------------------------------------------
    // BR-01 / tep_round — basic half-up rounding via string manipulation
    // Golden evidence: fixtures/golden/functions/tep_round.json
    // -------------------------------------------------------------------------

    public function testBR01TepRoundTruncatesTheStringForm()
    {
        // Half-up cases from the golden fixture (args and expected values come
        // directly from fixtures/golden/functions/tep_round.json).
        $this->assertSame('1.01',  harness_num(tep_round(1.005,        2)), 'tep_round(1.005, 2)');
        $this->assertSame('2.68',  harness_num(tep_round(2.675,        2)), 'tep_round(2.675, 2)');
        $this->assertSame('1.96',  harness_num(tep_round(1.955,        2)), 'tep_round(1.955, 2)');
        $this->assertSame('0.29',  harness_num(tep_round(0.285,        2)), 'tep_round(0.285, 2)');
        $this->assertSame('1.5',   harness_num(tep_round(1.45,         1)), 'tep_round(1.45, 1)');
        $this->assertSame('3',     harness_num(tep_round(2.5,          0)), 'tep_round(2.5, 0)');
        $this->assertSame('4',     harness_num(tep_round(3.5,          0)), 'tep_round(3.5, 0)');
        $this->assertSame('1',     harness_num(tep_round(0.5,          0)), 'tep_round(0.5, 0)');
        $this->assertSame('1.99',  harness_num(tep_round(1.994999,     2)), 'tep_round(1.994999, 2)');
        // String input: tep_round receives database decimal strings like "10.0050"
        $this->assertSame('10.01', harness_num(tep_round('10.0050',    2)), 'tep_round("10.0050", 2)');
        $this->assertSame('20',    harness_num(tep_round('19.9950',    2)), 'tep_round("19.9950", 2)');
        $this->assertSame('299.99',harness_num(tep_round('299.9900',   2)), 'tep_round("299.9900", 2)');
        $this->assertSame('0',     harness_num(tep_round('0.0000',     2)), 'tep_round("0.0000", 2)');
        $this->assertSame('1.235', harness_num(tep_round('1.2345',     3)), 'tep_round("1.2345", 3)');
        $this->assertSame('1.234', harness_num(tep_round('1.2344',     3)), 'tep_round("1.2344", 3)');
        $this->assertSame('10.71', harness_num(tep_round(10.70535,     2)), 'tep_round(10.70535, 2)');
        $this->assertSame('42.79', harness_num(tep_round(42.7893,      2)), 'tep_round(42.7893, 2)');
        $this->assertSame('100',   harness_num(tep_round(99.995,       2)), 'tep_round(99.995, 2)');
        $this->assertSame('10',    harness_num(tep_round(9.995,        2)), 'tep_round(9.995, 2)');
        $this->assertSame('5',     harness_num(tep_round(5,            2)), 'tep_round(5, 2)');
        $this->assertSame('0',     harness_num(tep_round(0,            2)), 'tep_round(0, 2)');
        $this->assertSame('100',   harness_num(tep_round(100,          0)), 'tep_round(100, 0)');
        // Float accumulation that looks like a half-cent is still rounded correctly
        $this->assertSame('0.3',   harness_num(tep_round(0.30000000000000004, 2)), 'float epsilon near 0.3');
    }

    // -------------------------------------------------------------------------
    // Q-01 — tep_round breaks on values PHP prints in exponent form
    // Golden evidence: fixtures/golden/functions/tep_round.json
    // -------------------------------------------------------------------------

    public function testQ01TepRoundExponentForm()
    {
        // 0.00001 at precision 2: PHP converts 0.00001 to "1.0E-5", tep_round
        // mis-parses the exponent form and returns 1, not 0.
        $this->assertSame('1', harness_num(tep_round(0.00001, 2)), 'Q-01: tep_round(0.00001, 2) → "1" (not 0)');

        // At precision 4: the exponent string "1.0E-5" is exactly 4 chars after
        // the dot, so the truncation branch is NOT entered; the original string
        // "1.0E-5" is returned instead of being truncated.
        $this->assertSame('1.0E-5', harness_num(tep_round(0.00001, 4)), 'Q-01: tep_round(0.00001, 4) → "1.0E-5"');

        // A very large float PHP renders with full integer digits, no exponent:
        // 1e15+0.2 at precision 2 — PHP serialises it as "1" (loss of precision
        // because PHP precision=14 means only 14 significant digits are kept).
        $this->assertSame('1', harness_num(tep_round(1000000000000000.2, 2)), 'Q-01: large value loses decimals');
    }

    // -------------------------------------------------------------------------
    // Q-02 — tep_round rounds negative numbers toward positive infinity
    // Golden evidence: fixtures/golden/functions/tep_round.json
    // -------------------------------------------------------------------------

    public function testQ02TepRoundNegativeNumbers()
    {
        // -1.005 rounded to 2 dp: tep_round truncates "−1.005" to "−1.00",
        // sees last char "5" >= 5, then adds +0.01 (not −0.01), producing −0.99.
        $this->assertSame('-0.99', harness_num(tep_round(-1.005, 2)), 'Q-02: tep_round(-1.005, 2) → "-0.99"');

        // -2.675 at 2 dp similarly rounds toward zero / positive side.
        $this->assertSame('-2.66', harness_num(tep_round(-2.675, 2)), 'Q-02: tep_round(-2.675, 2) → "-2.66"');

        // -0.5 at precision 0: substr("-0.5", 0, 4) = "-0.5"; last char "5" >= 5;
        // precision==0 branch: substr("-0.5", 0, -1) = "-0." → PHP evaluates "-0."
        // as -0.0 = 0; 0 + 1 = 1.  So tep_round(-0.5, 0) returns 1, not 0 or -1.
        $this->assertSame('1', harness_num(tep_round(-0.5, 0)), 'Q-02: tep_round(-0.5, 0) → "1" (wrong direction)');

        // String negative: "-10.0050" at precision 2.
        $this->assertSame('-9.99', harness_num(tep_round('-10.0050', 2)), 'Q-02: tep_round("-10.0050", 2) → "-9.99"');
    }

    // -------------------------------------------------------------------------
    // BR-02 + BR-03 — Tax-rate lookup and compounding
    // Golden evidence: fixtures/golden/functions/tax_rate.json
    // Catalog: store country=223 (US), zone=18 (FL).
    //   tax_class=1 @ FL(country=223, zone=18): 7% (single rate)
    //   tax_class=1 @ NY(country=223, zone=43): 4% + 4.5% same priority → summed 8.5%
    //   tax_class=1 @ ON(country=38,  zone=74): 13% (single rate, BR-02)
    //   tax_class=1 @ QC(country=38,  zone=76): 5% priority-1 then 9.975% priority-2
    //                                           → compounded = 5 + 9.975×1.05 = 15.47375 (BR-03)
    //   tax_class=2 @ FL: 2.5%; tax_class=1 @ DE: 19%; tax_class=2 @ DE: 7%
    //   unknown class (0) or unknown country/zone → 0
    // -------------------------------------------------------------------------

    public function testBR02AndBR03TaxRateLookupAndCompounding()
    {
        // Florida (country=223, zone=18): class 1 → 7 %
        $this->assertSame('7',     harness_num(tep_get_tax_rate(1, 223, 18)), 'FL class-1 7%');
        // Florida: class 2 (Reduced) → 2.5 %
        $this->assertSame('2.5',   harness_num(tep_get_tax_rate(2, 223, 18)), 'FL class-2 2.5%');
        // California has no geo_zone mapping → 0
        $this->assertSame('0',     harness_num(tep_get_tax_rate(1, 223, 12)), 'CA no-rate → 0');
        // New York (country=223, zone=43): class 1 → two same-priority rows summed
        $this->assertSame('8.5',   harness_num(tep_get_tax_rate(1, 223, 43)), 'NY 4%+4.5% summed → 8.5%');
        // Ontario (country=38, zone=74): class 1 → 13 %
        $this->assertSame('13',    harness_num(tep_get_tax_rate(1, 38, 74)), 'ON HST 13%');
        // Quebec (country=38, zone=76): class 1 → compounded: 5 + 9.975*(1+5/100)
        $this->assertSame('15.47375', harness_num(tep_get_tax_rate(1, 38, 76)), 'QC GST+QST compounded');
        // Germany (country=81, any zone): class 1 → 19%; class 2 → 7%
        $this->assertSame('19',    harness_num(tep_get_tax_rate(1, 81, 79)), 'DE class-1 MwSt 19%');
        $this->assertSame('7',     harness_num(tep_get_tax_rate(2, 81, 79)), 'DE class-2 MwSt 7%');
        // Unknown tax class (99) → 0
        $this->assertSame('0',     harness_num(tep_get_tax_rate(99, 223, 18)), 'unknown class → 0');
        // Unrecognised country (222, UK) with class 1 → 0
        $this->assertSame('0',     harness_num(tep_get_tax_rate(1, 222, 0)), 'UK unknown → 0');
        // tax_class=0 (untaxed goods) → 0
        $this->assertSame('0',     harness_num(tep_get_tax_rate(0, 223, 18)), 'class-0 untaxed → 0');
        // No-argument call (uses STORE_COUNTRY=223, STORE_ZONE=18 fallback): class 1 → 7
        $this->assertSame('7',     harness_num(tep_get_tax_rate(1)), 'store default FL 7%');
    }

    // -------------------------------------------------------------------------
    // BR-04 — Tax description lookup
    // Golden evidence: fixtures/golden/functions/tax_description.json
    // -------------------------------------------------------------------------

    public function testBR04TaxDescription()
    {
        // Known descriptions
        $this->assertSame('FL TAX 7.0%',             tep_get_tax_description(1, 223, 18), 'FL 7%');
        $this->assertSame('FL Reduced 2.5%',          tep_get_tax_description(2, 223, 18), 'FL Reduced 2.5%');
        $this->assertSame('NY State 4% + NYC 4.5%',   tep_get_tax_description(1, 223, 43), 'NY joined');
        $this->assertSame('HST 13%',                  tep_get_tax_description(1, 38, 74), 'ON HST');
        $this->assertSame('GST 5% + QST 9.975%',      tep_get_tax_description(1, 38, 76), 'QC GST+QST joined');
        $this->assertSame('MwSt 19%',                 tep_get_tax_description(1, 81, 79), 'DE 19%');
        $this->assertSame('MwSt 7%',                  tep_get_tax_description(2, 81, 79), 'DE 7%');
        // Unknown / no match → literal "Unknown tax rate" (TEXT_UNKNOWN_TAX_RATE)
        $this->assertSame('Unknown tax rate',          tep_get_tax_description(0, 223, 18), 'class-0 unknown');
        $this->assertSame('Unknown tax rate',          tep_get_tax_description(1, 223, 12), 'CA no-rate');
        $this->assertSame('Unknown tax rate',          tep_get_tax_description(1, 222, 0), 'UK unknown');
        $this->assertSame('Unknown tax rate',          tep_get_tax_description(99, 223, 18), 'class-99 unknown');
    }

    // -------------------------------------------------------------------------
    // BR-05 + BR-06 — tep_add_tax and tep_calculate_tax
    // Golden evidence: fixtures/golden/functions/add_tax.json
    //                  fixtures/golden/functions/calculate_tax.json
    //
    // BR-05: tep_add_tax(price, tax): when DISPLAY_PRICE_WITH_TAX='false' it
    //        returns price unchanged; when 'true' it returns price*(1+tax/100).
    // BR-06: tep_calculate_tax(price, tax) always returns price*(tax/100),
    //        regardless of the display mode.
    // -------------------------------------------------------------------------

    public function testBR05AddTaxWhenDisplayPriceWithTaxFalse()
    {
        $this->requireMode(false);

        // When DISPLAY_PRICE_WITH_TAX = 'false', tep_add_tax must NOT add tax.
        // Selected cases from add_tax.json where displayPriceWithTax=false.
        $this->assertSame('831.4381', harness_num(tep_add_tax(831.4381, 19)),   'add_tax false: no change');
        $this->assertSame('713.9717', harness_num(tep_add_tax('713.9717', 99.5)),'add_tax false: no change string');
        $this->assertSame('242.2587', harness_num(tep_add_tax(242.2587, 0)),    'add_tax false: zero tax unchanged');
        $this->assertSame('4.34',     harness_num(tep_add_tax(4.34, 8.5)),      'add_tax false: simple');
        $this->assertSame('3.6',      harness_num(tep_add_tax(3.6, 9.975)),     'add_tax false: QC rate unchanged');
    }

    public function testBR05AddTaxWhenDisplayPriceWithTaxTrue()
    {
        $this->requireMode(true);

        // When DISPLAY_PRICE_WITH_TAX = 'true', tep_add_tax returns price*(1+tax/100).
        // Selected cases from add_tax.json where displayPriceWithTax=true.
        $this->assertSame('989.411339',   harness_num(tep_add_tax(831.4381, 19)),     '831.44×1.19');
        $this->assertSame('1424.3735415', harness_num(tep_add_tax('713.9717', 99.5)), '713.97×1.995');
        $this->assertSame('242.2587',     harness_num(tep_add_tax(242.2587, 0)),      'zero-tax unchanged');
        $this->assertSame('4.7089',       harness_num(tep_add_tax(4.34, 8.5)),        '4.34×1.085');
        $this->assertSame('3.9591',       harness_num(tep_add_tax(3.6, 9.975)),       '3.6×1.09975');
        $this->assertSame('531.88653',    harness_num(tep_add_tax(490.218, 8.5)),     '490.218×1.085');
    }

    public function testBR06CalculateTaxNeverRounds()
    {
        // tep_calculate_tax(price, tax) = price * tax / 100, no rounding applied.
        // Values from fixtures/golden/functions/calculate_tax.json.
        $this->assertSame('157.973239',          harness_num(tep_calculate_tax(831.4381,    19)),        '831.44 @ 19%');
        $this->assertSame('710.4018415',         harness_num(tep_calculate_tax('713.9717',  99.5)),      '713.97 @ 99.5%');
        $this->assertSame('17.596173251374',     harness_num(tep_calculate_tax('251.3739',  7.0000001)), '251.37 @ 7.0000001%');
        $this->assertSame('0.3591',              harness_num(tep_calculate_tax(3.6,         9.975)),     '3.6 @ 9.975%');
        $this->assertSame('41.66853',            harness_num(tep_calculate_tax(490.218,     8.5)),       '490.22 @ 8.5%');
        $this->assertSame('0',                   harness_num(tep_calculate_tax(242.2587,    0)),         'zero rate');
        $this->assertSame('9.97841',             harness_num(tep_calculate_tax(76.757,      13)),        '76.76 @ 13%');
        $this->assertSame('0.79',                harness_num(tep_calculate_tax(3.95,        20)),        '3.95 @ 20%');
        $this->assertSame('0.001305',            harness_num(tep_calculate_tax(2.61,        0.05)),      '2.61 @ 0.05%');
    }

    // -------------------------------------------------------------------------
    // BR-07 + Q-03 — currencies::calculate_price rounds the unit price first,
    //                then multiplies by quantity.
    // Golden evidence: fixtures/golden/functions/calculate_price.json
    // -------------------------------------------------------------------------

    public function testBR07CalculatePriceRoundsUnitPriceBeforeQuantity()
    {
        // All calculate_price.json cases used here are displayPriceWithTax=false.
        $this->requireMode(false);

        // Selected cases from calculate_price.json; all require the display
        // currency to be set correctly first.

        // "10.0050" @ 20% tax, qty 2, JPY (0 dp) exclusive:
        // add_tax returns price unchanged → round("10.0050", 0) = 10, ×2 = 20
        $this->useCurrency('JPY');
        $this->assertSame('20',
            harness_num($GLOBALS['currencies']->calculate_price('10.0050', 20, 2)),
            'Q-03: "10.0050" JPY qty 2 – rounds to 10 first');

        // "10.0050" @ 8.5% tax, qty 3, JPY exclusive:
        // add_tax returns price unchanged → round("10.0050", 0) = 10, ×3 = 30
        $this->assertSame('30',
            harness_num($GLOBALS['currencies']->calculate_price('10.0050', 8.5, 3)),
            'Q-03: "10.0050" @8.5% JPY qty 3 exclusive');

        // "19.9950" @ 7%, qty 100, EUR (2 dp) exclusive: add_tax returns 19.995
        // → round(19.995, 2)=20.00 → ×100 = 2000
        $this->useCurrency('EUR');
        $this->assertSame('2000',
            harness_num($GLOBALS['currencies']->calculate_price('19.9950', 7, 100)),
            'Q-03: "19.9950" @7% EUR qty 100 exclusive');

        // 29.9863 @ 99.5% no-tax, qty 100, USD (2 dp): round(29.9863,2)=29.99 → ×100=2999
        $this->useCurrency('USD');
        $this->assertSame('2999',
            harness_num($GLOBALS['currencies']->calculate_price(29.9863, 99.5, 100)),
            '29.9863 qty 100 rounds unit first → 2999');

        // "635.8982" @7.0000001% no-tax, qty 7, USD exclusive: round(635.8982,2)=635.90
        // → ×7=4451.30
        $this->assertSame('4451.3',
            harness_num($GLOBALS['currencies']->calculate_price('635.8982', 7.0000001, 7)),
            '"635.8982" qty 7');

        // "1.3333" @5% no-tax, qty 7, EUR: round(1.3333,2)=1.33 → ×7=9.31
        $this->useCurrency('EUR');
        $this->assertSame('9.31',
            harness_num($GLOBALS['currencies']->calculate_price('1.3333', 5, 7)),
            '"1.3333" @5% EUR qty 7');

        $this->useCurrency('USD'); // restore default
    }

    // -------------------------------------------------------------------------
    // BR-08 — currencies::format formats amounts in the display currency
    // Golden evidence: fixtures/golden/functions/format.json
    //
    // Signature: format($number, $calculate_currency_value = true,
    //                   $currency_type = '', $currency_value = null)
    // Fixture arg order: [amount, currencyCode, calculateValue, currencyValue]
    // format() call: format(args[0], args[2], args[1], args[3])
    // -------------------------------------------------------------------------

    public function testBR08CurrencyFormat()
    {
        $c = $GLOBALS['currencies'];

        // USD (2 dp, prefix "$", "." decimal, "," thousands)
        $this->assertSame('$0.00',   $c->format(0,     true,  'USD', null),   'USD 0');
        $this->assertSame('$1.00',   $c->format(1,     true,  'USD', null),   'USD 1 no conversion');
        $this->assertSame('$5.00',   $c->format(5,     true,  'USD', null),   'USD 5');
        $this->assertSame('$42.79',  $c->format(42.79, true,  'USD', null),   'USD 42.79');
        // With an explicit currency_value rate, amounts are multiplied
        $this->assertSame('$1.23',   $c->format(1,     true,  'USD', '1.2345'), 'USD 1 × 1.2345');
        $this->assertSame('$52.82',  $c->format(42.79, true,  'USD', '1.2345'), 'USD 42.79 × 1.2345');

        // EUR (2 dp, suffix "€", "," decimal, "." thousands) – value 0.8870
        $this->assertSame('0,00€',   $c->format(0,     true,  'EUR', null),   'EUR 0');
        $this->assertSame('0,89€',   $c->format(1,     true,  'EUR', null),   'EUR 1 (×0.887)');
        $this->assertSame('1,00€',   $c->format(1,     false, 'EUR', null),   'EUR 1 no-convert');
        $this->assertSame('4,44€',   $c->format(5,     true,  'EUR', null),   'EUR 5 (×0.887)');
        $this->assertSame('5,00€',   $c->format(5,     false, 'EUR', null),   'EUR 5 no-convert');
        $this->assertSame('37,95€',  $c->format(42.79, true,  'EUR', null),   'EUR 42.79 (×0.887)');
        $this->assertSame('42,79€',  $c->format(42.79, false, 'EUR', null),   'EUR 42.79 no-convert');

        // JPY (0 dp, prefix "¥", value 149.23)
        $this->assertSame('¥0',      $c->format(0,     true,  'JPY', null),   'JPY 0');
        $this->assertSame('¥149',    $c->format(1,     true,  'JPY', null),   'JPY 1 (×149.23)');
        $this->assertSame('¥1',      $c->format(1,     false, 'JPY', null),   'JPY 1 no-convert');
        $this->assertSame('¥746',    $c->format(5,     true,  'JPY', null),   'JPY 5 (×149.23)');
        $this->assertSame('¥5',      $c->format(5,     false, 'JPY', null),   'JPY 5 no-convert');
    }

    // -------------------------------------------------------------------------
    // BR-09 + Q-08 — Specials: active replaces price; status=0 ignored;
    //                expired-but-status-1 special is STILL applied (Q-08).
    // Golden evidence: fixtures/golden/functions/cart_calculate.json
    //   product 3  (MSIMPRO  $49.99) – active special  status=1  → $39.99
    //   product 5  (BLDRNDC  $35.99) – active special  status=1  → $30.00
    //   product 6  (MATRIX   $39.99) – active special  status=1  → $30.00
    //   product 16 (CUFI     $38.99) – active special  status=1  → $29.99
    //   product 1  (MG200    $299.99)– INACTIVE special status=0 → $299.99 (full price)
    //   product 7  (YGEM     $34.99) – EXPIRED  special status=1 → $19.99 (Q-08: still applied)
    // -------------------------------------------------------------------------

    public function testBR09AndQ08Specials()
    {
        $this->requireMode(false);
        $this->useCurrency('USD');

        // --- Active special (status=1, no expiry): product 5, qty 7 ---
        // cart_calculate.json: USD, [{productId:5, qty:7}] → total "210"
        // 7 × round(30.00, 2) = 7 × 30.00 = 210.00
        $cart = $this->cart([['productId' => 5, 'qty' => 7, 'attributes' => []]]);
        $cart->calculate();
        $this->assertSame('210', harness_num($cart->show_total()), 'active special p5 qty 7 → $210');
        $this->assertSame('49',  harness_num($cart->show_weight()), 'weight 7×7kg');
        $this->assertSame(7, (int)$cart->count_contents(), 'count_contents 7');

        // --- Active special (status=1, no expiry): product 3, qty 12 ---
        // cart_calculate.json: JPY, [{productId:3, qty:12}] → total "480"
        // However we stay in USD here. Let's use the USD fixture instead:
        // USD, [{productId:3, qty:12, ...}, {productId:28, qty:5}, {productId:25, qty:2 attr14}]
        // → total 4374.81. We only assert product 3's contribution is via special price.
        // Use a simpler single-product assertion:
        // product 3 alone qty 1 USD: calculate_price("39.9900", 0, 1) = 39.99
        $cart2 = $this->cart([['productId' => 3, 'qty' => 1, 'attributes' => []]]);
        $cart2->calculate();
        $this->assertSame('39.99', harness_num($cart2->show_total()), 'active special p3 qty 1 → $39.99');

        // --- Inactive special (status=0): product 1, uses FULL price $299.99 ---
        $cart3 = $this->cart([['productId' => 1, 'qty' => 1, 'attributes' => []]]);
        $cart3->calculate();
        $this->assertSame('299.99', harness_num($cart3->show_total()), 'status-0 special ignored → $299.99');

        // --- Q-08: Expired special (expires_date past) but status=1 IS still applied ---
        // product 7 (You've Got Mail $34.99) has expires_date='2001-01-01' and status=1
        // → legacy applies special price $19.99 because only status is checked.
        $cart4 = $this->cart([['productId' => 7, 'qty' => 1, 'attributes' => []]]);
        $cart4->calculate();
        $this->assertSame('19.99', harness_num($cart4->show_total()), 'Q-08: expired special still applied → $19.99');
    }

    // -------------------------------------------------------------------------
    // BR-10 + BR-12 — Cart attributes (+ and −), weight, count_contents
    // Golden evidence: fixtures/golden/functions/cart_calculate.json
    //
    // products_attributes (from catalog.json):
    //   product 1 options_id=4 values_id=1 price +0.00
    //              options_id=4 values_id=2 price +50.00
    //              options_id=4 values_id=3 price +70.00
    //              options_id=3 values_id=5 price +0.00
    //              options_id=3 values_id=6 price +100.00
    //   product 2 options_id=4 values_id=3 price -10.00   ← minus prefix
    //              options_id=4 values_id=4 price +0.00
    //              options_id=3 values_id=6 price +0.00
    //              options_id=3 values_id=7 price +120.00
    //   product 26 options_id=3 values_id=8 price +0.00
    //               options_id=3 values_id=9 price +6.00
    //   product 25 options_id=1 values_id=14 price +2.4950
    //               options_id=1 values_id=15 price -1.3333
    // -------------------------------------------------------------------------

    public function testBR10AndBR12CartAttributesWeightAndCount()
    {
        $this->requireMode(false);
        $this->useCurrency('USD');

        // --- Positive attribute: product 1, Memory=+70, Model=+100, qty 12 ---
        // cart_calculate.json: USD [{p=1,qty=12,attrs={3:6,4:1}}, {p=6,qty=5}]
        // → total "4949.88".  Verify the product-1 slice from golden fixture:
        //   p=1 base=$299.99, attr 4/1=+$0, attr 3/6=+$100
        //   calculate_price(299.99, 0, 12) + calculate_price(100.00, 0, 12)
        //   = round(299.99,2)×12 + round(100.00,2)×12 = 3599.88 + 1200 = 4799.88
        //   p=6 special=$30, qty 5: round(30.00,2)×5 = 150
        //   total = 4799.88 + 150 = 4949.88 ✓
        $cart = $this->cart([
            ['productId' => 1, 'qty' => 12, 'attributes' => [3 => 6, 4 => 1]],
            ['productId' => 6, 'qty' => 5,  'attributes' => []],
        ]);
        $cart->calculate();
        $this->assertSame('4949.88', harness_num($cart->show_total()), '+attr p1+p6 total');
        $this->assertSame('311',     harness_num($cart->show_weight()), 'weight 12×23+5×7=276+35=311');
        $this->assertSame(17,        (int)$cart->count_contents(), 'count 12+5=17');

        // --- Negative attribute: product 2, Memory=-10, Model=+0, qty 3 ---
        // cart_calculate fixture: USD [{p=2,qty=7,attrs={4:4}},...] too complex;
        // use a simpler case directly to verify the "-" prefix is subtracted.
        // p=2 base=$499.99; attr 4/3 = −$10.00; attr 3/6 = +$0
        // calculate_price(499.99,0,3) + calculate_price(-10.00,0,3) + calculate_price(0,0,3)
        // = round(499.99,2)×3 + round(-10.00,2)×3 = 1499.97 + (-30) = 1469.97
        $cart2 = $this->cart([
            ['productId' => 2, 'qty' => 3, 'attributes' => [4 => 3, 3 => 6]],
        ]);
        $cart2->calculate();
        $this->assertSame('1469.97', harness_num($cart2->show_total()), '-attr p2 qty 3');
        $this->assertSame('69',      harness_num($cart2->show_weight()), 'weight 3×23=69');
        $this->assertSame(3,         (int)$cart2->count_contents(), 'count 3');

        // --- Four-decimal attribute (+2.4950): product 25, qty 12, attr 1/14 ---
        // From cart_calculate.json (USD exclusive):
        //   [{p=25,qty=12,attrs={1:14}}, {p=2,qty=1,attrs={4:3,3:7}}] → total "1479.87"
        // Verify just product 25 with attr +2.4950 alone:
        //   base=69.99, attr=+2.4950; calculate_price(69.99,0,12)+calculate_price(2.4950,0,12)
        //   = round(69.99,2)×12 + round(2.495,2)×12 = 839.88 + round(2.4950,2)×12
        //   = 839.88 + 2.50×12 = 839.88 + 30 = 869.88
        $cart3 = $this->cart([
            ['productId' => 25, 'qty' => 12, 'attributes' => [1 => 14]],
        ]);
        $cart3->calculate();
        $this->assertSame('869.88', harness_num($cart3->show_total()), '+2.4950 attr qty 12');
        $this->assertSame('96',     harness_num($cart3->show_weight()), 'weight 12×8=96');
        $this->assertSame(12,       (int)$cart3->count_contents(), 'count 12');

        // --- Negative four-decimal attribute (−1.3333): product 25, qty 1, attr 1/15 ---
        // p=25 base=69.99, attr=−1.3333
        // calculate_price(69.99,0,1)+calculate_price(-1.3333,0,1)
        // = round(69.99,2) + round(-1.3333,2) = 69.99 + (-1.33) = 68.66
        $cart4 = $this->cart([
            ['productId' => 25, 'qty' => 1, 'attributes' => [1 => 15]],
        ]);
        $cart4->calculate();
        $this->assertSame('68.66', harness_num($cart4->show_total()), '-1.3333 attr qty 1');
        $this->assertSame('8',     harness_num($cart4->show_weight()), 'weight 1×8=8');
        $this->assertSame(1,       (int)$cart4->count_contents(), 'count 1');

        // --- Mixed cart: golden fixture from cart_calculate.json ---
        // USD, [{p=1,qty=1,attrs={4:1}}, {p=16,qty=12}, {p=2,qty=1,attrs={4:3}}]
        // → total "1149.86", weight "130", count 14
        $cart5 = $this->cart([
            ['productId' => 1,  'qty' => 1,  'attributes' => [4 => 1]],
            ['productId' => 16, 'qty' => 12, 'attributes' => []],
            ['productId' => 2,  'qty' => 1,  'attributes' => [4 => 3]],
        ]);
        $cart5->calculate();
        $this->assertSame('1149.86', harness_num($cart5->show_total()),   'mixed attr golden total');
        $this->assertSame('130',     harness_num($cart5->show_weight()),  'mixed weight 130');
        $this->assertSame(14,        (int)$cart5->count_contents(),       'mixed count 14');

        $this->useCurrency('USD'); // restore
    }
}
