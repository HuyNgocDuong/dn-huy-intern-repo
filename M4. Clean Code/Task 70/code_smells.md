# Identifying & Fixing Code Smells

## **Find or write code examples that demonstrate the following code smells, refactor the code to eliminate these code smells.**

# 1) Magic Numbers & Strings

**Before**

```php
<?php
function shippingCost($weightKg, $country) {
    $base = ($country === 'AU') ? 7.5 : 15; // magic numbers
    return $base + ($weightKg * 1.2);      // magic multiplier
}

```

**After**

```php
<?php
define('SHIP_BASE_AU', 7.50);
define('SHIP_BASE_INTL', 15.00);
define('SHIP_RATE_PER_KG', 1.20);

function shippingCost($weightKg, $country) {
    $base = ($country === 'AU') ? SHIP_BASE_AU : SHIP_BASE_INTL;
    return $base + ($weightKg * SHIP_RATE_PER_KG);
}

```

---

# 2) Long Function (does too much)

**Before**

```php
<?php
function registerUser($data) {
    // validate
    if (empty($data['email']) || strpos($data['email'], '@') === false) {
        return array('error' => 'Invalid email');
    }
    if (strlen($data['password']) < 8) {
        return array('error' => 'Weak password');
    }
    // normalize
    $email = strtolower(trim($data['email']));
    // persist (pretend)
    file_put_contents('users.txt', $email . "\n", FILE_APPEND);
    // notify (pretend)
    mail($email, 'Welcome', 'Thanks for joining!');
    return array('ok' => true);
}

```

**After**

```php
<?php
function validateUser($data) {
    if (empty($data['email']) || strpos($data['email'], '@') === false) {
        return 'Invalid email';
    }
    if (strlen($data['password']) < 8) {
        return 'Weak password';
    }
    return null;
}
function normalizeEmail($email) { return strtolower(trim($email)); }
function saveUser($email) { file_put_contents('users.txt', $email . "\n", FILE_APPEND); }
function notifyUser($email) { mail($email, 'Welcome', 'Thanks for joining!'); }

function registerUser($data) {
    if ($err = validateUser($data)) return array('error' => $err);
    $email = normalizeEmail($data['email']);
    saveUser($email);
    notifyUser($email);
    return array('ok' => true);
}

```

---

# 3) Duplicate Code

**Before**

```php
<?php
function showCartTotal($total) {
    echo '$' . number_format((float)$total, 2); // duplicated formatting
}
function showOrderTotal($total) {
    echo '$' . number_format((float)$total, 2); // duplicated formatting
}

```

**After**

```php
<?php
function formatCurrency($amount, $symbol = '$') {
    return $symbol . number_format((float)$amount, 2);
}
function showCartTotal($total) { echo formatCurrency($total); }
function showOrderTotal($total) { echo formatCurrency($total); }

```

---

# 4) Large Class (God Object)

**Before**

```php
<?php
class App {
    public function createUser($data) { /* validate, save, email */ }
    public function sendNewsletter($msg) { /* mail to all */ }
    public function backupDatabase() { /* dump to file */ }
    public function generateReport() { /* compute everything */ }
}

```

**After**

```php
<?php
class UserService { public function create($data) { /* only user logic */ } }
class MailService { public function sendNewsletter($msg) { /* only mail */ } }
class BackupService { public function backup() { /* only backup */ } }

class AppController {
    private $users, $mail, $backup;
    public function __construct() {
        $this->users = new UserService();
        $this->mail = new MailService();
        $this->backup = new BackupService();
    }
    public function onboard($data) { $this->users->create($data); }
}

```

---

# 5) Deeply Nested Conditionals

**Before**

```php
<?php
function canAccess($user) {
    if ($user) {
        if (!empty($user['active'])) {
            if (in_array('ADMIN', $user['roles'])) {
                return true;
            } else {
                return false;
            }
        } else { return false; }
    } else { return false; }
}

```

**After (guard clauses)**

```php
<?php
function canAccess($user) {
    if (!$user) return false;
    if (empty($user['active'])) return false;
    return in_array('ADMIN', $user['roles']);
}

```

---

# 6) Commented-Out Code

**Before**

```php
<?php
function double($x) {
    // $y = $x + $x; // old attempt
    // return $y;    // kept “just in case”
    return $x * 2;
}

```

**After**

```php
<?php
// Doubles a number. See design note in docs/arith.md.
function double($x) { return $x * 2; }

```

*(Remove dead code; rely on version control for history.)*

---

# 7) Inconsistent Naming

**Before**

```php
<?php
function calcTot($arr) {
    $r = 0;
    foreach ($arr as $x) { $r += $x; }
    return $r;
}

```

**After**

```php
<?php
function calculateTotal($amounts) {
    $total = 0;
    foreach ($amounts as $amount) { $total += $amount; }
    return $total;
}

```

---

## Quick checklist you can copy into PRs

- Replace magic numbers/strings with named constants.
- Split long functions into focused helpers; keep orchestration high-level.
- Extract duplicated logic into shared utilities.
- Break “god classes” into cohesive services.
- Use guard clauses to flatten nested `if/else`.
- Delete commented-out code; document intent in README/docs.
- Standardize naming: descriptive, consistent style across the codebase.

**Suggested commit message**

```
refactor: remove code smells (magic values, long fn, dup logic, god class, deep nesting, dead code, naming)

- Introduce constants and helpers (formatCurrency, shipping cost rates)
- Split registerUser into validate/normalize/persist/notify
- Replace duplicate formatting with shared utility
- Decompose App into User/Mail/Backup services
- Flatten conditionals with guard clauses
- Remove commented-out code; add brief docs
- Standardize naming for clarity

```

## Reflections

**What code smells did you find?**

- Magic numbers/strings: Hardcoded rates and symbols in shippingCost (7.5, 15, 1.2, 'AU').
- The registerUser function performs mixed validation and normalization and persistence and email operations.
- Duplicate code: Repeated currency formatting in showCartTotal / showOrderTotal.
- The system contains a single large class (God object) which manages users, newsletters, backups and reports.
- Deeply nested conditionals: canAccess with multi-level if/else.
- Commented-out code: Old lines left in double.
- The code contains inconsistent naming conventions because it uses calcTot($arr) with unclear variable names.

**The process of refactoring brought about improvements to both readability and maintainability of the codebase.**

- Introduced constants: Replaced magic values with SHIP_BASE_AU, SHIP_RATE_PER_KG → intent is obvious, single source of truth.
- The responsibilities were split into smaller functions: validateUser, normalizeEmail, saveUser, notifyUser → smaller, focused functions.
- DRY utilities: Extracted formatCurrency() → one implementation, fewer bugs/tests.
- The decomposition of god objects into UserService, MailService, BackupService results in higher cohesion and easier changes.
- Guard clauses: Flattened canAccess() → linear, skimmable logic.
- The dead code removal eliminated the dependency on VCS history which makes the code more readable.
- Consistent naming: calculateTotal($amounts) / total → self-documenting, easier onboarding.
- Better testability: Small pure helpers are trivial to unit test; refactors are safer.

**How does avoiding code smells make future debugging easier?**

- Faster fault isolation: Clear boundaries (small functions/services) shrink the search area.
- Fewer regression points: One shared utility vs. many copies reduces “fix in one place, miss in another.”
- Named constants/functions help to make incorrect behavior more noticeable.
- Simpler control flow: Guard clauses and short functions reduce deep-branch bugs.
- Deterministic behavior: Centralized formatting/validation avoids environment-specific surprises.
- Better logs & errors: Focused functions make it obvious where to add targeted logging.
- Stronger tests: Clean seams enable precise unit tests that catch defects early.