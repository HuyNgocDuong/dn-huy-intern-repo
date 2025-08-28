# Commenting & Documentation

## **Find an example of poorly commented code and rewrite the comments to be more useful.**

# Before — poor comments (state the obvious)

```python
# average function
def avg(nums):
    # set total
    total = 0
    # loop over nums
    for n in nums:
        total += n
    # divide by count
    return total / len(nums)

```

# After — useful, focused comments

```python
def mean(nums):
    """
    Compute the arithmetic mean of a non-empty list of numbers.

    Args:
        nums (list[float|int]): Must contain at least one numeric value.

    Returns:
        float: The average value.

    Raises:
        ValueError: If nums is empty.

    Example:
        mean([1, 2, 3]) -> 2.0
    """
    if not nums:
        raise ValueError("nums must be a non-empty list")

    return float(sum(nums)) / len(nums)

```

## Why these comments are better

- **Explain purpose and contract** (what it does, required input, output).
- **Document failures** (what exception is raised and when).
- **Give an example** so usage is obvious without reading the code.
- **Avoid narrating each line** (the code already shows *how*; comments explain *why/what to expect*).

## Reflections

# When to add comments

- Explain “why,” not “what.” Rationale, intent, trade-offs, historical context.
- Non-obvious business rules or domain quirks. E.g., “IDs must skip 000 due to legacy system.”
- Invariants and contracts. Pre/post-conditions, performance guarantees, big-O notes.
- Workarounds and external constraints. Library bugs, API quirks, hardware limits; include links/tickets.
- Algorithm overview. High-level sketch for complex logic; cite sources (paper/recipe).
- Boundary behaviors and edge cases. Why a special case exists and what breaks without it.
- Security implications. Threat model notes, validation assumptions, sanitization rationale.
- Public APIs. Clear docstrings: inputs, outputs, errors, examples.

# When to avoid comments (improve the code instead)

- Comment explains what the code does. → Use better names.
    - `// sum of prices → totalPrice`
- Comment explains a long block. → Extract a function with a descriptive name.
    - `// apply loyalty discount → applyLoyaltyDiscount(order)`
- Comment justifies nested conditionals. → Use guard clauses / early returns.
- Comment decodes a boolean expression. → Introduce well-named intermediate variables or a predicate function.
- Comment labels magic numbers/strings. → Replace with named constants/enums.
- Comment warns about side effects. → Make side effects explicit (pure functions, clearer API).
- Comment describes duplicated logic. → Deduplicate (utility/helper), then the comment isn’t needed.
- “TODO/FIXME” without context. → Add a ticket/ref + deadline, or do the change now.

# 30-second decision rule

- If the reader could understand by renaming, extracting, or simplifying, change the code.
- If the reader still needs context, intent, or constraints after clean code, add a comment.