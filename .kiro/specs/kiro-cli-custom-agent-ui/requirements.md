# Requirements Document

## Introduction

This document defines the requirements for a web application that provides a visual UI for creating and editing Kiro CLI custom agent configuration files. The application enables users to build, validate, import, and export JSON configuration files through an intuitive form-based interface, eliminating the need to manually write JSON.

## Glossary

- **Agent_Configuration**: A JSON object containing all settings for a Kiro CLI custom agent
- **Configuration_Editor**: The main form-based interface for editing agent configurations
- **MCP_Server**: Model Context Protocol server configuration that provides tools to the agent
- **Tool_Reference**: A string reference to a tool (built-in, wildcard, or MCP server tool)
- **Hook**: A command that runs at specific trigger points during agent execution
- **Resource**: A file, skill, or knowledge base available to the agent
- **Knowledge_Base**: An indexed collection of documents for semantic search
- **Validation_Engine**: The component that validates configurations against the schema
- **File_Handler**: The component responsible for importing and exporting JSON files
- **Example_Generator**: The component that provides pre-built example agent configurations
- **Test_Suite**: The collection of Playwright end-to-end tests that validate application functionality

## Requirements

### Requirement 1: Create New Agent Configuration

**User Story:** As a user, I want to create a new custom agent configuration from scratch, so that I can define a new agent without manually writing JSON.

#### Acceptance Criteria

1. WHEN a user clicks the "New Configuration" button, THE Configuration_Editor SHALL display an empty form with all available configuration fields
2. WHEN a user enters a value in any configuration field, THE Configuration_Editor SHALL update the internal configuration state immediately
3. THE Configuration_Editor SHALL provide default values for optional fields where sensible defaults exist
4. WHEN a user has not entered any values, THE Configuration_Editor SHALL display placeholder text indicating the expected input format

### Requirement 2: Load Existing Configuration

**User Story:** As a user, I want to load an existing agent JSON file and edit it, so that I can modify configurations I've previously created.

#### Acceptance Criteria

1. WHEN a user clicks the "Import" button, THE File_Handler SHALL open a file picker dialog for JSON files
2. WHEN a user selects a valid JSON file, THE File_Handler SHALL parse the file and populate the Configuration_Editor with the values
3. IF a user selects an invalid JSON file, THEN THE File_Handler SHALL display an error message describing the parsing failure
4. WHEN a configuration is loaded, THE Configuration_Editor SHALL preserve all existing values from the file including unknown fields

### Requirement 3: Export Configuration

**User Story:** As a user, I want to export/download my configuration as a JSON file, so that I can use it with the Kiro CLI.

#### Acceptance Criteria

1. WHEN a user clicks the "Export" button, THE File_Handler SHALL generate a JSON file from the current configuration state
2. THE File_Handler SHALL format the exported JSON with proper indentation for readability
3. THE File_Handler SHALL trigger a browser download with a filename based on the agent name or "agent-config.json" if no name is set
4. THE File_Handler SHALL only include fields that have been explicitly set (omit empty/null optional fields)

### Requirement 4: Configuration Validation

**User Story:** As a user, I want to see validation errors when my configuration is invalid, so that I can fix issues before exporting.

#### Acceptance Criteria

1. WHEN a user modifies any field, THE Validation_Engine SHALL validate the entire configuration against the schema
2. WHEN validation errors exist, THE Configuration_Editor SHALL display error indicators next to the invalid fields
3. WHEN a user hovers over an error indicator, THE Configuration_Editor SHALL display a tooltip with the specific error message
4. THE Validation_Engine SHALL validate keyboard shortcuts against the format pattern "[modifier+]key"
5. THE Validation_Engine SHALL validate MCP server configurations have required fields (command for local, url for HTTP)
6. WHEN all fields are valid, THE Configuration_Editor SHALL display a visual indicator that the configuration is valid

### Requirement 5: Field Documentation

**User Story:** As a user, I want helpful tooltips explaining each configuration option, so that I can understand what each field does.

#### Acceptance Criteria

1. THE Configuration_Editor SHALL display an info icon next to each configuration field
2. WHEN a user hovers over an info icon, THE Configuration_Editor SHALL display a tooltip with the field description
3. THE Configuration_Editor SHALL include example values in tooltips where applicable
4. THE Configuration_Editor SHALL group related fields into logical sections with section headers

### Requirement 6: Array Field Management

**User Story:** As a user, I want to easily add/remove items from arrays (tools, resources, allowedTools), so that I can manage list-based configurations efficiently.

#### Acceptance Criteria

1. WHEN displaying an array field, THE Configuration_Editor SHALL show each item as a separate editable row
2. WHEN a user clicks the "Add" button for an array field, THE Configuration_Editor SHALL append a new empty item to the array
3. WHEN a user clicks the "Remove" button on an array item, THE Configuration_Editor SHALL remove that item from the array
4. THE Configuration_Editor SHALL allow reordering of array items via drag-and-drop or up/down buttons
5. WHEN an array is empty, THE Configuration_Editor SHALL display a placeholder message indicating no items exist

### Requirement 7: MCP Server Configuration

**User Story:** As a user, I want to easily add/remove MCP servers with their configurations, so that I can define which external tools my agent can access.

#### Acceptance Criteria

1. WHEN a user clicks "Add MCP Server", THE Configuration_Editor SHALL display a form for entering server name and configuration
2. THE Configuration_Editor SHALL provide a toggle to switch between local (command-based) and remote (HTTP) server types
3. WHEN local server type is selected, THE Configuration_Editor SHALL display fields for command, args, env, and timeout
4. WHEN remote server type is selected, THE Configuration_Editor SHALL display fields for url
5. WHEN a user clicks "Remove" on an MCP server, THE Configuration_Editor SHALL remove that server from the configuration
6. THE Configuration_Editor SHALL validate that server names are unique within the configuration

### Requirement 8: Hook Configuration

**User Story:** As a user, I want to easily configure hooks for different trigger points, so that I can automate commands at specific moments in the agent lifecycle.

#### Acceptance Criteria

1. THE Configuration_Editor SHALL display separate sections for each hook type (agentSpawn, userPromptSubmit, preToolUse, postToolUse, stop)
2. WHEN a user adds a hook, THE Configuration_Editor SHALL display fields for command, timeout_ms, and cache_ttl_seconds
3. WHEN configuring preToolUse or postToolUse hooks, THE Configuration_Editor SHALL also display a matcher field
4. WHEN a user removes a hook, THE Configuration_Editor SHALL remove it from the appropriate hook array
5. THE Configuration_Editor SHALL allow multiple hooks per trigger point

### Requirement 9: Tool Settings Configuration

**User Story:** As a user, I want to configure tool-specific settings, so that I can control how individual tools behave.

#### Acceptance Criteria

1. THE Configuration_Editor SHALL display tool settings sections for write, shell, and aws tools
2. WHEN configuring write tool settings, THE Configuration_Editor SHALL provide an array field for allowedPaths with glob pattern support
3. WHEN configuring shell tool settings, THE Configuration_Editor SHALL provide fields for allowedCommands, deniedCommands, and autoAllowReadonly toggle
4. WHEN configuring aws tool settings, THE Configuration_Editor SHALL provide fields for allowedServices and autoAllowReadonly toggle
5. THE Configuration_Editor SHALL only include tool settings in the export if at least one setting is configured

### Requirement 10: Resource Configuration

**User Story:** As a user, I want to configure resources including files, skills, and knowledge bases, so that my agent has access to relevant context.

#### Acceptance Criteria

1. THE Configuration_Editor SHALL support adding file resources with URI format "file://path"
2. THE Configuration_Editor SHALL support adding skill resources with URI format "skill://path"
3. WHEN a user adds a knowledge base resource, THE Configuration_Editor SHALL display fields for type, source, name, description, indexType, and autoUpdate
4. THE Configuration_Editor SHALL provide a dropdown for indexType with options "best" and "fast"
5. WHEN displaying resources, THE Configuration_Editor SHALL visually distinguish between simple URI resources and knowledge base objects

### Requirement 11: Live JSON Preview

**User Story:** As a user, I want to see a live preview of the generated JSON, so that I can verify the output matches my expectations.

#### Acceptance Criteria

1. THE Configuration_Editor SHALL display a JSON preview panel showing the current configuration
2. WHEN any field is modified, THE Configuration_Editor SHALL update the JSON preview immediately
3. THE Configuration_Editor SHALL format the JSON preview with syntax highlighting
4. THE Configuration_Editor SHALL allow toggling the JSON preview panel visibility
5. THE Configuration_Editor SHALL allow copying the JSON preview to clipboard with a single click

### Requirement 12: Tool Aliases Configuration

**User Story:** As a user, I want to configure tool aliases, so that I can rename tools to avoid naming collisions or use shorter names.

#### Acceptance Criteria

1. WHEN a user adds a tool alias, THE Configuration_Editor SHALL display fields for the original tool reference and the new alias name
2. THE Validation_Engine SHALL validate that original tool references follow the format "@server/tool_name"
3. THE Validation_Engine SHALL validate that alias names are valid identifiers (alphanumeric and underscores)
4. WHEN a user removes a tool alias, THE Configuration_Editor SHALL remove it from the toolAliases object


### Requirement 13: Example Agent Generator

**User Story:** As a user, I want to generate example custom agents with pre-built configurations, so that I can quickly explore different configuration options and use them as starting points.

#### Acceptance Criteria

1. WHEN a user clicks the "Load Example Agent" button, THE Configuration_Editor SHALL display a selection of example agent templates
2. THE Example_Generator SHALL provide example agents based on common development scenarios (e.g., "rust-backend-agent", "frontend-react-agent", "devops-aws-agent")
3. THE Example_Generator SHALL include appropriate MCP servers with valid configurations for each example type
4. THE Example_Generator SHALL include a curated selection of tools appropriate for each example agent type
5. THE Example_Generator SHALL include realistic hook configurations with practical commands for each example
6. THE Example_Generator SHALL include relevant resource configurations including file patterns and optionally knowledge bases
7. WHEN loading an example agent, THE Example_Generator SHALL ensure all values pass validation
8. THE Configuration_Editor SHALL allow the user to select a different example to replace the current configuration


### Requirement 14: Incremental End-to-End Testing with Playwright

**User Story:** As a developer, I want Playwright tests written incrementally alongside each feature, so that I can catch issues early and validate functionality as it's built.

#### Acceptance Criteria

1. WHEN the basic form structure is implemented, THE Test_Suite SHALL include Playwright tests verifying form rendering and basic interactions
2. WHEN the import functionality is implemented, THE Test_Suite SHALL include Playwright tests for importing JSON files and verifying form population
3. WHEN the export functionality is implemented, THE Test_Suite SHALL include Playwright tests for exporting and verifying the downloaded JSON content
4. WHEN validation is implemented, THE Test_Suite SHALL include Playwright tests for validation error display on invalid inputs
5. WHEN array field management is implemented, THE Test_Suite SHALL include Playwright tests for adding, removing, and reordering array items
6. WHEN MCP server configuration is implemented, THE Test_Suite SHALL include Playwright tests for both local and HTTP server type configurations
7. WHEN hook configuration is implemented, THE Test_Suite SHALL include Playwright tests for configuring hooks at each trigger point
8. WHEN example agents are implemented, THE Test_Suite SHALL include Playwright tests for loading and applying example configurations
9. WHEN the JSON preview is implemented, THE Test_Suite SHALL include Playwright tests verifying real-time preview updates
10. THE Test_Suite SHALL be run after each major feature implementation to ensure no regressions occur
