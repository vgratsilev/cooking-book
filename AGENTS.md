<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## UI development

- The project primarily follows a mobile-first approach: design and implement interfaces for mobile screens first, then adapt them for tablet and desktop.

## HeroUI React v3

- Use the local HeroUI v3 documentation in `./.heroui-docs/react` for all HeroUI-related work.
- Before writing or modifying HeroUI code, search and read the relevant documentation and examples.
- Do not rely on prior knowledge of HeroUI v3 APIs.
- If the documentation is missing, regenerate it with:
  `npx heroui-cli@latest agents-md --react --output AGENTS.md`
