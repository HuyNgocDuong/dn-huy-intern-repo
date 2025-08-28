# Handling Errors & Edge Cases

## **Find an existing function that doesn’t properly handle errors or invalid inputs.**

# Before — lax error handling

```php
<?php
// Returns percentage (part/whole * 100).
function percentage($part, $whole) {
    return ($part / $whole) * 100; // blows up or returns INF/NAN on bad input
}

```

Problems:

- No type checks (`"ten"` or `null` pass through).
- Division by zero triggers warnings/INF.
- No clear error messages for callers.

# After — validate inputs + clear errors

```php
<?php
/**
 * Compute (part / whole) * 100 with basic validation.
 *
 * @param mixed $part
 * @param mixed $whole
 * @param int   $precision  Number of decimal places (default 2)
 * @return float
 * @throws InvalidArgumentException if inputs are non-numeric or whole == 0
 */
function percentage($part, $whole, $precision = 2) {
    // Validate types
    if (!is_numeric($part) || !is_numeric($whole)) {
        throw new InvalidArgumentException('part and whole must be numeric.');
    }

    // Cast once after validation
    $part  = (float) $part;
    $whole = (float) $whole;

    // Guard against division by zero
    if ($whole == 0.0) {
        throw new InvalidArgumentException('whole must not be zero.');
    }

    // Validate precision
    if (!is_int($precision) || $precision < 0 || $precision > 6) {
        throw new InvalidArgumentException('precision must be an integer between 0 and 6.');
    }

    $value = ($part / $whole) * 100.0;
    return round($value, $precision);
}

// Example usage
try {
    echo percentage('25', '200');   // 12.5
    echo "\n";
    echo percentage(5, 0);          // throws: whole must not be zero.
} catch (InvalidArgumentException $e) {
    echo 'Error: ' . $e->getMessage();
}

```

## What improved (quick hits)

- **Input validation:** Rejects non-numeric inputs early with explicit messages.
- **Safety:** Prevents division by zero.
- **Clear contract:** Docblock defines args, return, and failure modes.
- **Predictable output:** Rounded to a caller-controlled precision.
- **Caller ergonomics:** Exceptions make error paths explicit and testable.

## Reflections

1. The original code contained what problem?
- The code lacked input validation because it accepted both numeric and non-numeric values including "ten" and null.
- The code contained a division by zero risk which produced warnings and generated INF/NaN results.
- The PHP system performs implicit type juggling which conceals programming bugs from developers.
- The function lacked a defined contract which made it unclear when or why it would fail.
- The output lacked defined precision and formatting which resulted in inconsistent results.
- The system failed to produce any warnings as it allowed defective values to continue through the following stages of logic execution.

1. What measures should be taken to improve reliability through error handling?
- The function stops execution immediately with an explicit InvalidArgumentException to prevent bad states from progressing.
- The whole == 0 check prevents the production of INF/NaN results.
- The system produces consistent outputs because it validates and normalizes inputs while rounding them.
- The try/catch mechanism provides callers with options to either recover from errors or display user-friendly messages.
- The explicit error paths together with contracts make unit testing more straightforward.
- The system maintains a limited damage area because invalid inputs prevent their spread to subsequent calculations or user interface elements.