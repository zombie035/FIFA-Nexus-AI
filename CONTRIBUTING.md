# Contributing to FIFA Nexus AI

Thank you for your interest in contributing to **FIFA Nexus AI**! 🎉

We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and test coverage expansions.

---

## 🚀 Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/FIFA-Nexus-AI.git
cd FIFA-Nexus-AI
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Set Up Local Development
```bash
# Start the full stack
docker-compose up --build

# Or run services individually (see README.md)
```

---

## 📐 Code Standards

### Python (Backend)
- Follow **PEP 8** style conventions
- Use **type hints** wherever possible
- Add docstrings to all public functions
- Keep functions under 50 lines where possible

### TypeScript (Frontend)
- Use **TypeScript strict mode**
- Prefer functional components with hooks
- Use `"use client"` directive for interactive components
- Keep components focused and reusable

### Commit Messages
We follow the **Conventional Commits** specification:

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code formatting, no logic changes |
| `refactor` | Code restructuring without feature/fix |
| `test` | Adding or updating tests |
| `chore` | Build tools, dependencies |

Example: `feat: add crowd density heatmap overlay to StadiumMap`

---

## 🧪 Running Tests

Before submitting a PR, make sure all tests pass:

```bash
docker-compose exec api python test_copilot.py
cd web && npm run build
```

---

## 📦 Pull Request Process

1. Ensure your branch is up to date with `main`
2. Make sure all existing tests pass
3. Add tests for any new functionality
4. Update documentation if needed
5. Submit a Pull Request with a clear description of your changes

---

## 🐛 Reporting Bugs

Please open an issue with:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## 💡 Feature Requests

Open an issue with the `enhancement` label describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

---

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome constructive feedback
- Focus on what's best for the project

---

Thank you for helping make FIFA Nexus AI better! ⚽
