# Contributing to ObjectQL

Thank you for your interest in contributing to ObjectQL! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contribution Types](#contribution-types)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- **Node.js** 18+ LTS
- **pnpm** 8.0+
- **Git** 2.0+
- A code editor (we recommend VSCode with the ObjectQL extension)

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/objectstack-ai/objectql.git
cd objectql

# Install pnpm if you haven't already
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
objectql/
├── packages/
│   ├── foundation/        # Core packages
│   │   ├── types/        # Type definitions (zero dependencies)
│   │   ├── core/         # Core engine
│   │   └── platform-node/ # Node.js utilities
│   ├── drivers/          # Database drivers
│   │   ├── sql/
│   │   ├── mongo/
│   │   ├── memory/
│   │   └── ...
│   ├── runtime/          # Runtime packages
│   │   └── server/       # HTTP server
│   └── tools/            # Developer tools
│       ├── cli/
│       ├── create/
│       └── vscode-objectql/
├── docs/                 # Documentation
├── examples/             # Example applications
└── scripts/              # Build and utility scripts
```

---

## Development Workflow

### 1. Pick an Issue

- Browse [open issues](https://github.com/objectstack-ai/objectql/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it

### 2. Create a Branch

```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### 3. Make Changes

- Write clean, readable code
- Follow the [coding standards](#coding-standards)
- Add tests for your changes
- Update documentation if needed

### 4. Test Your Changes

```bash
# Run tests for a specific package
cd packages/foundation/core
pnpm test

# Run tests for all packages
pnpm -r test

# Run linter
pnpm lint

# Build to check for TypeScript errors
pnpm build
```

### 5. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```bash
# Format: <type>(<scope>): <description>

git commit -m "feat(core): add support for virtual columns"
git commit -m "fix(driver-sql): resolve connection pool leak"
git commit -m "docs: update getting started guide"
```

**Commit Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

---

## Contribution Types

### 🐛 Bug Fixes

1. Find or create an issue describing the bug
2. Include steps to reproduce
3. Write a failing test that reproduces the bug
4. Fix the bug
5. Ensure the test now passes
6. Submit a pull request

### ✨ New Features

1. Open an issue to discuss the feature first (for large changes)
2. Get approval from maintainers
3. Implement the feature
4. Add comprehensive tests
5. Update documentation
6. Submit a pull request

### 📝 Documentation

- Fix typos or clarify existing docs
- Add examples and tutorials
- Translate documentation to other languages
- Improve API reference docs

### 🔌 New Drivers

See the [Driver Extensibility Guide](./docs/guide/drivers/extensibility.md) for detailed instructions.

Quick steps:
1. Create a new package in `packages/drivers/`
2. Implement the `Driver` interface from `@objectql/types`
3. Add comprehensive tests (aim for 90%+ coverage)
4. Write documentation
5. Add examples
6. Submit a pull request

---

## Pull Request Process

### PR Checklist

Before submitting, ensure:

- [ ] Code follows coding standards
- [ ] Tests are added/updated and passing
- [ ] Documentation is updated
- [ ] Commit messages follow Conventional Commits
- [ ] No breaking changes (or clearly documented)
- [ ] PR description explains the changes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Fixes #123

## Testing
Describe how you tested your changes

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Automated checks will run (tests, linting)
2. Maintainers will review your code
3. Address any feedback
4. Once approved, a maintainer will merge

---

## Coding Standards

### TypeScript Style

```typescript
// ✅ DO: Use strict types
interface UserData {
  name: string;
  age: number;
}

// ❌ DON'T: Use 'any'
const data: any = { name: "John" };

// ✅ DO: Use readonly for immutable data
interface Config {
  readonly apiUrl: string;
}

// ✅ DO: Use generics for reusable code
function identity<T>(value: T): T {
  return value;
}
```

### Naming Conventions

- **Interfaces:** PascalCase, prefix with `I` for interfaces (e.g., `IDriver`)
- **Classes:** PascalCase (e.g., `SqlDriver`)
- **Functions:** camelCase (e.g., `createContext`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `DEFAULT_PORT`)
- **Files:** kebab-case (e.g., `formula-engine.ts`)

### Error Handling

```typescript
// ✅ DO: Use ObjectQLError
import { ObjectQLError } from '@objectql/types';

throw new ObjectQLError({
  code: 'VALIDATION_FAILED',
  message: 'Field "name" is required',
  details: { field: 'name' }
});

// ❌ DON'T: Use generic Error
throw new Error('Something went wrong');
```

### Comments

```typescript
// ✅ DO: Add JSDoc for public APIs
/**
 * Creates a new ObjectQL context
 * @param options - Configuration options
 * @returns A new context instance
 */
export function createContext(options: ContextOptions): Context {
  // ...
}

// ✅ DO: Explain complex logic
// Calculate the hash using SHA-256 to ensure uniqueness
const hash = crypto.createHash('sha256').update(data).digest('hex');

// ❌ DON'T: State the obvious
// Increment i by 1
i++;
```

---

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('SqlDriver', () => {
  let driver: SqlDriver;

  beforeEach(() => {
    driver = new SqlDriver(config);
  });

  describe('find', () => {
    it('should return records matching the filter', async () => {
      const result = await driver.find('users', {
        filters: [['status', '=', 'active']]
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].status).toBe('active');
    });

    it('should return empty array when no records match', async () => {
      const result = await driver.find('users', {
        filters: [['id', '=', 'non-existent']]
      });

      expect(result).toEqual([]);
    });
  });
});
```

### Test Coverage

- Aim for **85%+** code coverage
- Test happy paths and edge cases
- Test error conditions
- Use mocks sparingly (prefer real implementations)

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/foundation/core
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

---

## Documentation

### Where to Add Documentation

- **API Reference:** JSDoc comments in TypeScript code
- **User Guides:** `docs/guide/`
- **Tutorials:** `docs/tutorials/`
- **Specifications:** `docs/spec/`
- **Examples:** `docs/examples/` or `examples/`

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Link to related documentation
- Keep it up to date with code changes

### Example Documentation

````markdown
# Feature Name

Brief description of the feature.

## Basic Usage

```typescript
import { feature } from '@objectql/core';

const result = feature({
  option1: 'value1',
  option2: 'value2'
});
```

## Advanced Usage

More complex examples...

## API Reference

### `feature(options)`

Description of the function.

**Parameters:**
- `options` (Object) - Configuration options
  - `option1` (string) - Description
  - `option2` (string) - Description

**Returns:** `Result` - Description of return value

## See Also

- [Related Feature](./related-feature.md)
- [API Reference](/api/)
````

---

## Questions?

- **GitHub Discussions:** Ask questions and discuss ideas
- **Discord:** Join our community for real-time help
- **Issues:** Report bugs or request features

**Thank you for contributing to ObjectQL! 🎉**
