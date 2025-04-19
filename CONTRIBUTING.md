# Contributing Guide

Thank you for contributing to this project! Please follow these steps to ensure a smooth development workflow:

## Setup

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Ensure you have the correct Node.js version (20.x).

## Code Quality

- **Linting**: Before committing, run:

  ```bash
  yarn lint
  ```

  This fixes auto-fixable issues and reports any remaining errors.
- **Type Checking**: Run:

  ```bash
  yarn typecheck
  ```

  to ensure no TypeScript errors.
- **Tests**: Execute all tests:

  ```bash
  yarn test
  ```

## Pre-commit Hooks

This project uses `lint-staged`. To run lint-staged on your staged files:

```bash
npx lint-staged
```

## Commit Guidelines

- Write clear, concise commit messages.
- Ensure all tests pass and linting is clean before pushing.
- Create PRs against the `main` branch and request reviews.

Thank you for helping improve this project!