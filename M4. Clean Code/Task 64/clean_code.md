# Writing Small, Focused Functions

## **Find an example of a long, complex function in an existing codebase**

## 📝 Example – Before (long & complex)

```jsx
function processOrders(orders) {
  let total = 0;
  let discounts = 0;
  let shipping = 0;
  let report = [];

  // Calculate totals
  for (let i = 0; i < orders.length; i++) {
    let order = orders[i];
    let subtotal = 0;

    for (let j = 0; j < order.items.length; j++) {
      subtotal += order.items[j].price * order.items[j].quantity;
    }

    // Apply discount
    if (subtotal > 100) {
      subtotal *= 0.9;
      discounts += 1;
    }

    // Shipping
    if (order.expedited) {
      shipping += 25;
    } else {
      shipping += 10;
    }

    total += subtotal;
    report.push({ id: order.id, subtotal: subtotal });
  }

  return {
    total,
    discountsApplied: discounts,
    shippingCost: shipping,
    report,
  };
}

```

### ❌ Problems:

- One big function doing *everything*: calculation, discounting, shipping, reporting.
- Hard to test or change one part (e.g., discount rules).
- Lots of nested loops.

---

## ✅ After Refactor (clear responsibilities)

```jsx
function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function applyDiscount(subtotal) {
  return subtotal > 100 ? subtotal * 0.9 : subtotal;
}

function calculateShipping(isExpedited) {
  return isExpedited ? 25 : 10;
}

function processOrders(orders) {
  let total = 0;
  let discountsApplied = 0;
  let shippingCost = 0;
  let report = [];

  for (const order of orders) {
    let subtotal = calculateSubtotal(order.items);

    let discountedSubtotal = applyDiscount(subtotal);
    if (discountedSubtotal < subtotal) {
      discountsApplied += 1;
    }

    let shipping = calculateShipping(order.expedited);

    total += discountedSubtotal;
    shippingCost += shipping;
    report.push({ id: order.id, subtotal: discountedSubtotal });
  }

  return {
    total,
    discountsApplied,
    shippingCost,
    report,
  };
}

```

---

## 🔑 Benefits of the Refactor

- **Single Responsibility:** Each helper function does one thing (subtotal, discount, shipping).
- **Reusability:** If discount rules change, only `applyDiscount` needs updating.
- **Readability:** `processOrders` now reads like a high-level description.
- **Testability:** You can unit-test `calculateSubtotal`, `applyDiscount`, and `calculateShipping` independently.

## Reflections

### Why is breaking down functions beneficial?

- The code becomes simpler to understand and maintain because each function handles only one specific task.
- The smaller functions become reusable throughout the project without needing to duplicate any logic.
- Testing small focused functions becomes simpler because it allows developers to detect hidden bugs before they spread.
- Code that uses descriptive names for its steps (`calculateSubtotal`, `applyDiscount`, `calculateShipping`) enables both present and future developers to understand it more easily.
- The modification of one logical section (e.g., discount rules) will not damage other sections of the function.

---

### The code structure received what improvements from the refactoring process?

- The original `processOrders` function contained extensive code which performed multiple functions including total calculations and discount applications and shipping operations and reporting tasks.
- The responsibilities were divided into smaller functions which received descriptive names during the refactoring process.
- The `processOrders` function now operates at a high level while the helper functions `calculateSubtotal`, `applyDiscount` and `calculateShipping` handle specific details.
- The codebase becomes more extendable because new shipping rules can be added by modifying the `calculateShipping` function.
- The refactored code structure has become more modular and organized while becoming easier to test which enhances long-term maintenance capabilities.