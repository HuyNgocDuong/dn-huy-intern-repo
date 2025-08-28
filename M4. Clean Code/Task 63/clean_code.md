# Naming Variables & Functions

## **Find examples of unclear variable names in an existing codebase**

# JavaScript example

**Before (unclear):**

```jsx
function c(u) {
  const r = [];
  for (let i = 0; i < u.length; i++) {
    if (u[i].a > 18) r.push(u[i].n);
  }
  return r;
}

```

**After (clear):**

```jsx
function collectAdultNames(users) {
  const names = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.age > 18) names.push(user.name);
  }
  return names;
}

```

Renames:

- `c` → `collectAdultNames`
- `u` → `users`, `r` → `names`, `a` → `age`, `n` → `name`, `i` → `index` (implicitly via `i` loop var)

---

# Python example

**Before (unclear):**

```python
def f(xs):
    m = {}
    for t in xs:
        k = t[0]
        v = t[1]
        m[k] = m.get(k, 0) + v
    return m

```

**After (clear):**

```python
def total_amount_by_category(pairs):
    totals = {}
    for category, amount in pairs:
        totals[category] = totals.get(category, 0) + amount
    return totals

```

Renames:

- `f` → `total_amount_by_category`
- `xs` → `pairs`, `m` → `totals`, `t` → tuple destructured as `category, amount`, `k`/`v` → named fields

---

# PHP example

**Before (unclear):**

```php
function h($arr) {
  $o = [];
  foreach ($arr as $x) {
    if (!isset($o[$x['id']])) $o[$x['id']] = 0;
    $o[$x['id']] += 1;
  }
  return $o;
}

```

**After (clear):**

```php
function countById(array $records): array {
  $countsById = [];
  foreach ($records as $record) {
    $id = $record['id'];
    if (!isset($countsById[$id])) {
      $countsById[$id] = 0;
    }
    $countsById[$id] += 1;
  }
  return $countsById;
}

```

Renames:

- `h` → `countById`
- `$arr` → `$records`, `$o` → `$countsById`, `$x` → `$record`

---

# Tiny “diff-style” example (JS) — same logic, clearer names

**Before:**

```jsx
function p(d) {
  let t = 0;
  for (let i = 0; i < d.length; i++) t += d[i];
  return t / d.length;
}

```

**After:**

```jsx
function average(numbers) {
  let total = 0;
  for (let index = 0; index < numbers.length; index++) {
    total += numbers[index];
  }
  return total / numbers.length;
}

```

## Reflections

### What makes a good variable or function name?

- The variable or function name should describe its purpose so that others can understand what data it contains or what operation it performs.
- The names should use the terminology of the problem domain instead of using generic letters or abbreviations such as `students`, `averageScore`, or `calculateTax`.
- Functions should use **verbs** (e.g., `calculateTotal`, `fetchUserData`) since they execute actions whereas variables should use **nouns** (e.g., `totalAmount`, `userName`).
- The project becomes easier to read when developers maintain a consistent naming style (camelCase, snake_case, etc.).
- The use of noise words such as `data`, `info`, or `tmp` should be avoided in names unless there is a compelling reason to include them.

---

### What problems can occur because of poorly named variables?

- Other developers will misinterpret what a variable holds or what a function does because of confusion.
- The readers must spend additional time to understand the code instead of following the logic.
- The use of ambiguous names such as `temp` or `x` increases the chances of errors during debugging and refactoring processes.
- The lack of clarity in variable purpose leads developers to unintentionally duplicate existing code.
- The process of onboarding new team members becomes more difficult because the code names do not clearly express their purpose.

---

### How did refactoring improve code readability?

- The code becomes self-explanatory without additional comments because unclear identifiers were renamed to `collectAdultNames`, `users`, and `age`.
- The introduction of domain-specific terms (`score`, `category`, `records`) made the logic more understandable.
- The replacement of single-letter variables with meaningful names decreases the mental work required to understand what each variable represents.
- The refactored code enables someone new to the codebase to understand the function's purpose directly which simplifies maintenance, testing, and extension work.