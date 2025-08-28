# Writing Unit Tests for Clean Code

## **Choose a testing framework (e.g., Jest for JavaScript, PyTest for Python) and write a few unit tests for a function in your test repo.**

# 1) Install & wire up Jest

```bash
npm i -D jest

```

Add a test script to your `package.json`:

```json
{
  "scripts": {
    "test": "jest"
  }
}

```

# 2) Function under test

```jsx
// src/utils/percentage.js (CommonJS)
function percentage(part, whole, precision = 2) {
  // Accept numbers or numeric strings only
  if ((typeof part !== 'number' && typeof part !== 'string') ||
      (typeof whole !== 'number' && typeof whole !== 'string')) {
    throw new TypeError('part and whole must be numeric');
  }
  const p = Number(part);
  const w = Number(whole);

  if (!Number.isFinite(p) || !Number.isFinite(w)) {
    throw new TypeError('part and whole must be finite numbers');
  }
  if (w === 0) {
    throw new RangeError('whole must not be zero');
  }
  if (!Number.isInteger(precision) || precision < 0 || precision > 6) {
    throw new RangeError('precision must be an integer between 0 and 6');
  }

  const value = (p / w) * 100;
  return Number(value.toFixed(precision));
}

module.exports = { percentage };

```

# 3) Unit tests (Jest)

Create `__tests__/percentage.test.js`:

```jsx
// __tests__/percentage.test.js
const { percentage } = require('../src/utils/percentage');

describe('percentage()', () => {
  test('computes part/whole * 100 with default precision (2 dp)', () => {
    expect(percentage(25, 200)).toBe(12.5);        // 12.50 becomes 12.5 as a Number
    expect(percentage(1, 8)).toBe(12.5);           // 12.50 -> 12.5
  });

  test('accepts numeric strings', () => {
    expect(percentage('50', '400')).toBe(12.5);
  });

  test('respects custom precision', () => {
    expect(percentage(1, 3, 4)).toBe(33.3333);
    expect(percentage(1, 3, 0)).toBe(33);
  });

  test('throws on division by zero', () => {
    expect(() => percentage(5, 0)).toThrow(/must not be zero/i);
  });

  test('throws on non-numeric input', () => {
    expect(() => percentage('ten', 100)).toThrow(/numeric/i);
    expect(() => percentage(10, null)).toThrow(/numeric|finite/i);
  });

  test('validates precision bounds', () => {
    expect(() => percentage(1, 2, -1)).toThrow(/precision/i);
    expect(() => percentage(1, 2, 7)).toThrow(/precision/i);
    expect(() => percentage(1, 2, 2.5)).toThrow(/precision/i);
  });
});

```

# 4) Run

```bash
npm test

```

## Reflections

### Unit tests function as a tool to maintain code cleanliness.

- Tests require you to specify inputs and outputs and error conditions which results in better function signatures and documentation.
- The process of testing complex code leads developers to split it into smaller independent functions with minimal side effects.
- A green test suite enables developers to perform aggressive refactoring because it protects against behavior-breaking changes.
- The inability to test code or its lack of usage makes you detect these problems so you can eliminate them or reduce duplication.
- Writing assertions helps developers create functions with descriptive names and explicit logic.
- The testing process requires developers to handle boundary conditions (empty, null, zero, non-finite) during the initial development stage.

### What problems did you encounter while testing? (based on the percentage(part, whole, precision) example)

- The program failed to validate input data because it accepted both "ten" and null values as inputs which required the addition of a TypeError.
- The function returned INF/NaN values until we added a RangeError check for whole === 0.
- The system failed to detect NaN/Infinity values until we implemented Number.isFinite for validation.
- The system accepted any value including negative numbers and values greater than 6 and non-integer values until we added both bounds and integer validation.
- The toFixed function returns strings which requires our code to convert them back to Number values.
- The assertion stability depends on the use of toBeCloseTo instead of exact equality when dealing with repeating decimals.