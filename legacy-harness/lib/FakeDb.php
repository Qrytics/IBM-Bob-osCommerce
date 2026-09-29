<?php
/**
 * In-memory stand-in for osCommerce's MySQL layer.
 *
 * The legacy code calls tep_db_query() with raw SQL strings. FakeDb recognises
 * exactly the queries that the pricing slice issues and answers them from
 * fixtures/catalog.json, reproducing MySQL semantics that matter for the math:
 *   - every column value comes back as a string (mysqli behaviour)
 *   - SUM() over decimal(7,4) returns a 4-decimal string
 *   - GROUP BY tax_priority returns groups in ascending priority order
 *   - LEFT JOIN zones_to_geo_zones yields NULL columns when nothing matches
 *
 * Any query that is not recognised throws, so the harness can never silently
 * return wrong data.
 */
class FakeDb
{
    /** @var array */
    private static $db;
    /** @var string[] */
    public static $log = array();

    public static function load(array $catalog)
    {
        self::$db = $catalog;
        self::$log = array();
    }

    public static function query($sql)
    {
        self::$log[] = $sql;
        $s = preg_replace('/\s+/', ' ', trim($sql));

        $routes = array(
            'currencies'          => '/^select code, title, symbol_left, symbol_right, decimal_point, thousands_point, decimal_places, value from currencies$/',
            'cartProduct'         => "/^select products_id, products_price, products_tax_class_id, products_weight from products where products_id = '(\\d+)'$/",
            'special'             => "/^select specials_new_products_price from specials where products_id = '(\\d+)' and status = '?1'?$/",
            'attributePrice'      => "/^select options_values_price, price_prefix from products_attributes where products_id = '(\\d+)' and options_id = '(\\d+)' and options_values_id = '(\\d+)'$/",
            'taxRate'             => "/^select sum\\(tax_rate\\) as tax_rate from tax_rates tr left join zones_to_geo_zones za on \\(tr.tax_zone_id = za.geo_zone_id\\) left join geo_zones tz on \\(tz.geo_zone_id = tr.tax_zone_id\\) where \\(za.zone_country_id is null or za.zone_country_id = '0' or za.zone_country_id = '(-?\\d+)'\\) and \\(za.zone_id is null or za.zone_id = '0' or za.zone_id = '(-?\\d+)'\\) and tr.tax_class_id = '(-?\\d+)' group by tr.tax_priority$/",
            'taxDescription'      => "/^select tax_description from tax_rates tr left join zones_to_geo_zones za on \\(tr.tax_zone_id = za.geo_zone_id\\) left join geo_zones tz on \\(tz.geo_zone_id = tr.tax_zone_id\\) where \\(za.zone_country_id is null or za.zone_country_id = '0' or za.zone_country_id = '(-?\\d+)'\\) and \\(za.zone_id is null or za.zone_id = '0' or za.zone_id = '(-?\\d+)'\\) and tr.tax_class_id = '(-?\\d+)' order by tr.tax_priority$/",
            'customerAddress'     => "/^select c.customers_firstname, .* from customers c, address_book ab .* where c.customers_id = '(\\d+)' .*$/",
            'cartProductDetails'  => "/^select p.products_id, pd.products_name, p.products_model, p.products_image, p.products_price, p.products_weight, p.products_tax_class_id from products p, products_description pd where p.products_id = '(\\d+)' and pd.products_id = p.products_id and pd.language_id = '(\\d+)'$/",
            'orderAttribute'      => "/^select popt.products_options_name, poval.products_options_values_name, pa.options_values_price, pa.price_prefix from products_options popt, products_options_values poval, products_attributes pa where pa.products_id = '(\\d+)' and pa.options_id = '(\\d+)' and pa.options_id = popt.products_options_id and pa.options_values_id = '(\\d+)' and pa.options_values_id = poval.products_options_values_id and popt.language_id = '(\\d+)' and poval.language_id = '(\\d+)'$/",
        );

        foreach ($routes as $name => $pattern) {
            if (preg_match($pattern, $s, $m)) {
                array_shift($m);
                $rows = call_user_func_array(array('FakeDb', 'q_' . $name), $m);
                return new FakeDbResult(self::stringify($rows));
            }
        }

        throw new RuntimeException("FakeDb: unrecognised query: $s");
    }

    // ---- query handlers ---------------------------------------------------

    private static function q_currencies()
    {
        return self::$db['currencies'];
    }

    private static function q_cartProduct($id)
    {
        $p = self::product($id);
        return $p ? array(self::pick($p, array('products_id', 'products_price', 'products_tax_class_id', 'products_weight'))) : array();
    }

    private static function q_special($id)
    {
        $rows = array();
        foreach (self::$db['specials'] as $sp) {
            if ((int)$sp['products_id'] === (int)$id && (string)$sp['status'] === '1') {
                $rows[] = array('specials_new_products_price' => $sp['specials_new_products_price']);
            }
        }
        return $rows;
    }

    private static function q_attributePrice($pid, $opt, $val)
    {
        $rows = array();
        foreach (self::$db['products_attributes'] as $a) {
            if ((int)$a['products_id'] === (int)$pid && (int)$a['options_id'] === (int)$opt && (int)$a['options_values_id'] === (int)$val) {
                $rows[] = array('options_values_price' => $a['options_values_price'], 'price_prefix' => $a['price_prefix']);
            }
        }
        return $rows;
    }

    private static function q_taxRate($country, $zone, $class)
    {
        $groups = array();
        foreach (self::taxJoin($country, $zone, $class) as $r) {
            $p = (int)$r['tax_priority'];
            if (!isset($groups[$p])) $groups[$p] = 0;
            // decimal(7,4) arithmetic in integer ten-thousandths, like MySQL
            $groups[$p] += (int)round(((float)$r['tax_rate']) * 10000);
        }
        ksort($groups);
        $rows = array();
        foreach ($groups as $sum) {
            $rows[] = array('tax_rate' => number_format($sum / 10000, 4, '.', ''));
        }
        return $rows;
    }

    private static function q_taxDescription($country, $zone, $class)
    {
        $joined = self::taxJoin($country, $zone, $class);
        usort($joined, function ($a, $b) {
            $d = (int)$a['tax_priority'] - (int)$b['tax_priority'];
            return $d !== 0 ? $d : (int)$a['tax_rates_id'] - (int)$b['tax_rates_id'];
        });
        $rows = array();
        foreach ($joined as $r) {
            $rows[] = array('tax_description' => $r['tax_description']);
        }
        return $rows;
    }

    private static function q_customerAddress($customerId)
    {
        return array(); // guest checkout: no stored customer
    }

    private static function q_cartProductDetails($id, $languageId)
    {
        $p = self::product($id);
        if (!$p) return array();
        return array(array(
            'products_id' => $p['products_id'],
            'products_name' => $p['products_name'],
            'products_model' => $p['products_model'],
            'products_image' => '',
            'products_price' => $p['products_price'],
            'products_weight' => $p['products_weight'],
            'products_tax_class_id' => $p['products_tax_class_id'],
        ));
    }

    private static function q_orderAttribute($pid, $opt, $val, $lang1, $lang2)
    {
        $optName = null;
        foreach (self::$db['products_options'] as $o) {
            if ((int)$o['products_options_id'] === (int)$opt && (int)$o['language_id'] === (int)$lang1) $optName = $o['products_options_name'];
        }
        $valName = null;
        foreach (self::$db['products_options_values'] as $v) {
            if ((int)$v['products_options_values_id'] === (int)$val && (int)$v['language_id'] === (int)$lang2) $valName = $v['products_options_values_name'];
        }
        if ($optName === null || $valName === null) return array();
        $rows = array();
        foreach (self::q_attributePrice($pid, $opt, $val) as $a) {
            $rows[] = array('products_options_name' => $optName, 'products_options_values_name' => $valName) + $a;
        }
        return $rows;
    }

    // ---- helpers ----------------------------------------------------------

    /** tax_rates LEFT JOIN zones_to_geo_zones + the legacy WHERE clause. */
    private static function taxJoin($country, $zone, $class)
    {
        $out = array();
        foreach (self::$db['tax_rates'] as $tr) {
            if ((int)$tr['tax_class_id'] !== (int)$class) continue;
            $assoc = array();
            foreach (self::$db['zones_to_geo_zones'] as $za) {
                if ((int)$za['geo_zone_id'] === (int)$tr['tax_zone_id']) $assoc[] = $za;
            }
            if (!$assoc) $assoc = array(null);
            foreach ($assoc as $za) {
                $countryOk = $za === null || (int)$za['zone_country_id'] === 0 || (int)$za['zone_country_id'] === (int)$country;
                $zoneOk = $za === null || (int)$za['zone_id'] === 0 || (int)$za['zone_id'] === (int)$zone;
                if ($countryOk && $zoneOk) $out[] = $tr;
            }
        }
        return $out;
    }

    private static function product($id)
    {
        foreach (self::$db['products'] as $p) {
            if ((int)$p['products_id'] === (int)$id) return $p;
        }
        return null;
    }

    private static function pick(array $row, array $cols)
    {
        $out = array();
        foreach ($cols as $c) $out[$c] = $row[$c];
        return $out;
    }

    /** mysqli returns every non-NULL column as a string. */
    private static function stringify(array $rows)
    {
        foreach ($rows as $i => $row) {
            foreach ($row as $k => $v) {
                $rows[$i][$k] = $v === null ? null : (string)$v;
            }
        }
        return array_values($rows);
    }
}

class FakeDbResult
{
    public $rows;
    public $cursor = 0;

    public function __construct(array $rows)
    {
        $this->rows = $rows;
    }
}

function tep_db_query($query, $link = 'db_link')
{
    return FakeDb::query($query);
}

function tep_db_fetch_array($result)
{
    if ($result->cursor < count($result->rows)) {
        return $result->rows[$result->cursor++];
    }
    return false;
}

function tep_db_num_rows($result)
{
    return count($result->rows);
}
