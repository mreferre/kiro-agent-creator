import type { AgentConfiguration } from '../types/agent-config';

/**
 * Example agent metadata
 */
export interface ExampleAgent {
  id: string;
  name: string;
  description: string;
  config: AgentConfiguration;
}

/**
 * Rust Backend Developer Agent
 */
const rustBackendAgent: ExampleAgent = {
  id: 'rust-backend',
  name: 'Rust Backend Developer',
  description: 'Specialized agent for Rust backend development with Cargo, testing, and AWS integration.',
  config: {
    name: 'rust-backend-dev',
    description: 'A specialized agent for Rust backend development',
    prompt: 'You are an expert Rust backend developer. Help with Cargo projects, async programming, error handling, and AWS service integration. Follow Rust best practices and idiomatic patterns.',
    model: 'claude-sonnet-4-20250514',
    keyboardShortcut: 'ctrl+shift+r',
    welcomeMessage: 'Hello! I\'m your Rust backend development assistant. I can help with Cargo, async/await, error handling, and AWS integrations.',
    tools: ['fs_read', 'fs_write', 'shell', 'web_search'],
    allowedTools: ['fs_read', 'fs_write', 'shell'],
    toolAliases: {
      '@shell/cargo-build': 'build',
      '@shell/cargo-test': 'test',
    },
    toolsSettings: {
      shell: {
        allowedCommands: ['cargo', 'rustc', 'rustfmt', 'clippy'],
        autoAllowReadonly: true,
      },
      write: {
        allowedPaths: ['src/**', 'tests/**', 'Cargo.toml'],
      },
      aws: {
        allowedServices: ['dynamodb', 'lambda', 's3', 'sqs'],
        autoAllowReadonly: true,
      },
    },
    resources: [
      'file://./README.md',
      'file://./Cargo.toml',
      {
        type: 'knowledgeBase',
        source: './docs',
        name: 'Project Documentation',
        description: 'Internal project documentation and API guides',
        indexType: 'best',
        autoUpdate: true,
      },
    ],
  },
};

/**
 * Frontend React Developer Agent
 */
const frontendReactAgent: ExampleAgent = {
  id: 'frontend-react',
  name: 'Frontend React Developer',
  description: 'Specialized agent for React/TypeScript frontend development with modern tooling.',
  config: {
    name: 'frontend-react-dev',
    description: 'A specialized agent for React and TypeScript frontend development',
    prompt: 'You are an expert React and TypeScript developer. Help with component design, state management, testing, and modern frontend best practices. Use functional components and hooks.',
    model: 'claude-sonnet-4-20250514',
    keyboardShortcut: 'ctrl+shift+f',
    welcomeMessage: 'Hi! I\'m your React frontend assistant. I can help with components, hooks, TypeScript, testing, and styling.',
    tools: ['fs_read', 'fs_write', 'shell', 'web_search'],
    allowedTools: ['fs_read', 'fs_write', 'shell'],
    toolAliases: {
      '@shell/npm-install': 'install',
      '@shell/npm-test': 'test',
    },
    toolsSettings: {
      shell: {
        allowedCommands: ['npm', 'yarn', 'pnpm', 'npx', 'node'],
        deniedCommands: ['rm -rf', 'sudo'],
        autoAllowReadonly: true,
      },
      write: {
        allowedPaths: ['src/**', 'tests/**', 'package.json', 'tsconfig.json'],
      },
    },
    hooks: {
      preToolUse: [
        {
          command: 'npm run lint',
          matcher: 'fs_write',
          timeout_ms: 30000,
        },
      ],
      stop: [
        {
          command: 'npm run format',
          timeout_ms: 15000,
        },
      ],
    },
    resources: [
      'file://./README.md',
      'file://./package.json',
      'skill://react-patterns',
    ],
  },
};

/**
 * DevOps AWS Agent
 */
const devopsAwsAgent: ExampleAgent = {
  id: 'devops-aws',
  name: 'DevOps AWS Engineer',
  description: 'Specialized agent for AWS infrastructure, CDK, and DevOps practices.',
  config: {
    name: 'devops-aws-engineer',
    description: 'A specialized agent for AWS infrastructure and DevOps',
    prompt: 'You are an expert AWS DevOps engineer. Help with CDK, CloudFormation, CI/CD pipelines, and infrastructure best practices. Focus on security, cost optimization, and reliability.',
    model: 'claude-sonnet-4-20250514',
    keyboardShortcut: 'ctrl+shift+d',
    welcomeMessage: 'Hello! I\'m your AWS DevOps assistant. I can help with CDK, CloudFormation, CI/CD, and infrastructure design.',
    includeMcpJson: true,
    tools: ['fs_read', 'fs_write', 'shell', 'aws', 'web_search'],
    allowedTools: ['fs_read', 'fs_write', 'shell', 'aws'],
    toolAliases: {
      '@shell/cdk-deploy': 'deploy',
      '@shell/cdk-synth': 'synth',
    },
    mcpServers: {
      'aws-docs': {
        command: 'uvx',
        args: ['awslabs.aws-documentation-mcp-server@latest'],
        env: {
          FASTMCP_LOG_LEVEL: 'ERROR',
        },
      },
    },
    toolsSettings: {
      shell: {
        allowedCommands: ['cdk', 'aws', 'sam', 'docker', 'npm', 'yarn'],
        autoAllowReadonly: true,
      },
      write: {
        allowedPaths: ['lib/**', 'bin/**', 'cdk.json', 'package.json'],
      },
      aws: {
        allowedServices: ['cloudformation', 's3', 'lambda', 'dynamodb', 'iam', 'ec2', 'ecs', 'ecr'],
        autoAllowReadonly: true,
      },
    },
    hooks: {
      agentSpawn: [
        {
          command: 'aws sts get-caller-identity',
          timeout_ms: 10000,
        },
      ],
      preToolUse: [
        {
          command: 'cdk synth --quiet',
          matcher: 'aws',
          timeout_ms: 60000,
        },
      ],
    },
    resources: [
      'file://./README.md',
      'file://./cdk.json',
      {
        type: 'knowledgeBase',
        source: './docs/architecture',
        name: 'Architecture Documentation',
        description: 'AWS architecture diagrams and design decisions',
        indexType: 'best',
        autoUpdate: true,
      },
    ],
  },
};

/**
 * All available example agents
 */
const examples: ExampleAgent[] = [
  rustBackendAgent,
  frontendReactAgent,
  devopsAwsAgent,
];

/**
 * Get all available example agents
 */
export function getExamples(): ExampleAgent[] {
  return examples;
}

/**
 * Get a specific example agent by ID
 */
export function getExample(id: string): ExampleAgent | undefined {
  return examples.find((example) => example.id === id);
}

export default { getExamples, getExample };
