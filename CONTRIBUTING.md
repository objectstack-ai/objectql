# Contributing to ObjectQL

Thank you for your interest in contributing to ObjectQL! We're building the next generation of universal data protocols, and we welcome contributions from developers of all skill levels.

## 🌟 Why Contribute?

ObjectQL is:
- **Permanently open source** - Your contributions will always remain free and accessible
- **Vendor neutral** - No single company controls the project
- **Impact-driven** - Used by developers worldwide to build data-driven applications
- **Well-architected** - Clean, modern TypeScript codebase with strict typing
- **Community-focused** - We value every contribution and contributor

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (we use pnpm workspaces)
- Git

### Setting Up Your Development Environment

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/objectql.git
   cd objectql
   ```

2. **Install Dependencies**
   ```bash
   # Install pnpm if you haven't already
   npm install -g pnpm
   
   # Install project dependencies
   pnpm install
   ```

3. **Build All Packages**
   ```bash
   pnpm run build
   ```

4. **Run Tests**
   ```bash
   pnpm run test
   ```

## 📋 How to Contribute

### Ways to Contribute

We welcome many types of contributions:

#### 🐛 Bug Reports
- Search existing issues first to avoid duplicates
- Include minimal reproduction steps
- Provide system information (OS, Node version, package versions)
- Include error messages and stack traces

#### 💡 Feature Requests
- Check the roadmap and existing issues first
- Explain the use case and problem you're solving
- Describe proposed solution
- Consider backward compatibility

#### 📝 Documentation
- Fix typos or unclear explanations
- Add examples and tutorials
- Improve API documentation
- Translate documentation (if we support it in the future)

#### 🔧 Code Contributions
- Bug fixes
- New features (discuss first via an issue)
- Performance improvements
- Test coverage improvements
- Refactoring

#### 🎨 Design & UX
- Improve the Studio UI/UX
- Create visual assets
- Improve error messages
- Enhance developer experience

### Before You Start Coding

1. **Check existing issues** - Someone may already be working on it
2. **Create an issue** - For non-trivial changes, discuss the approach first
3. **Wait for feedback** - Maintainers will guide you on approach
4. **Fork and branch** - Create a feature branch from `main`

## 🏗️ Development Guidelines

### Code Style

- We use **TypeScript** with strict mode enabled
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Write self-documenting code with clear intent

### Architecture Rules (CRITICAL)

ObjectQL has strict architectural boundaries:

```
@objectql/types (base layer)
    ↓
@objectql/core (facade/orchestrator)
    ↓
@objectql/driver-* (implementations)
```

**Rules:**
- ✅ `types` depends on NOTHING (pure interfaces)
- ✅ `core` depends only on `types`
- ✅ `drivers` depend on `types` only (NOT on `core`)
- ❌ NO circular dependencies
- ❌ `types` and `core` MUST NOT import Node.js-specific modules (for browser compatibility)

### Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for >80% code coverage on new code
- Use meaningful test descriptions

```typescript
// Good
it('should validate email format and reject invalid emails', () => {
  // ...
});

// Less helpful
it('works', () => {
  // ...
});
```

### Commit Messages

We use conventional commits:

```
feat: add support for MongoDB transactions
fix: resolve memory leak in SQL driver
docs: update installation guide
test: add coverage for formula validation
refactor: simplify query parser logic
chore: update dependencies
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/add-transaction-support
   ```

2. **Make your changes**
   - Write clean, well-commented code
   - Add tests
   - Update documentation

3. **Ensure everything passes**
   ```bash
   pnpm run build
   pnpm run test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add transaction support to SQL driver"
   ```

5. **Push to your fork**
   ```bash
   git push origin feat/add-transaction-support
   ```

6. **Create Pull Request**
   - Use a clear, descriptive title
   - Reference related issues (`Fixes #123`, `Relates to #456`)
   - Describe what changed and why
   - Include testing instructions if applicable
   - Add screenshots for UI changes

### Pull Request Review

- Maintainers will review your PR within 1-2 weeks
- Address feedback constructively
- Be patient - reviews take time
- Update your PR based on feedback
- Once approved, a maintainer will merge

## 📦 Package-Specific Guidelines

### `@objectql/types`
- Pure TypeScript interfaces and enums only
- Zero dependencies
- Export everything through `index.ts`
- Add JSDoc comments for public APIs

### `@objectql/core`
- Coordinate drivers and registry
- No database-specific logic
- Comprehensive input validation
- Clear error messages

### `@objectql/driver-*`
- Implement `ObjectQLDriver` interface
- Database-specific optimizations are encouraged
- Handle edge cases gracefully
- Include integration tests

### `@objectql/server`
- RESTful API design
- Proper HTTP status codes
- Clear error responses
- Authentication and authorization hooks

### `@objectql/studio`
- Modern, responsive UI
- Accessibility (WCAG 2.1 AA)
- Mobile-friendly
- Fast and lightweight

## 🎯 Focus Areas

We're particularly interested in contributions in these areas:

### High Priority
- [ ] Bug fixes and stability improvements
- [ ] Test coverage improvements
- [ ] Documentation enhancements
- [ ] Performance optimizations
- [ ] Driver improvements (SQL, MongoDB)

### Medium Priority
- [ ] New drivers (Redis, Elasticsearch, etc.)
- [ ] Studio UI/UX improvements
- [ ] CLI enhancements
- [ ] Example applications
- [ ] Integration guides

### Future
- [ ] AI integration capabilities
- [ ] GraphQL adapter
- [ ] Real-time subscriptions
- [ ] Mobile SDKs

## ❓ Questions?

- **General questions**: [GitHub Discussions](https://github.com/objectql/objectql/discussions)
- **Bug reports**: [GitHub Issues](https://github.com/objectql/objectql/issues)
- **Feature ideas**: Start a discussion first
- **Security issues**: See SECURITY.md (if applicable)

## 📜 License

By contributing to ObjectQL, you agree that your contributions will be licensed under the MIT License.

You retain copyright to your contributions, but grant ObjectQL and the community a perpetual, worldwide, non-exclusive, royalty-free license to use, modify, and distribute your contributions as part of the project.

## 🙏 Recognition

All contributors are recognized in our [CONTRIBUTORS.md](./CONTRIBUTORS.md) file (to be created) and in release notes.

Significant contributors may be invited to join the maintainer team.

## 🌈 Community

We're committed to providing a welcoming and inclusive environment. Please read and follow our Code of Conduct (see [GOVERNANCE.md](./GOVERNANCE.md)).

---

**Thank you for contributing to ObjectQL!** 

Every contribution, no matter how small, helps make ObjectQL better for developers worldwide.

**Together, we're building the future of universal data protocols.** 🚀
