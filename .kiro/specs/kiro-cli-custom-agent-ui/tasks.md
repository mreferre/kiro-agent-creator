# Implementation Plan: Kiro CLI Custom Agent UI

## Overview

This implementation plan breaks down the Kiro CLI Custom Agent UI into incremental coding tasks. Each task builds on previous work, with Playwright tests integrated throughout to catch issues early. The approach prioritizes core functionality first, then adds advanced features.

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - [x] 1.1 Initialize Vite React TypeScript project with Tailwind CSS
    - Create project with `npm create vite@latest kiro-agent-ui -- --template react-ts` (non-interactive)
    - Install dependencies with `npm install`
    - Install Tailwind CSS with `npm install -D tailwindcss postcss autoprefixer` and `npx tailwindcss init -p`
    - Set up basic folder structure: `src/components`, `src/services`, `src/types`, `src/hooks`
    - _Requirements: Technical foundation_

  - [x] 1.2 Define TypeScript types and Zod schemas for AgentConfiguration
    - Create `src/types/agent-config.ts` with all interfaces
    - Create `src/schemas/agent-config.ts` with Zod validation schemas
    - _Requirements: 4.4, 4.5_

  - [x] 1.3 Write property tests for Zod schema validation
    - **Property 7: Keyboard Shortcut Format Validation**
    - **Property 8: MCP Server Configuration Validation**
    - **Property 10: Tool Alias Validation**
    - **Validates: Requirements 4.4, 4.5, 12.2, 12.3**

  - [x] 1.4 Configure Playwright test structure
    - Create test folder structure for organizing E2E tests
    - Note: Playwright is available via MCP tools (mcp_playwright_*) - no installation needed
    - _Requirements: 14.1_

- [x] 2. Checkpoint - Verify project setup
  - Ensure project builds and runs with `npm run dev`
  - Verify the app loads in browser using Playwright MCP tools
  - Ask the user if questions arise

- [x] 3. Basic Form Structure and State Management
  - [x] 3.1 Create App component with layout structure
    - Implement main layout with toolbar area, form area, and preview panel area
    - Set up configuration state with useState
    - _Requirements: 1.1, 11.1_

  - [x] 3.2 Create BasicFieldsSection component
    - Implement fields for name, description, prompt, model, keyboardShortcut, welcomeMessage, includeMcpJson
    - Wire up onChange handlers to update state
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 3.3 Create FieldWithTooltip reusable component
    - Implement info icon with hover tooltip
    - Include support for example values in tooltips
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.4 Validate basic form rendering with Playwright MCP
    - Use mcp_playwright_browser_navigate to load the app
    - Use mcp_playwright_browser_snapshot to verify form displays all basic fields
    - Verify placeholder text is shown for empty fields
    - Verify tooltips appear on hover using mcp_playwright_browser_hover
    - _Requirements: 1.1, 1.4, 5.2, 14.1_

- [x] 4. JSON Preview Panel
  - [x] 4.1 Create JSONPreviewPanel component
    - Implement JSON display with syntax highlighting (use a simple CSS approach or lightweight library)
    - Implement toggle visibility button
    - Implement copy to clipboard button
    - _Requirements: 11.1, 11.3, 11.4, 11.5_

  - [x] 4.2 Wire JSON preview to configuration state
    - Update preview on every state change
    - Format JSON with 2-space indentation
    - _Requirements: 11.2_

  - [x] 4.3 Write property tests for JSON preview synchronization
    - **Property 5: Field State Synchronization**
    - **Validates: Requirements 1.2, 11.2**

  - [x] 4.4 Validate JSON preview with Playwright MCP
    - Use mcp_playwright_browser_type to modify fields and verify preview updates
    - Test toggle visibility using mcp_playwright_browser_click
    - Test copy to clipboard functionality
    - _Requirements: 11.2, 11.4, 11.5, 14.9_

- [x] 5. Checkpoint - Verify basic form and preview
  - Ensure basic fields update state correctly
  - Ensure JSON preview reflects state changes
  - Ask the user if questions arise

- [x] 6. Validation Engine
  - [x] 6.1 Create ValidationEngine service
    - Implement validate() method using Zod schemas
    - Implement validateField() for single field validation
    - Return structured ValidationErrors object with field paths
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Integrate validation with form state
    - Run validation on every state change
    - Display error indicators next to invalid fields
    - Show error tooltips on hover
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [x] 6.3 Write property tests for validation completeness
    - **Property 6: Validation Completeness**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 6.4 Validate validation display with Playwright MCP
    - Enter invalid values and verify error indicators appear
    - Use mcp_playwright_browser_hover to verify error tooltips show correct messages
    - Verify valid indicator shows when all fields are valid
    - _Requirements: 4.2, 4.3, 4.6, 14.4_

- [x] 7. File Import/Export
  - [x] 7.1 Create FileHandler service
    - Implement importFile() to parse JSON and return AgentConfiguration
    - Implement exportConfig() to generate and download JSON file
    - Handle errors gracefully with descriptive messages
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 7.2 Create Toolbar component with import/export buttons
    - Implement "New Configuration" button
    - Implement "Import" button with file picker
    - Implement "Export" button (disabled when invalid)
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 7.3 Write property tests for import/export
    - **Property 1: Import/Export Round-Trip Consistency**
    - **Property 2: Invalid JSON Error Handling**
    - **Property 3: JSON Serialization Cleanliness**
    - **Property 4: Filename Generation Logic**
    - **Validates: Requirements 2.2, 2.3, 2.4, 3.2, 3.3, 3.4**

  - [x] 7.4 Validate import/export flows with Playwright MCP
    - Use mcp_playwright_browser_file_upload to import a valid JSON file and verify form population
    - Test importing invalid JSON shows error message
    - Test exporting triggers download with correct content
    - _Requirements: 2.2, 2.3, 3.1, 14.2, 14.3_

- [x] 8. Checkpoint - Verify core functionality
  - Ensure import/export works correctly
  - Ensure validation prevents exporting invalid configs
  - Ask the user if questions arise

- [x] 9. Array Field Management
  - [x] 9.1 Create ArrayField reusable component
    - Implement add button to append new items
    - Implement remove button for each item
    - Implement reorder with up/down buttons
    - Show placeholder when array is empty
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 9.2 Create ToolsSection component
    - Implement tools array field
    - Implement allowedTools array field
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.3 Write property tests for array manipulation
    - **Property 9: Array Manipulation Invariants**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [x] 9.4 Validate array fields with Playwright MCP
    - Click add button and verify array length increases
    - Click remove button and verify array length decreases
    - Test reordering preserves all items
    - _Requirements: 6.2, 6.3, 6.4, 14.5_

- [x] 10. Tool Aliases Configuration
  - [x] 10.1 Add tool aliases section to ToolsSection
    - Implement key-value pair editor for toolAliases
    - Add validation for tool reference format
    - Add validation for alias name format
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 10.2 Validate tool aliases with Playwright MCP
    - Test adding and removing aliases via UI interactions
    - Test validation error display for invalid formats
    - _Requirements: 12.1, 12.4_

- [x] 11. MCP Servers Configuration
  - [x] 11.1 Create MCPServersSection component
    - Implement "Add MCP Server" button with name input
    - Implement server type toggle (local/HTTP)
    - Implement conditional fields based on server type
    - Implement remove button for each server
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 11.2 Add unique server name validation
    - Validate server names are unique within configuration
    - Display error when duplicate name is entered
    - _Requirements: 7.6_

  - [x] 11.3 Validate MCP servers with Playwright MCP
    - Test adding local server with command, args, env, timeout fields
    - Test adding HTTP server with url field
    - Test switching between server types using toggle
    - Test removing servers
    - Test duplicate name validation error display
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 14.6_

- [x] 12. Checkpoint - Verify array and MCP server features
  - Ensure array manipulation works correctly
  - Ensure MCP server configuration works for both types
  - Ask the user if questions arise

- [x] 13. Hooks Configuration
  - [x] 13.1 Create HooksSection component
    - Implement separate subsections for each hook type
    - Implement hook form with command, timeout_ms, cache_ttl_seconds fields
    - Implement matcher field for preToolUse and postToolUse hooks
    - Implement add/remove for hooks in each section
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 13.2 Validate hooks with Playwright MCP
    - Test adding hooks to each trigger point section
    - Verify matcher field appears only for preToolUse/postToolUse
    - Test removing hooks
    - Test multiple hooks per trigger point
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 14.7_

- [x] 14. Tool Settings Configuration
  - [x] 14.1 Create ToolSettingsSection component
    - Implement write tool settings with allowedPaths array
    - Implement shell tool settings with allowedCommands, deniedCommands arrays and autoAllowReadonly toggle
    - Implement aws tool settings with allowedServices array and autoAllowReadonly toggle
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 14.2 Ensure empty tool settings are omitted from export
    - Only include toolsSettings in export if at least one setting is configured
    - _Requirements: 9.5_

- [x] 15. Resources Configuration
  - [x] 15.1 Create ResourcesSection component
    - Implement simple URI resource input (file://, skill://)
    - Implement knowledge base resource form with all fields
    - Implement indexType dropdown with "best" and "fast" options
    - Visually distinguish between URI resources and knowledge base objects
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Checkpoint - Verify hooks, tool settings, and resources
  - Ensure hooks configuration works for all trigger points
  - Ensure tool settings are properly configured and exported
  - Ensure resources support both URI and knowledge base types
  - Ask the user if questions arise

- [x] 17. Example Agent Generator
  - [x] 17.1 Create ExampleGenerator service
    - Implement getExamples() returning list of example agents
    - Implement getExample(id) returning specific example
    - Create at least 3 example agents (Rust Backend, Frontend React, DevOps AWS)
    - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 17.2 Add "Load Example Agent" button to Toolbar
    - Implement dropdown/modal to select example
    - Load selected example into configuration state
    - _Requirements: 13.1, 13.8_

  - [x] 17.3 Write property tests for example validity
    - **Property 11: Example Agent Validity**
    - **Validates: Requirements 13.3, 13.7**

  - [x] 17.4 Validate example loading with Playwright MCP
    - Test that example selection dropdown/modal is displayed
    - Test that selecting an example populates the form correctly
    - Verify loaded examples pass validation (no error indicators)
    - _Requirements: 13.1, 13.7, 13.8, 14.8_

- [x] 18. Final Polish and Integration
  - [x] 18.1 Add section headers and visual grouping
    - Group related fields into collapsible sections
    - Add clear section headers
    - _Requirements: 5.4_

  - [x] 18.2 Ensure all tooltips have example values
    - Review all fields and add examples where applicable
    - _Requirements: 5.3_

  - [x] 18.3 Add visual valid/invalid configuration indicator
    - Show green checkmark when configuration is valid
    - Show red indicator when errors exist
    - _Requirements: 4.6_

- [x] 19. Final Checkpoint - Complete E2E validation
  - Run through all major user flows using Playwright MCP tools
  - Verify all features work end-to-end
  - Ensure no console errors using mcp_playwright_browser_console_messages
  - Ask the user if questions arise

## Notes

- All tasks are required for comprehensive coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Playwright MCP tools (mcp_playwright_*) are used for E2E validation - no installation needed
- E2E validation is integrated throughout development to catch issues early
- Unit tests validate specific examples and edge cases
