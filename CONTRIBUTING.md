# Contributing to RepoHygiene

Thank you for your interest in contributing to RepoHygiene! 🎉

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/repohygiene.git
   cd repohygiene
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   npm run test:coverage
   ```

## Project Structure

```
src/
├── cli/           # CLI entry point and commands
│   ├── ui/        # Terminal UI components
│   └── index.ts   # Main CLI
├── core/          # Core utilities
│   ├── config.ts  # Configuration loader
│   ├── git.ts     # Git utilities
│   └── scanner.ts # Base scanner class
├── modules/       # Feature modules
│   ├── codeowners/
│   ├── licenses/
│   ├── secrets/
│   └── branches/
└── types/         # TypeScript definitions
```

## Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Use readonly arrays/objects where possible
- Write descriptive function/variable names

### Commits

We follow [Conventional Commits](https://conventionalcommits.org/):

```
feat: add new secret pattern for Discord webhooks
fix: handle edge case in license parsing
docs: update README with new examples
test: add tests for branch analyzer
```

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Add/update tests as needed
4. Ensure all tests pass
5. Submit a PR with a clear description

## Adding New Secret Patterns

1. Open `src/modules/secrets/patterns.ts`
2. Add your pattern to the `SECRET_PATTERNS` array:
   ```typescript
   {
     name: 'My Service API Key',
     pattern: /MY_SERVICE_[A-Za-z0-9]{32}/g,
     severity: 'high',
     description: 'My Service API key',
   },
   ```
3. Add a test case

## Questions?

Open an issue or start a discussion. We're happy to help!
