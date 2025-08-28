# Avoiding Code Duplication

## **Find a section of code in your test repo with unnecessary repetition.**

# Step 1 — Find duplicated code fast

Run a copy/paste detector and an ESLint rule that flags near-identical functions.

```bash
# From the repo root
npx jscpd --threshold 2 --min-lines 5 --reporters console .

# (Optional) add a duplication rule set
npm i -D eslint-plugin-sonarjs

```

In your `.eslintrc.json`:

```json
{
  "plugins": ["sonarjs"],
  "extends": ["eslint:recommended", "plugin:sonarjs/recommended"],
  "rules": {
    "sonarjs/no-duplicate-string": "warn",
    "sonarjs/no-identical-functions": "warn"
  }
}

```

Then:

```bash
npm run lint

```

This will point you to places with repeated blocks (e.g., in `cart.js` and `checkout.js` or `orders.js`) such as formatting totals or consistent try/catch wrappers.

---

# Step 2 — Apply a focused refactor (example)

## Before (duplication in two files)

`src/pages/cart.js`

```jsx
function formatCurrency(amount) {
  const n = Number(amount || 0);
  return '$' + n.toFixed(2);
}

export function renderCartTotal(total) {
  const txt = formatCurrency(total);
  document.querySelector('#cart-total').textContent = txt;
}

```

`src/pages/checkout.js`

```jsx
function formatCurrency(amount) {
  const n = Number(amount || 0);
  return '$' + n.toFixed(2);
}

export function showOrderSummary(total) {
  document.querySelector('#order-total').textContent = formatCurrency(total);
}

```

### Problems

- `formatCurrency` is duplicated (and will drift over time).
- Tests need to cover two copies instead of one.

## After (single source of truth)

Create `src/utils/format.ts` (or `.js` if you’re not using TS):

```tsx
// src/utils/format.ts
export function formatCurrency(amount: number | string, currency = 'USD', locale = 'en-AU') {
  const n = Number(amount ?? 0);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
}

```

Update usages:

`src/pages/cart.js`

```jsx
import { formatCurrency } from '../utils/format';

export function renderCartTotal(total) {
  document.querySelector('#cart-total').textContent = formatCurrency(total, 'AUD', 'en-AU');
}

```

`src/pages/checkout.js`

```jsx
import { formatCurrency } from '../utils/format';

export function showOrderSummary(total) {
  document.querySelector('#order-total').textContent = formatCurrency(total, 'AUD', 'en-AU');
}

```

### Why this refactor is solid

- **DRY**: one implementation, many consumers.
- **More correct**: uses `Intl.NumberFormat` for locale/currency (no manual `'$' + n.toFixed(2)`).
- **Testable**: unit test only `formatCurrency`.
- **Flexible**: currency/locale overridable per page.

---

# Bonus: deduplicate repeated error handling

If you see repeated try/catch blocks that convert errors → user messages, extract a helper:

## Before

```jsx
// cart.js
try {
  await api.addToCart(id);
} catch (e) {
  console.error(e);
  toast('Something went wrong. Try again.');
}

// checkout.js
try {
  await api.placeOrder(payload);
} catch (e) {
  console.error(e);
  toast('Something went wrong. Try again.');
}

```

## After

```jsx
// src/utils/safeCall.js
export async function safeCall(fn, onError) {
  try { return await fn(); }
  catch (e) { console.error(e); onError?.(e); return null; }
}

// usage
import { safeCall } from '../utils/safeCall';

await safeCall(() => api.addToCart(id), () => toast('Could not add to cart.'));
await safeCall(() => api.placeOrder(payload), () => toast('Could not place order.'));

```

---

# Commit message you can use

```
refactor: deduplicate currency formatting and error handling

- Extract formatCurrency into src/utils/format.ts using Intl.NumberFormat
- Replace duplicated helpers in cart.js and checkout.js
- Add safeCall utility to unify try/catch + user messaging
- Enable sonarjs rules to prevent future identical functions

```

# Reflections

1. What were the issues with duplicated code?
- The two formatCurrency copies tend to drift apart from each other (different symbols, rounding, or fallback logic) which results in inconsistent UI.
- The process of fixing defects in one copy of the code does not automatically propagate to the other copy which results in engineers needing to remember every location.
- The process of maintaining tests for duplicate logic requires additional work which slows down CI and reduces focus.
- Small policy changes that affect currency or locale require modifications across multiple files thus increasing the chance of errors.
- The knowledge base remains fragmented because there exists no central source of truth which makes it difficult for new contributors to identify the original version.
- The repetitive code blocks cause reviews to become longer while hiding important changes.
- The copied error handling code produces different user messages and logging quality between screens which results in inconsistent UX and logging.

1. How did the refactor improve maintainability?
- DRY (Don't Repeat Yourself) principle is achieved by extracting utilities (formatCurrency, safeCall) into single sources which allow changes to be made once and applied throughout the system.
- All totals now use the same Intl.NumberFormat path and all async errors follow the same messaging/logging pattern.
- The implementation of one well-covered unit test per utility eliminates the need for multiple near-identical tests which enhances testing quality.
- The change cost and risk decrease when requirements modifications affect only one function because it reduces the potential for regression problems.
- The separation of page logic from cross-cutting concerns in the /utils directory enhances both module cleanliness and readability.
- The use of clear imports helps reviewers understand the code's purpose and smaller diffs enable faster and safer reviews.
- The implementation of sonarjs/no-identical-functions rules enables early detection of future duplication occurrences.