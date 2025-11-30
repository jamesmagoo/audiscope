# AudiScope

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/jamesmagoos-projects/v0-medical-training-audio-assessor)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/VeZzddpVrrb)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/jamesmagoos-projects/v0-medical-training-audio-assessor](https://vercel.com/jamesmagoos-projects/v0-medical-training-audio-assessor)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/VeZzddpVrrb](https://v0.dev/chat/projects/VeZzddpVrrb)**

## Getting Started

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment files (automated)
./setup-env.sh

# 3. Start development server
pnpm dev
```

### Environment Setup

This project requires environment configuration files that are **NOT committed to git** for security.

Run the setup script to create them:
```bash
./setup-env.sh
```

Or see [DEV_SETUP.md](./DEV_SETUP.md) for detailed manual setup instructions.

### Development Commands

```bash
pnpm dev      # Cloud development (recommended)
pnpm local    # Local development with LocalStack
pnpm staging  # Staging environment
pnpm build    # Production build
```

## Documentation

- **[DEV_SETUP.md](./DEV_SETUP.md)** - Detailed development environment setup
- **[CLAUDE.md](./CLAUDE.md)** - Complete project documentation
- **[ENVIRONMENT_COMMANDS.md](./ENVIRONMENT_COMMANDS.md)** - Environment commands reference

## Security

⚠️ **Important:** Never commit `.env*` files (except `.env.example`) to git. They contain sensitive credentials and are automatically gitignored.
