# Important

- Divide logics and UI into hooks and components.
- Keep files and component maintable and shorts, devide into multiple if required, if file size excceed 400 numbers of line.
- Always seperate UI and logics into components and hooks.
- use heroui-native for native app components and screens development
- use ai-element's and ai-sdk's components for web components and screens development. We've already installed all the ai-elements's components. if component we're looking for not available then use shadcn components.
- Do not use useCallback unless necessary.
- Write layout and components that should work in both light and dark mode.
- Layout and components should be mobile first and responsive.
- Do not write documentation .md file untill neccessary and it's a big feature.
- use Use shadcn CLI for installing any new web components, but installing any components first check if the exist or not.
- never create markdown (`.md`) files after you're done unless it's a big feature and planning is required. NEVER!
- never user emojis in your replies.
- Check convex rules (.cursor/rules/convex_rules.mdc) BEFORE implementing any Convex functions, schemas, or HTTP endpoints.
- If you encounter ANY Convex-related errors (compilation, runtime, or schema errors), you MUST:
  1. First check the convex_rules.mdc file for correct syntax and patterns
  2. Use the Convex MCP server to query official documentation
  3. Use the Exa MCP server to search for similar issues and solutions
- Common Convex patterns to always verify:
  - HTTP endpoints MUST use httpAction wrapper and be registered in http.ts
  - All functions MUST have args and returns validators
  - Use internal vs public function registration appropriately
  - Index names must include all field names (e.g., "by_user_and_status")
  - Never use filter() in queries - always use withIndex()
- When stuck on Convex errors for more than 2 attempts, stop and use MCP servers to find the correct solution.
