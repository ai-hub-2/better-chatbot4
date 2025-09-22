// Advanced MCP Tools for AI Integration
import { advancedMCPServices } from "./advanced-services";

export const advancedMCPTools = {
  // DeerFlow Tools
  deerflow_create_workflow: {
    description:
      "Create a new workflow in DeerFlow for automation and orchestration",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the workflow" },
        description: {
          type: "string",
          description: "Description of the workflow",
        },
        steps: {
          type: "array",
          description: "Array of workflow steps",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string" },
              config: { type: "object" },
            },
          },
        },
      },
      required: ["name", "steps"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.createDeerFlowWorkflow(params);
    },
  },

  deerflow_execute_workflow: {
    description: "Execute a DeerFlow workflow with optional inputs",
    parameters: {
      type: "object",
      properties: {
        workflowId: {
          type: "string",
          description: "ID of the workflow to execute",
        },
        inputs: {
          type: "object",
          description: "Input parameters for the workflow",
        },
      },
      required: ["workflowId"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeDeerFlowWorkflow(
        params.workflowId,
        params.inputs,
      );
    },
  },

  // Browserbase Tools
  browserbase_create_session: {
    description: "Create a new browser session for automation",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Browserbase project ID" },
        name: { type: "string", description: "Name for the session" },
        metadata: { type: "object", description: "Additional metadata" },
      },
    },
    execute: async (params: any) => {
      return await advancedMCPServices.createBrowserbaseSession(params);
    },
  },

  browserbase_navigate: {
    description: "Navigate to a URL in a browser session",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session ID" },
        url: { type: "string", description: "URL to navigate to" },
      },
      required: ["sessionId", "url"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeBrowserbaseAction(
        params.sessionId,
        {
          type: "navigate",
          url: params.url,
        },
      );
    },
  },

  browserbase_click: {
    description: "Click an element in a browser session",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session ID" },
        selector: {
          type: "string",
          description: "CSS selector for the element to click",
        },
      },
      required: ["sessionId", "selector"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeBrowserbaseAction(
        params.sessionId,
        {
          type: "click",
          selector: params.selector,
        },
      );
    },
  },

  browserbase_type: {
    description: "Type text into an element in a browser session",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session ID" },
        selector: {
          type: "string",
          description: "CSS selector for the input element",
        },
        text: { type: "string", description: "Text to type" },
      },
      required: ["sessionId", "selector", "text"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeBrowserbaseAction(
        params.sessionId,
        {
          type: "type",
          selector: params.selector,
          text: params.text,
        },
      );
    },
  },

  browserbase_screenshot: {
    description: "Take a screenshot of the current page",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session ID" },
      },
      required: ["sessionId"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeBrowserbaseAction(
        params.sessionId,
        {
          type: "screenshot",
        },
      );
    },
  },

  browserbase_extract: {
    description: "Extract data from the current page",
    parameters: {
      type: "object",
      properties: {
        sessionId: { type: "string", description: "Browser session ID" },
        selector: {
          type: "string",
          description: "CSS selector for elements to extract",
        },
      },
      required: ["sessionId", "selector"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeBrowserbaseAction(
        params.sessionId,
        {
          type: "extract",
          selector: params.selector,
        },
      );
    },
  },

  // E2B Tools
  e2b_create_sandbox: {
    description: "Create a new E2B code execution sandbox",
    parameters: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description: "E2B template ID (default: base)",
        },
        timeout: {
          type: "number",
          description: "Timeout in seconds (default: 300)",
        },
        metadata: { type: "object", description: "Additional metadata" },
      },
    },
    execute: async (params: any) => {
      return await advancedMCPServices.createE2BSandbox(params);
    },
  },

  e2b_execute_python: {
    description: "Execute Python code in an E2B sandbox",
    parameters: {
      type: "object",
      properties: {
        sandboxId: { type: "string", description: "E2B sandbox ID" },
        code: { type: "string", description: "Python code to execute" },
      },
      required: ["sandboxId", "code"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeE2BCode(
        params.sandboxId,
        params.code,
        "python",
      );
    },
  },

  e2b_execute_javascript: {
    description: "Execute JavaScript code in an E2B sandbox",
    parameters: {
      type: "object",
      properties: {
        sandboxId: { type: "string", description: "E2B sandbox ID" },
        code: { type: "string", description: "JavaScript code to execute" },
      },
      required: ["sandboxId", "code"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeE2BCode(
        params.sandboxId,
        params.code,
        "javascript",
      );
    },
  },

  e2b_execute_bash: {
    description: "Execute Bash commands in an E2B sandbox",
    parameters: {
      type: "object",
      properties: {
        sandboxId: { type: "string", description: "E2B sandbox ID" },
        code: { type: "string", description: "Bash commands to execute" },
      },
      required: ["sandboxId", "code"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.executeE2BCode(
        params.sandboxId,
        params.code,
        "bash",
      );
    },
  },

  // Mem0 Tools
  mem0_add_memory: {
    description: "Add a new memory to Mem0",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Memory text to store" },
        metadata: {
          type: "object",
          description: "Additional metadata for the memory",
        },
        collectionId: {
          type: "string",
          description: "Collection ID to store the memory in",
        },
      },
      required: ["text"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.addMem0Memory(params);
    },
  },

  mem0_search_memories: {
    description: "Search for memories in Mem0",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 10)",
        },
        collectionId: {
          type: "string",
          description: "Collection ID to search in",
        },
        metadata: { type: "object", description: "Metadata filters" },
      },
      required: ["query"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.searchMem0Memories(params.query, {
        limit: params.limit,
        collectionId: params.collectionId,
        metadata: params.metadata,
      });
    },
  },

  // Firecrawl Tools
  firecrawl_scrape_url: {
    description: "Scrape a single URL using Firecrawl",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to scrape" },
        includeHtml: { type: "boolean", description: "Include HTML content" },
        includeMarkdown: {
          type: "boolean",
          description: "Include Markdown content",
        },
        includeScreenshot: {
          type: "boolean",
          description: "Include screenshot",
        },
      },
      required: ["url"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.scrapeFirecrawlUrl(params.url, {
        includeHtml: params.includeHtml,
        includeMarkdown: params.includeMarkdown,
        includeScreenshot: params.includeScreenshot,
      });
    },
  },

  firecrawl_crawl_site: {
    description: "Crawl an entire website using Firecrawl",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Base URL to start crawling from" },
        maxDepth: {
          type: "number",
          description: "Maximum crawl depth (default: 3)",
        },
        limit: {
          type: "number",
          description: "Maximum number of pages to crawl (default: 100)",
        },
        includeHtml: { type: "boolean", description: "Include HTML content" },
        includeMarkdown: {
          type: "boolean",
          description: "Include Markdown content",
        },
        includeScreenshot: {
          type: "boolean",
          description: "Include screenshots",
        },
      },
      required: ["url"],
    },
    execute: async (params: any) => {
      return await advancedMCPServices.crawlFirecrawlSite(params.url, {
        maxDepth: params.maxDepth,
        limit: params.limit,
        includeHtml: params.includeHtml,
        includeMarkdown: params.includeMarkdown,
        includeScreenshot: params.includeScreenshot,
      });
    },
  },
};

// Helper function to get available tools based on configured services
export function getAvailableAdvancedTools() {
  const services = advancedMCPServices.getAvailableServices();
  const availableTools: Record<string, any> = {};

  if (services.deerFlow) {
    availableTools.deerflow_create_workflow =
      advancedMCPTools.deerflow_create_workflow;
    availableTools.deerflow_execute_workflow =
      advancedMCPTools.deerflow_execute_workflow;
  }

  if (services.browserbase) {
    availableTools.browserbase_create_session =
      advancedMCPTools.browserbase_create_session;
    availableTools.browserbase_navigate = advancedMCPTools.browserbase_navigate;
    availableTools.browserbase_click = advancedMCPTools.browserbase_click;
    availableTools.browserbase_type = advancedMCPTools.browserbase_type;
    availableTools.browserbase_screenshot =
      advancedMCPTools.browserbase_screenshot;
    availableTools.browserbase_extract = advancedMCPTools.browserbase_extract;
  }

  if (services.e2b) {
    availableTools.e2b_create_sandbox = advancedMCPTools.e2b_create_sandbox;
    availableTools.e2b_execute_python = advancedMCPTools.e2b_execute_python;
    availableTools.e2b_execute_javascript =
      advancedMCPTools.e2b_execute_javascript;
    availableTools.e2b_execute_bash = advancedMCPTools.e2b_execute_bash;
  }

  if (services.mem0) {
    availableTools.mem0_add_memory = advancedMCPTools.mem0_add_memory;
    availableTools.mem0_search_memories = advancedMCPTools.mem0_search_memories;
  }

  if (services.firecrawl) {
    availableTools.firecrawl_scrape_url = advancedMCPTools.firecrawl_scrape_url;
    availableTools.firecrawl_crawl_site = advancedMCPTools.firecrawl_crawl_site;
  }

  return availableTools;
}
