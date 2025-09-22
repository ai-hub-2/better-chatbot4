// Advanced MCP Services Integration
// DeerFlow, Browserbase, E2B, Mem0, Firecrawl

export interface DeerFlowConfig {
  apiKey: string;
  baseUrl?: string;
  projectId?: string;
}

export interface BrowserbaseConfig {
  apiKey: string;
  projectId?: string;
  sessionId?: string;
}

export interface E2BConfig {
  apiKey: string;
  templateId?: string;
  timeout?: number;
}

export interface Mem0Config {
  apiKey: string;
  baseUrl?: string;
  collectionId?: string;
}

export interface FirecrawlConfig {
  apiKey: string;
  baseUrl?: string;
  maxDepth?: number;
}

export class AdvancedMCPServices {
  private deerFlowConfig?: DeerFlowConfig;
  private browserbaseConfig?: BrowserbaseConfig;
  private e2bConfig?: E2BConfig;
  private mem0Config?: Mem0Config;
  private firecrawlConfig?: FirecrawlConfig;

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs() {
    // Load from environment variables
    if (process.env.DEERFLOW_API_KEY) {
      this.deerFlowConfig = {
        apiKey: process.env.DEERFLOW_API_KEY,
        baseUrl: process.env.DEERFLOW_BASE_URL,
        projectId: process.env.DEERFLOW_PROJECT_ID,
      };
    }

    if (process.env.BROWSERBASE_API_KEY) {
      this.browserbaseConfig = {
        apiKey: process.env.BROWSERBASE_API_KEY,
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        sessionId: process.env.BROWSERBASE_SESSION_ID,
      };
    }

    if (process.env.E2B_API_KEY) {
      this.e2bConfig = {
        apiKey: process.env.E2B_API_KEY,
        templateId: process.env.E2B_TEMPLATE_ID || "base",
        timeout: parseInt(process.env.E2B_TIMEOUT || "300"),
      };
    }

    if (process.env.MEM0_API_KEY) {
      this.mem0Config = {
        apiKey: process.env.MEM0_API_KEY,
        baseUrl: process.env.MEM0_BASE_URL || "https://api.mem0.ai",
        collectionId: process.env.MEM0_COLLECTION_ID,
      };
    }

    if (process.env.FIRECRAWL_API_KEY) {
      this.firecrawlConfig = {
        apiKey: process.env.FIRECRAWL_API_KEY,
        baseUrl: process.env.FIRECRAWL_BASE_URL || "https://api.firecrawl.dev",
        maxDepth: parseInt(process.env.FIRECRAWL_MAX_DEPTH || "3"),
      };
    }
  }

  // DeerFlow - Workflow automation and orchestration
  async createDeerFlowWorkflow(workflow: {
    name: string;
    description?: string;
    steps: Array<{
      id: string;
      type: string;
      config: any;
    }>;
  }) {
    if (!this.deerFlowConfig) {
      throw new Error("DeerFlow not configured");
    }

    const response = await fetch(
      `${this.deerFlowConfig.baseUrl || "https://api.deerflow.ai"}/workflows`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.deerFlowConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...workflow,
          projectId: this.deerFlowConfig.projectId,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`DeerFlow API error: ${response.statusText}`);
    }

    return response.json();
  }

  async executeDeerFlowWorkflow(workflowId: string, inputs?: any) {
    if (!this.deerFlowConfig) {
      throw new Error("DeerFlow not configured");
    }

    const response = await fetch(
      `${this.deerFlowConfig.baseUrl || "https://api.deerflow.ai"}/workflows/${workflowId}/execute`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.deerFlowConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      },
    );

    if (!response.ok) {
      throw new Error(`DeerFlow execution error: ${response.statusText}`);
    }

    return response.json();
  }

  // Browserbase - Browser automation
  async createBrowserbaseSession(config?: {
    projectId?: string;
    name?: string;
    metadata?: any;
  }) {
    if (!this.browserbaseConfig) {
      throw new Error("Browserbase not configured");
    }

    const response = await fetch("https://api.browserbase.com/v1/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.browserbaseConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: config?.projectId || this.browserbaseConfig.projectId,
        name: config?.name || "MCP Session",
        metadata: config?.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Browserbase API error: ${response.statusText}`);
    }

    return response.json();
  }

  async executeBrowserbaseAction(
    sessionId: string,
    action: {
      type: "navigate" | "click" | "type" | "screenshot" | "extract";
      selector?: string;
      text?: string;
      url?: string;
    },
  ) {
    if (!this.browserbaseConfig) {
      throw new Error("Browserbase not configured");
    }

    const response = await fetch(
      `https://api.browserbase.com/v1/sessions/${sessionId}/actions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.browserbaseConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
      },
    );

    if (!response.ok) {
      throw new Error(`Browserbase action error: ${response.statusText}`);
    }

    return response.json();
  }

  // E2B - Code execution sandbox
  async createE2BSandbox(config?: {
    templateId?: string;
    timeout?: number;
    metadata?: any;
  }) {
    if (!this.e2bConfig) {
      throw new Error("E2B not configured");
    }

    const response = await fetch("https://api.e2b.dev/v1/sandboxes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.e2bConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId: config?.templateId || this.e2bConfig.templateId,
        timeout: config?.timeout || this.e2bConfig.timeout,
        metadata: config?.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`E2B API error: ${response.statusText}`);
    }

    return response.json();
  }

  async executeE2BCode(
    sandboxId: string,
    code: string,
    language: "python" | "javascript" | "bash" = "python",
  ) {
    if (!this.e2bConfig) {
      throw new Error("E2B not configured");
    }

    const response = await fetch(
      `https://api.e2b.dev/v1/sandboxes/${sandboxId}/code`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.e2bConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      },
    );

    if (!response.ok) {
      throw new Error(`E2B code execution error: ${response.statusText}`);
    }

    return response.json();
  }

  // Mem0 - Memory management
  async addMem0Memory(memory: {
    text: string;
    metadata?: any;
    collectionId?: string;
  }) {
    if (!this.mem0Config) {
      throw new Error("Mem0 not configured");
    }

    const response = await fetch(`${this.mem0Config.baseUrl}/memories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.mem0Config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...memory,
        collectionId: memory.collectionId || this.mem0Config.collectionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mem0 API error: ${response.statusText}`);
    }

    return response.json();
  }

  async searchMem0Memories(
    query: string,
    options?: {
      limit?: number;
      collectionId?: string;
      metadata?: any;
    },
  ) {
    if (!this.mem0Config) {
      throw new Error("Mem0 not configured");
    }

    const params = new URLSearchParams({
      query,
      limit: (options?.limit || 10).toString(),
      ...(options?.collectionId && { collectionId: options.collectionId }),
    });

    const response = await fetch(
      `${this.mem0Config.baseUrl}/memories/search?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.mem0Config.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Mem0 search error: ${response.statusText}`);
    }

    return response.json();
  }

  // Firecrawl - Web scraping
  async scrapeFirecrawlUrl(
    url: string,
    options?: {
      maxDepth?: number;
      includeHtml?: boolean;
      includeMarkdown?: boolean;
      includeScreenshot?: boolean;
    },
  ) {
    if (!this.firecrawlConfig) {
      throw new Error("Firecrawl not configured");
    }

    const response = await fetch(`${this.firecrawlConfig.baseUrl}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.firecrawlConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        maxDepth: options?.maxDepth || this.firecrawlConfig.maxDepth,
        includeHtml: options?.includeHtml || false,
        includeMarkdown: options?.includeMarkdown || true,
        includeScreenshot: options?.includeScreenshot || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.statusText}`);
    }

    return response.json();
  }

  async crawlFirecrawlSite(
    url: string,
    options?: {
      maxDepth?: number;
      includeHtml?: boolean;
      includeMarkdown?: boolean;
      includeScreenshot?: boolean;
      limit?: number;
    },
  ) {
    if (!this.firecrawlConfig) {
      throw new Error("Firecrawl not configured");
    }

    const response = await fetch(`${this.firecrawlConfig.baseUrl}/crawl`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.firecrawlConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        maxDepth: options?.maxDepth || this.firecrawlConfig.maxDepth,
        includeHtml: options?.includeHtml || false,
        includeMarkdown: options?.includeMarkdown || true,
        includeScreenshot: options?.includeScreenshot || false,
        limit: options?.limit || 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl crawl error: ${response.statusText}`);
    }

    return response.json();
  }

  // Utility methods
  getAvailableServices() {
    return {
      deerFlow: !!this.deerFlowConfig,
      browserbase: !!this.browserbaseConfig,
      e2b: !!this.e2bConfig,
      mem0: !!this.mem0Config,
      firecrawl: !!this.firecrawlConfig,
    };
  }

  async healthCheck() {
    const services = this.getAvailableServices();
    const results: Record<string, boolean> = {};

    for (const [service, available] of Object.entries(services)) {
      if (available) {
        try {
          // Simple health check for each service
          switch (service) {
            case "deerFlow":
              await fetch(
                `${this.deerFlowConfig?.baseUrl || "https://api.deerflow.ai"}/health`,
                {
                  headers: {
                    Authorization: `Bearer ${this.deerFlowConfig?.apiKey}`,
                  },
                },
              );
              results[service] = true;
              break;
            case "browserbase":
              await fetch("https://api.browserbase.com/v1/health", {
                headers: {
                  Authorization: `Bearer ${this.browserbaseConfig?.apiKey}`,
                },
              });
              results[service] = true;
              break;
            case "e2b":
              await fetch("https://api.e2b.dev/v1/health", {
                headers: { Authorization: `Bearer ${this.e2bConfig?.apiKey}` },
              });
              results[service] = true;
              break;
            case "mem0":
              await fetch(`${this.mem0Config?.baseUrl}/health`, {
                headers: { Authorization: `Bearer ${this.mem0Config?.apiKey}` },
              });
              results[service] = true;
              break;
            case "firecrawl":
              await fetch(`${this.firecrawlConfig?.baseUrl}/health`, {
                headers: {
                  Authorization: `Bearer ${this.firecrawlConfig?.apiKey}`,
                },
              });
              results[service] = true;
              break;
          }
        } catch {
          results[service] = false;
        }
      } else {
        results[service] = false;
      }
    }

    return results;
  }
}

export const advancedMCPServices = new AdvancedMCPServices();
