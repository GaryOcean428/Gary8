# Code Quality Improvement Plan

## Overview

This document outlines our plan to address the code quality issues identified in the codebase. This is the next phase of development after successfully completing the API Modernization phase.

## Key Issues

1. **High Cognitive Complexity**
   - RetryHandler.ts: 45 vs allowed 15 
   - BenchSandbox.tsx: 17 vs allowed 15
   - CanvasSandbox.tsx: 17 vs allowed 15

2. **CSS and Styling Problems**
   - Inline styles in AnimationScene.tsx
   - Inconsistent CSS organization across components
   - Duplicate styling patterns across Canvas and Bench components

3. **TypeScript Type Issues**
   - Unused variables and imports
   - Not all code paths returning values in render functions
   - Implicit any types in function parameters

4. **Nested Ternaries**
   - Complex nested ternary operations in rendering logic
   - Hard-to-read conditional rendering chains

## Implementation Plan

### Phase 1: Component Architecture (Weeks 1-2) ✅

1. **Create shared base components** ✅
   - Extract common patterns from Canvas and Bench implementations
   - Create a unified Sandbox component that both Canvas and Bench can extend
   - Standardize props interfaces across similar components

2. **Refactor high-complexity components** ✅
   - Break down RetryHandler.execute into smaller functions
   - Extract rendering logic from BenchSandbox and CanvasSandbox
   - Create helper functions for complex operations

### Phase 2: CSS Architecture (Weeks 2-3)

1. **Standardize CSS organization** (In Progress)
   - Create a consistent file structure for CSS files
   - Extract common patterns to shared stylesheets
   - Create theme variables for consistent styling

2. **Remove inline styles** (Partially Complete)
   - Move all inline styles to external CSS files
   - Use CSS variables for dynamic values
   - Ensure responsive layouts maintain consistency

### Phase 3: Type Safety Improvements (Weeks 3-4)

1. **Enhance TypeScript support**
   - Add explicit return types to all functions
   - Create shared interfaces for common patterns
   - Fix "not all code paths return values" warnings

2. **Function refactoring** (Partially Complete)
   - Extract nested ternary operations to separate functions
   - Use early returns to simplify conditionals
   - Add descriptive comments for complex logic

## Success Criteria

1. All SonarQube warnings resolved or explicitly documented as exceptions
2. No TypeScript warnings or errors
3. Consistent component architecture across all UI modules
4. CSS organized in predictable file structure
5. Refactored code has test coverage maintained or improved

## Progress Tracking

- [x] **RetryHandler Refactoring**
   - [x] Add JSDoc documentation for lastSuccessTime
   - [x] Improve error handling with descriptive variable names
   - [x] Break down execute method into smaller functions
   - [x] Reduce cognitive complexity to acceptable levels

- [x] **Component Architecture**
   - [x] Remove React imports in favor of more specific imports
   - [x] Create Sandbox base component
   - [x] Extract render methods into smaller functions
   - [x] Standardize component interfaces

- [ ] **CSS Structure**
   - [x] Create external CSS files for AnimationScene
   - [x] Create external CSS files for CanvasSandbox
   - [ ] Establish theme variable system
   - [ ] Create shared stylesheets for common patterns

- [x] **Render Logic**
   - [x] Extract nested ternaries in BenchSandbox
   - [x] Extract nested ternaries in CanvasSandbox
   - [x] Create reusable rendering utilities
   - [x] Add explicit typing for render functions

## Completed Improvements

### RetryHandler Refactoring

- Cognitive complexity reduced through:
   - Breaking down the monolithic `execute()` method into specialized helper methods
   - Implementing proper circuit breaker pattern with enum states
   - Improving error classification with dedicated helper methods
   - Adding comprehensive error categorization functions
   - Enhancing network detection with more reliable checks

### Sandbox Component Architecture

- Implemented a shared `BaseSandbox` component containing all core functionality
- Created specialized wrapper components (`BenchSandbox` and `CanvasSandbox`) that configure the base component
- Extracted rendering logic into focused helper components:
   - `RenderEditor` component for the code editor
   - `RenderOutput` component for execution results
- Added improved props interfaces with comprehensive TypeScript typing
- Enhanced reusability through better component composition

### Next Steps

Focus for the next phase should be on:
1. Completing the CSS architecture standardization
2. Addressing remaining TypeScript type issues
3. Enhancing test coverage for the refactored components
