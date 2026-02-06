# Code Quality & Development Tools

## Available Scripts for Code Quality
- `bun lint` - ESLint for code quality and consistency
- `bun typecheck` - TypeScript type checking without compilation
- `bun run build` - Production build (includes type checking)

## Recommended Development Setup
- Install ESLint extension in your editor for real-time linting
- Enable TypeScript strict mode checking in your editor
- Consider setting up Prettier for consistent code formatting

## Pre-commit Recommendations
While not currently configured, consider adding:
- Husky for git hooks
- lint-staged for running linters on staged files
- Prettier for automatic code formatting

## Development Workflow

### Common Development Tasks
1. **Adding new components**: Follow existing patterns in `components/` directory
2. **Creating new pages**: Use Next.js App Router structure in `app/` directory
3. **Styling**: Use Tailwind CSS classes and shadcn/ui components
4. **Forms**: Use React Hook Form with Zod validation (see existing patterns)

### Debugging
- Use React DevTools for component debugging
- Check browser Network tab for API request/response debugging
- Console logs are preserved in development mode

### Troubleshooting
- **Build errors**: Run `bun typecheck` to identify TypeScript issues
- **Lint errors**: Run `bun lint` to see ESLint warnings/errors
- **API connectivity**: Verify `NEXT_PUBLIC_API_GATEWAY_URL` in `.env.local`
- **Upload issues**: Check browser console for S3 presigned URL errors
