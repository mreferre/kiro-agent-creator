# E2E Tests for Kiro CLI Custom Agent UI

This directory contains end-to-end test specifications for the Kiro CLI Custom Agent UI application.

## Test Structure

The tests are organized by feature area:

| File | Description | Requirements |
|------|-------------|--------------|
| `basic-form.spec.ts` | Basic form rendering and interactions | 1.1-1.4, 5.1-5.4, 14.1 |
| `import-export.spec.ts` | File import/export flows | 2.1-2.4, 3.1-3.4, 14.2-14.3 |
| `validation.spec.ts` | Validation error display | 4.1-4.6, 14.4 |
| `array-fields.spec.ts` | Array manipulation (tools, resources) | 6.1-6.5, 14.5 |
| `mcp-servers.spec.ts` | MCP server configuration | 7.1-7.6, 14.6 |
| `hooks.spec.ts` | Hook configuration | 8.1-8.5, 14.7 |
| `examples.spec.ts` | Example agent loading | 13.1-13.8, 14.8 |
| `json-preview.spec.ts` | JSON preview functionality | 11.1-11.5, 14.9 |

## Running Tests

Tests are executed using Playwright MCP tools (mcp_playwright_*). No local Playwright installation is required.

### Available Playwright MCP Tools

- `mcp_playwright_browser_navigate` - Navigate to a URL
- `mcp_playwright_browser_snapshot` - Capture accessibility snapshot (preferred over screenshot)
- `mcp_playwright_browser_click` - Click on elements
- `mcp_playwright_browser_type` - Type text into elements
- `mcp_playwright_browser_hover` - Hover over elements
- `mcp_playwright_browser_file_upload` - Upload files
- `mcp_playwright_browser_select_option` - Select dropdown options
- `mcp_playwright_browser_drag` - Drag and drop elements
- `mcp_playwright_browser_evaluate` - Execute JavaScript
- `mcp_playwright_browser_console_messages` - Get console messages
- `mcp_playwright_browser_take_screenshot` - Take screenshots

### Test Execution Strategy

1. Start the development server (`npm run dev`)
2. Use `mcp_playwright_browser_navigate` to load the application
3. Use `mcp_playwright_browser_snapshot` to verify UI state
4. Use interaction tools to simulate user actions
5. Verify results using snapshots and evaluations

## Test Coverage Goals

| Category | Target Coverage |
|----------|-----------------|
| E2E User Flows | All critical paths |
| Form Interactions | All field types |
| Validation | All error scenarios |
| Import/Export | Valid and invalid files |

## Notes

- Tests are written incrementally alongside feature development
- Each test file documents the specific requirements it validates
- Tests use accessibility snapshots for reliable element identification
- Console messages are checked for errors after each major flow
