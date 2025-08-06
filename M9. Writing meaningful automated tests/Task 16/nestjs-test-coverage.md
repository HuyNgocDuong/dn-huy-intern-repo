# Understanding the Focus Bear Coverage Bar & Writing Meaningful Tests

# ✅ Tasks

### Understand how Jest produces test coverage reports within NestJS applications

The Istanbul tool runs internally within Jest to track code execution which produces test coverage reports. NestJS users can enable coverage reporting through the following command:

This command generates a `coverage/` directory which contains HTML and LCOV files together with text summary reports.

---

### The test suite execution allows users to view the resulting test coverage report

The following command enables test execution and displays a coverage report:

```bash
npm run test -- --coverage

```

The visual breakdown appears when you open `coverage/lcov-report/index.html` in any browser.

---

### The system reveals untested code areas where developers should create new tests for better coverage

The system displays untested code segments through red or yellow markings. Your testing effort should prioritize developing tests for unused `if/else` logic and boundary cases that fail to run during typical testing scenarios.

---

### Research the meaning of "meaningful test assertions" and why high test coverage results do not necessarily indicate correct testing

Test coverage metrics indicate code execution without proving that the code executed correctly. Weak tests run through code while making no assertions or using poor assertions that verify only method execution but fail to verify output accuracy.

---

### You need to enhance a weak test to include proper assertions in its code

**Weak test example:**

```
it('should call the service method', () => {
  controller.getSomething();
  expect(service.getSomething).toHaveBeenCalled();
});

```

**Refactored with stronger assertion:**

```
it('should return the expected result', () => {
  jest.spyOn(service, 'getSomething').mockReturnValue('expected');
  const result = controller.getSomething();
  expect(result).toBe('expected');
});

```

---

# ✅ Reflection (nestjs-test-coverage.md)

### What components of the coverage bar do teams track and why?

The coverage bar measures the percentage of codebase execution that tests run by monitoring statements, branches, functions, and lines. The metric helps teams avoid untested logic because it provides fundamental information about tested code.

---

### What purpose does Focus Bear serve by implementing a mandatory test coverage requirement?

The mandatory test coverage threshold prevents developers from shipping core functionality when tests do not exist. The practice supports developers in writing tests consistently while minimizing bugs that occur from untested code modifications.

---

### Why does high test coverage not guarantee all functionality is tested?

Coverage tools detect which lines get executed during tests, but they do not verify the logical correctness of that execution. A test execution can run a method without verifying any important assertions, producing a misleading impression about system security.

---

### Examples of weak vs. strong test assertions

- **Weak assertion:** Only checks that a method was called.
    
    ```
    expect(service.doSomething).toHaveBeenCalled();
    
    ```
    
- **Strong assertion:** Verifies the method's behavior and output.
    
    ```
    expect(service.doSomething()).toEqual(expectedValue);
    
    ```
    

---

### How can you balance increasing coverage with writing effective tests?

Your tests should prove business logic operations while verifying edge conditions and meaningful assertions, rather than just proving code execution. Avoid writing basic tests for the sole reason of improving numerical metrics.