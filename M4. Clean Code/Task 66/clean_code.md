# Refactoring Code for Simplicity

## **Find an example of overly complicated code in an existing project**

# Before: tangled, repetitive validator

```php
<?php
function validateJob($data) {
    $errors = array();

    // Position ID
    if (!isset($data['positionId'])) {
        $errors[] = "Position ID is missing.";
    } else {
        $pid = trim($data['positionId']);
        if ($pid === "") {
            $errors[] = "Position ID is required.";
        } else {
            if (strlen($pid) !== 5) {
                $errors[] = "Position ID must be 5 chars (e.g., ID123).";
            } else {
                if (substr($pid, 0, 2) !== "ID") {
                    $errors[] = "Position ID must start with 'ID'.";
                } else {
                    $digits = substr($pid, 2);
                    if (!ctype_digit($digits)) {
                        $errors[] = "Position ID must end with 3 digits.";
                    } else {
                        // uniqueness check (inline + deeply nested)
                        $file = 'positions.txt';
                        if (file_exists($file)) {
                            $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                            foreach ($lines as $line) {
                                $parts = explode("\t", $line);
                                if (isset($parts[0]) && $parts[0] === $pid) {
                                    $errors[] = "Position ID must be unique.";
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Title
    if (!isset($data['title'])) {
        $errors[] = "Title is missing.";
    } else {
        $title = trim($data['title']);
        if ($title === "") {
            $errors[] = "Title is required.";
        } else {
            if (strlen($title) > 10) {
                $errors[] = "Title must be ≤ 10 characters.";
            } else {
                if (!preg_match('/^[A-Za-z0-9 ,.!]+$/', $title)) {
                    $errors[] = "Title has invalid characters.";
                }
            }
        }
    }

    // Description
    if (!isset($data['description'])) {
        $errors[] = "Description is missing.";
    } else {
        $desc = trim($data['description']);
        if ($desc === "") {
            $errors[] = "Description is required.";
        } else {
            if (strlen($desc) > 250) {
                $errors[] = "Description must be ≤ 250 characters.";
            }
        }
    }

    // (…more nested checks for contract, position type, application methods…)

    return $errors;
}

```

## What makes it “overly complicated”?

- Deeply nested `if/else` blocks.
- Repeated trimming/required/length checks.
- File I/O and uniqueness logic buried inside validation branches.
- Hard-to-scan control flow; small changes risk regressions.

---

# After: small rules, guard clauses, and a tiny rule engine

```php
<?php
// ---- Small helpers ----
function required($label, $value) {
    return (trim((string)$value) === "") ? "$label is required." : null;
}
function maxLen($label, $value, $n) {
    return (strlen((string)$value) > $n) ? "$label must be ≤ $n characters." : null;
}
function pattern($label, $value, $regex, $msg) {
    return (!preg_match($regex, (string)$value)) ? "$label $msg" : null;
}
function equalsLen($label, $value, $n, $msg) {
    return (strlen((string)$value) !== $n) ? "$label $msg" : null;
}
function prefix($label, $value, $pfx, $msg) {
    return (substr((string)$value, 0, strlen($pfx)) !== $pfx) ? "$label $msg" : null;
}
function uniquePositionId($label, $pid, $file) {
    if (!file_exists($file)) return null; // treat as unique if no store yet
    $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $parts = explode("\t", $line);
        if (isset($parts[0]) && $parts[0] === $pid) return "$label must be unique.";
    }
    return null;
}

// ---- Rule applier ----
function applyRules($label, $value, $rules) {
    $errs = array();
    foreach ($rules as $rule) {
        $msg = call_user_func($rule, $label, $value);
        if ($msg) $errs[] = $msg;
    }
    return $errs;
}

// ---- Main validator (flat, readable) ----
function validateJob($data) {
    $errors = array();

    $pid  = isset($data['positionId']) ? trim($data['positionId']) : "";
    $title = isset($data['title']) ? trim($data['title']) : "";
    $desc = isset($data['description']) ? trim($data['description']) : "";

    // Position ID: "ID" + 3 digits, 5 chars total, unique in positions.txt
    $errors = array_merge($errors, applyRules('Position ID', $pid, array(
        function($L, $v){ return required($L, $v); },
        function($L, $v){ return equalsLen($L, $v, 5, "must be 5 characters (e.g., ID123)."); },
        function($L, $v){ return prefix($L, $v, "ID", "must start with 'ID'."); },
        function($L, $v){ return pattern($L, substr($v, 2), '/^[0-9]{3}$/', "must end with 3 digits."); },
        function($L, $v){ return uniquePositionId($L, $v, 'positions.txt'); }
    )));

    // Title: ≤ 10 chars, allowed chars: letters/digits/space/comma/period/exclamation
    $errors = array_merge($errors, applyRules('Title', $title, array(
        function($L, $v){ return required($L, $v); },
        function($L, $v){ return maxLen($L, $v, 10); },
        function($L, $v){ return pattern($L, $v, '/^[A-Za-z0-9 ,.!]+$/', "has invalid characters."); }
    )));

    // Description: ≤ 250 chars
    $errors = array_merge($errors, applyRules('Description', $desc, array(
        function($L, $v){ return required($L, $v); },
        function($L, $v){ return maxLen($L, $v, 250); }
    )));

    // (Add more fields as simple applyRules calls)

    return $errors;
}

```

## Why this is simpler & more readable

- **Guard-style, flat flow:** No deep nesting; each rule is one line.
- **Small, named helpers:** `required`, `maxLen`, `pattern`, etc. make intent obvious.
- **Data-driven rules:** Add/change a constraint by editing a small closure—no tangled branches.
- **Separation of concerns:** Uniqueness check is a helper, not buried in control flow.
- **Error collection is uniform:** One way to produce messages across all fields.

---

## Quick usage example

```php
$data = array(
    'positionId' => 'ID101',
    'title' => 'IT Lead',
    'description' => 'Oversee team…'
);
$errors = validateJob($data);
if ($errors) {
    foreach ($errors as $e) echo "<li>$e</li>";
} else {
    echo "OK to save.";
}

```

---

## Commit message you can use

```
refactor(validate): replace nested conditionals with rule-based validators

- Introduce small helpers: required, maxLen, pattern, equalsLen, prefix, uniquePositionId
- Add applyRules() to standardize validation flow and messages
- Flatten control flow in validateJob(); no deep if/else chains
- Easier to add/modify constraints with minimal risk

```

## Reflections

1. What made the original code complex?
- The control flow became difficult to follow because of deep nesting which included multiple if/else statements.
- The code contained both validation rules and file I/O operations (uniqueness check) which were combined within the same conditional branches.
- The same validation checks for “trim/required/length/pattern” appeared multiple times throughout the code.
- Each branch generated its own error strings which could lead to different messages.
- A single large validator function handled all operations which made changes dangerous.
- The code structure made testing difficult because it lacked small independent functions which forced tests to run through extensive paths.
- The file reading operations remained hidden within the validation logic which made them difficult to detect at first glance.

1. How did refactoring improve it?
- The validator now uses flat flow with guard-style rules which replaces deep nesting with short linear rule checks.
- The required, maxLen, pattern, prefix, uniquePositionId helpers function as small reusable components which both simplify understanding and eliminate duplicate code.
- The validator now handles only rules while a dedicated helper performs uniqueness/file I/O operations.
- The applyRules function accepts field, value and optional rules parameters to enable simple addition and modification of constraints.
- The system produces uniform error messages because it uses a single path to collect messages.
- The small pure functions enable simple unit testing while reducing the number of paths that need to be tested.
- The system becomes more maintainable because smaller diffs and clearer imports and localized changes decrease the risk of regression.