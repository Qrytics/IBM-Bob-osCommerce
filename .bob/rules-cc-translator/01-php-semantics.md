# Translating osCommerce PHP to JavaScript: the traps

The fixtures compare values after PHP's own float→string conversion (14 significant digits),
with **no tolerance**. These are the places a "natural" JavaScript translation diverges:

| PHP construct | What PHP does | Use in JS |
|---|---|---|
| `strpos($number, '.')`, `substr($number, …)` on a float | converts the float to a string with 14 significant digits (`0.00001` → `"1.0E-5"`, `1e15` → `"1.0E+15"`) | `phpToString(number)` then string ops |
| `strpos(...)` returning `0` | `0` is falsy, so `if (strpos($s, '.') && …)` is false when the dot is at index 0 | check `index > 0`, not `!== -1` |
| `substr($number, -1) >= 5` | PHP 7 compares a non-numeric string with a number as `0 >= 5` | `phpToNumber(lastChar) >= 5` |
| `"1.0" . str_replace('.', '', $tax)` | string concatenation of the float's PHP string | `'1.0' + phpToString(tax).split('.').join('')`, then `phpToNumber(...)` |
| `$price + $x` where `$price` is a DB string like `"299.9900"` | numeric coercion | `phpToNumber(price) + x` |
| `$a == 'true'` on constants | string comparison | the stubs pass booleans instead (`displayPriceWithTax`) |
| `(int)$id` | truncation | `Math.trunc(phpToNumber(id))` |
| `tep_round()` returning a string | the caller multiplies it: `"10.70" * 3` | `phpToNumber(tepRound(...)) * qty` |
| `number_format()` | PHP's own rounding with pre-rounding | `phpNumberFormat()` |
| `SUM(tax_rate)` in SQL, `decimal(7,4)` | exact decimal sum, returned as a string like `"8.5000"` | sum in ten-thousandths (integers), then convert |
| `GROUP BY tax_priority` | groups in ascending priority order | sort by priority before compounding |
| `LEFT JOIN zones_to_geo_zones` | a rate whose geo zone has no zone rows still matches (NULL columns) | treat "no association" as a match |
| associative arrays (`tax_groups`) | keep insertion order | arrays of `{ description, amount }` in first-seen order |
| `+=` on a missing array key | `null + x` = `x` (with a notice) | create the entry when missing |

Order of floating-point operations matters too: `$price * $tax / 100` is `(price * tax) / 100`,
not `price * (tax / 100)`. Keep the legacy operand order exactly.

Workflow per module:
1. `npm run check:<module>`: read the first failure (input, legacy value, your value).
2. Open the cited legacy lines and trace the value by hand.
3. Fix, re-run, repeat. Then `npm run lint`.
