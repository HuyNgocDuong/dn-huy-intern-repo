# Understanding Clean Code Principles

### 1) Simplicity — Keep it as simple as possible

- **What it means:** Solve the problem directly with the fewest moving parts.
- **Why it matters:** Simple code allows for better reasoning, testing, and debugging processes. Complexity multiplies failure modes.
- **How to apply:**
    - Prefer straightforward control flow over clever one-liners.
    - YAGNI: Don’t build features or abstractions until they’re truly needed.
    - Extract small functions instead of stacking nested conditionals.
    - Choose the simplest data structure which meets your needs.
- **Quick smell tests:**
    - Can you explain the function in one or two sentences?
    - Would the removal of abstraction layers cause any conceptual breakdown?

---

### 2) Readability — Make it easy to understand

- **What it means:** Optimize for the reader’s brain, not the author’s momentary speed.
- **How to apply:**
    - Use descriptive names (domain language beats abbreviations).
    - Each function should remain compact with its own distinct responsibility.
    - Write docstrings/comments for *why*, not *what*.
    - Use consistent formatting, whitespace, and line length.
    - Show, don’t hide, units and invariants (e.g., milliseconds, 0..1 percentages).
- **Smell tests:**
    - Can a teammate guess a function’s purpose without opening its body?
    - Are magic numbers replaced with named constants?

---

### 3) Maintainability — Optimize for future change

- **What it means:** Future you (or teammates) can modify behavior without fear.
- **How to apply:**
    - Distinguish between side effects (I/O, DB, network) and pure logic.
    - Add public behavior tests to select stable interfaces instead of other options.
    - Reduce coupling; depend on interfaces, not implementations.
    - Make errors explicit and handle them close to the source.
- **Smell tests:**
    - Can you swap an implementation (e.g., a file for a DB) with minimal edits?
    - Does a small feature need edits distributed across multiple files?

---

### 4) Consistency — Follow style guides and conventions

- **What it means:** Similar problems are solved in similar ways across the codebase.
- **How to apply:**
    - Adopt a linter/formatter (e.g., PEP 8/Black, EditorConfig) and stick to it.
    - Keep naming patterns consistent (`getX`, `loadX`, `saveX`).
    - Ensure new files maintain consistency between their tests, documentation, and code structure.
- **Smell tests:**
    - Do files look like they belong to the same project?
    - Can a newcomer predict where to find things?

---

### 5) Efficiency — Be performant, but avoid premature optimization

- **What it means:** Meet performance goals with clear, maintainable code.
- **How to apply:**
    - Measure first; optimize the hot path only.
    - Choose data structures and algorithms that fit the expected input size.
    - Cache/memoize where it simplifies and accelerates repeated work.
    - Watch I/O bounds and network round trips.
- **Smell tests:**
    - Are there micro-optimizations that obscure intent?
    - Do benchmarks or profiles justify the complexity?

---

### Pocket Checklist

- Names are precise and from the domain.
- Functions are small, single-purpose, and testable.
- Side effects are isolated from pure logic.
- No magic numbers; constants are named.
- Consistent formatting and structure.
- Performance considerations are measured, not guessed.

---

# Example: Messy vs. Clean Code (Python)

### The Messy Version

```python
# order processing (messy)
def p(o):
    t = 0
    for i in range(len(o)):
x = o[i]
        if x['type'] == 'A':
            t += x['q'] * 10
        elif x['type'] == 'B':
            t += x['q'] * 7.5
else:
            t += x['q'] * 5
        if 'd' in x:  # discount, but applied to running total (!)not the line
            t = t - (t * x['d'])
    print('TOTAL:', t)
    if t > 1000:
        print('BIG')
    with open('log.txt', 'a') as f:
        f.write(str(o) + ' ' + str(t) + '\n')

```

### Why it’s hard to read/maintain

- Bad names: `p`, `o`, `t`, `q`, `d` hide intent.
- Magic numbers: `10`, `7.5`, `5`, `1000` lack meaning.
- Multiple responsibilities: file I/O mixed with printing and calculations.
- Buggy discount logic: applies to the running total instead of per line.
- No types or validation: shape of input data is implicit; errors fail late.
- No tests or seams: side effects make logic hard to test.

---

### The Clean Rewrite

```python
from dataclasses import dataclass
from enum import Enum
from typing import Iterable

class ItemType(Enum):
    A = 'A'
    B = 'B'
    OTHER = 'OTHER'

@dataclass(frozen=True)
class LineItem:
    kind: ItemType
quantity: int
    discount: float = 0.0  # 0..1 fraction per line

UNIT_PRICE = {
    ItemType.A: 10.0,
    ItemType.B: 7.5,
    ItemType.OTHER: 5.0,
}

BIG_ORDER_THRESHOLD = 1000.0

# ——— Pure calculation ———

def line_total(item: LineItem) -> float:
    """Compute a line’s total after per-line discount."""
    base = UNIT_PRICE[item.kind] * item.quantity
    return base * (1.0 - item.discount)

def order_total(items: Iterable[LineItem]) -> float:
    return sum(line_total(i) for i in items)

def is_big_order(total: float) -> bool:
    return total > BIG_ORDER_THRESHOLD

# ——— I/O separated from logic ———

def format_receipt(total: float, big: bool) -> str:
    header = f"TOTAL: {total:.2f}"
    flag = " (BIG ORDER)" if big else ""
    return header + flag

def log_order(items: Iterable[LineItem], total: float, path: str = "log.txt") -> None:
    with open(path, 'a') as f:
        f.write(f"{list(items)} {total:.2f}\n")

if __name__ == "__main__":
    items = [
        LineItem(ItemType.A, 2, 0.10),  # 10% off
        LineItem(ItemType.OTHER, 5),
    ]
    total = order_total(items)
    print(format_receipt(total, is_big_order(total)))
log_order(items, total)

```

---

### What improved

- **Clear names:** classes and variables show intent (`LineItem`, `ItemType`).
- **Single responsibility:** pure functions for math; I/O is isolated.
- **Fewer bugs:** discount applied per line, not to the running total.
- **Extensibility:** add new `ItemType` or pricing rules in one place.
- **Testability:** `order_total` and `line_total` are deterministic and easy to test.
- **Consistency:** formatting, naming, and structure follow a pattern.

---

### Tips for Your Own Refactors

- Start with a minimal test that protects existing behavior.
- Extract pure functions from mixed logic; pass data in, get results out.
- Introduce types/DTOs (or data classes) to make shapes explicit.
- Name constants; delete magic numbers.
- Remove duplication; keep functions under ~20–30 lines.
- Measure before optimizing; keep changes incremental and reversible.