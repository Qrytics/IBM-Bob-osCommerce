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
    public function testBR01TepRoundTruncatesTheStringForm()
    {
        $this->markTestIncomplete('TODO(bob): tep_round() half-up cases, e.g. 1.005, "10.0050", 2.675, precision 0 and 1');
    }

    public function testQ01TepRoundExponentForm()
    {
        $this->markTestIncomplete('TODO(bob): tep_round(0.00001, 2) and a 1e15-sized value (Q-01)');
    }

    public function testQ02TepRoundNegativeNumbers()
    {
        $this->markTestIncomplete('TODO(bob): tep_round(-1.005, 2) and tep_round(-0.5, 0) (Q-02)');
    }

    public function testBR02AndBR03TaxRateLookupAndCompounding()
    {
        $this->markTestIncomplete('TODO(bob): Florida 7%, California 0, New York 4%+4.5% summed, Quebec 5% then 9.975% compounded');
    }

    public function testBR04TaxDescription()
    {
        $this->markTestIncomplete('TODO(bob): joined descriptions and "Unknown tax rate"');
    }

    public function testBR05AndBR06AddTaxAndCalculateTax()
    {
        $this->markTestIncomplete('TODO(bob): tep_add_tax() in this mode (requireMode) and tep_calculate_tax() without rounding');
    }

    public function testBR07CalculatePriceRoundsUnitPriceBeforeQuantity()
    {
        $this->markTestIncomplete('TODO(bob): calculate_price("10.0050", 0, 7) and friends (Q-03)');
    }

    public function testBR08CurrencyFormat()
    {
        $this->markTestIncomplete('TODO(bob): format() for USD, EUR (0.8870, "," decimals) and JPY (0 decimals)');
    }

    public function testBR09AndQ08Specials()
    {
        $this->markTestIncomplete('TODO(bob): active special replaces the price; status 0 ignored; expired special still applied');
    }

    public function testBR10AndBR12CartAttributesWeightAndCount()
    {
        $this->markTestIncomplete('TODO(bob): shoppingCart::calculate() with + and - attributes; weight and count_contents()');
    }
}
