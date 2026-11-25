---
name: unit-testing
description: >
  Create, update, and maintain unit tests. Use this skill when you need to write new unit tests, update existing tests to match changing requirements, or refactor test suites for better maintainability.
---

# Language Agnostic Unit Testing Skill

## Test Method Naming

* Name each test according to a user-specific use case
* Use the pattern `<state of the system>_<act>_<expected outcome>`
* Example: `emptyList_addItem_itemIsAdded`
* In this repo, test method names are the **exception** to the Dice Namer constraint - they keep descriptive names

## Test Structure

* Follow the Arrange-Act-Assert (AAA) pattern: set up state, invoke the behaviour, verify the outcome
* Keep each phase clearly separated, e.g. by a blank line

## Verification

* Each test verifies one aspect with a relevant assertion
* Do not use `expectTrue(true)`.
* Do not rely on printing to console.
* Do not rely on exceptions being thrown.
* Prefer explicit checks that directly test for expected condition over indirect checks
* Focus assertions: only test what's necessary. Type checking may be sufficient when value is covered elsewhere.
* Use project's helper methods (e.g., `expect_log_to_be`) instead of raw assertions
* **NEVER** write intentionally incorrect assertions; tests must reflect actual expected behaviour
* Maintain consistency in test assertions across all tests

## Testing Scenarios

* Test only through public APIs.
* Add accessor methods for tests if necessary. Do not use reflection or magic methods.
* Unit tests should be isolated - don't chain dependencies in tests
* Write minimal tests that verify behaviour, not implementation details
* Do not test every individual special character separately when multi-character tests suffice
* Prefer testing through dependency-injected functions (e.g., `log_with_deps`) over convenience wrappers (e.g., `log`) when dependency injection enables better isolation

## Mocking Dependencies

* Use dependency injection pattern with function pointers for mockable dependencies
* Create mock implementations with hardcoded, predictable return values (example in Zig):
  ```zig
  fn mock_get_time() LocalWindowsTime {
      return .{ .wYear = 2024, .wMonth = 1, .wDay = 15, ... };
  }
  ```
* Pass mock functions as parameters to the function under test

## Helper Functions

* Create test-specific helper functions for common operations:
  - File path construction (`get_log_path`)
  - File I/O operations (`read_log_file`, `delete_log_file`)
  - Custom assertions (`expect_log_to_be`)
* Prefer project helper methods over raw testing framework assertions

## Error Situations

* Prefer tests that fail at assertions rather than throwing exceptions
* Error conditions should throw appropriate exceptions rather than silently returning incomplete data
* Use domain-specific exception types for better error semantics and easier error handling
