# Contributing to ObjectQL

Thank you for your interest in contributing to ObjectQL! This document outlines the process and guidelines for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Contributor License Agreement](#contributor-license-agreement)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## 🤝 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Git
- Basic understanding of TypeScript

### Setting Up Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/objectql.git
cd objectql

# 2. Install pnpm if you haven't already
npm install -g pnpm

# 3. Install dependencies
pnpm install

# 4. Build all packages
pnpm run build

# 5. Run tests
pnpm run test
```

## 💻 Development Process

### Monorepo Structure

ObjectQL uses a monorepo managed by pnpm workspaces:

- `packages/foundation/types` - Core type definitions (no dependencies)
- `packages/foundation/core` - Main ObjectQL engine
- `packages/drivers/*` - Database driver implementations
- `packages/runtime/server` - HTTP server adapter
- `packages/tools/*` - CLI and Studio tools

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow existing code style
   - Add tests for new functionality

3. **Test your changes**
   ```bash
   pnpm run build
   pnpm run test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: description of your change"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

## 📜 Contributor License Agreement

By contributing to ObjectQL, you agree to the following:

### Copyright Assignment

1. **License Grant**: You grant ObjectQL Contributors a perpetual, worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your contributions under the AGPL-3.0 license or any future license chosen by the project maintainers.

2. **Dual Licensing Rights**: You acknowledge that ObjectQL is dual-licensed (AGPL-3.0 for open source, commercial license for proprietary use). Your contributions may be used under both licensing models.

3. **Original Work**: You certify that:
   - Your contribution is your original work
   - You have the right to grant the licenses described above
   - Your contribution does not violate any third-party rights
   - You have not included any proprietary or confidential information

4. **Patent Grant**: If your contribution includes any patents, you grant a license for those patents to be used in the ObjectQL project.

### Why This Matters

The dual licensing model allows ObjectQL to:
- Remain free and open source for the community
- Fund ongoing development through commercial licenses
- Prevent competitors from taking the code without contributing back

### Accepting the CLA

By submitting a pull request, you acknowledge that you have read and agree to this Contributor License Agreement. For significant contributions, maintainers may ask you to sign a more formal CLA.

## 🎨 Coding Standards

### TypeScript

- Use strict TypeScript mode
- No `any` types unless absolutely necessary
- Document public APIs with JSDoc comments
- Prefer interfaces over types for object shapes

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Maximum line length: 100 characters
- Follow existing patterns in the codebase

### File Organization

- One export per file for main classes
- Group related utilities in index files
- Use meaningful file and variable names
- Keep files under 300 lines when possible

## 🧪 Testing Guidelines

### Writing Tests

- Write unit tests for all new functionality
- Place tests in `__tests__` directories
- Name test files `*.test.ts`
- Aim for >80% code coverage

### Test Structure

```typescript
describe('FeatureName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = { ... };
      
      // Act
      const result = doSomething(input);
      
      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code builds without errors
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts

### PR Guidelines

1. **Title**: Use clear, descriptive titles
2. **Description**: Explain what and why, not just how
3. **Link Issues**: Reference related issues (e.g., "Fixes #123")
4. **Keep It Small**: Smaller PRs are easier to review
5. **Request Review**: Tag relevant maintainers

### Review Process

1. **Automated Checks**: CI/CD must pass
2. **Code Review**: At least one maintainer approval required
3. **Feedback**: Address review comments promptly
4. **Merge**: Maintainers will merge when ready

### After Merge

- Your contribution will be included in the next release
- You'll be added to the contributors list
- Thank you for making ObjectQL better! 🎉

## 🐛 Reporting Bugs

### Security Vulnerabilities

**DO NOT** file public issues for security vulnerabilities. Email security@objectql.org instead.

### Bug Reports

Include:
- ObjectQL version
- Node.js version
- Operating system
- Minimal reproduction steps
- Expected vs actual behavior
- Error messages and stack traces

## 💡 Feature Requests

Before requesting a feature:
1. Check existing issues and discussions
2. Ensure it aligns with ObjectQL's goals
3. Provide clear use cases and examples

## 📚 Documentation

Documentation is just as important as code! Contributions to:
- API documentation
- Guides and tutorials
- Example applications
- Code comments

...are all highly valued.

## 🌍 Community

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Join our community chat (coming soon)
- **Twitter**: Follow @ObjectQL for updates

## 📄 License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license with dual licensing rights as described above.

## ❓ Questions?

If you have questions about contributing, please:
- Open a GitHub Discussion
- Email contributors@objectql.org
- Check existing documentation

---

Thank you for contributing to ObjectQL! Every contribution, no matter how small, helps build a better tool for the entire community.
