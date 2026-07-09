# Contributing to BulkMeta

Thank you for your interest in contributing to BulkMeta! We welcome bug reports, feature requests, and pull requests.

## Reporting Issues

Before opening an issue, please check if it has already been reported. When you do open an issue:

- **Bug reports** — Include steps to reproduce, expected behavior, and actual behavior
- **Feature requests** — Explain the use case and how it would benefit users
- **Questions** — Use the issue discussions, not the issue tracker

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Basic understanding of React and TypeScript

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/kmbashar/bulkmeta.git
   cd bulkmeta
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the app locally in Webflow Designer:
   ```bash
   npm run webflow:dev
   ```

   This watches for changes and serves on port `1337`.

### Building

Create a production build:
```bash
npm run build
```

Generate a bundle for Webflow:
```bash
npm run webflow:bundle
```

## Making Changes

1. Create a branch for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test thoroughly
3. Keep commits focused and write clear commit messages
4. Ensure code follows the existing style and TypeScript strict mode

## Submitting Pull Requests

1. Push your branch to your fork
2. Open a pull request with a clear title and description
3. Reference any related issues using `#issue-number`
4. Wait for review and address feedback

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Write descriptive commit messages
- Test your changes with the Webflow Designer Extension API
- Update the README if your changes affect usage

## Code Style

- TypeScript strict mode is enabled
- Follow React hooks best practices
- Use meaningful variable and function names
- Add comments for complex logic

## Questions?

Feel free to open an issue for questions or discussions about development.

Thank you for contributing! 🎉
