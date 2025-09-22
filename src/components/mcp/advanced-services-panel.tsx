"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "ui/card";
import { Button } from "ui/button";
import { Badge } from "ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "ui/select";
import { Alert, AlertDescription } from "ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Globe,
  Code,
  Brain,
  Scissors,
  Zap,
} from "lucide-react";

interface ServiceStatus {
  deerFlow: boolean;
  browserbase: boolean;
  e2b: boolean;
  mem0: boolean;
  firecrawl: boolean;
}

interface AdvancedServicesPanelProps {
  onToolExecute?: (toolName: string, parameters: any) => Promise<any>;
}

export function AdvancedServicesPanel({
  onToolExecute,
}: AdvancedServicesPanelProps) {
  const [services, setServices] = useState<ServiceStatus | null>(null);
  const [health, setHealth] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const [servicesRes, healthRes] = await Promise.all([
        fetch("/api/mcp/advanced?action=services"),
        fetch("/api/mcp/advanced?action=health"),
      ]);

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData.health);
      }
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setLoading(false);
    }
  };

  const executeTool = async (toolName: string, parameters: any) => {
    setExecuting(toolName);
    try {
      const response = await fetch("/api/mcp/advanced/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolName, parameters }),
      });

      const result = await response.json();
      setResults((prev) => ({ ...prev, [toolName]: result }));

      if (onToolExecute) {
        await onToolExecute(toolName, parameters);
      }
    } catch (error) {
      console.error("Tool execution failed:", error);
      setResults((prev) => ({
        ...prev,
        [toolName]: { error: "Execution failed" },
      }));
    } finally {
      setExecuting(null);
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "deerFlow":
        return <Zap className="h-4 w-4" />;
      case "browserbase":
        return <Globe className="h-4 w-4" />;
      case "e2b":
        return <Code className="h-4 w-4" />;
      case "mem0":
        return <Brain className="h-4 w-4" />;
      case "firecrawl":
        return <Scissors className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getServiceStatus = (service: keyof ServiceStatus) => {
    if (!services || !health) return "unknown";
    if (!services[service]) return "unavailable";
    if (health[service]) return "healthy";
    return "unhealthy";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Healthy
          </Badge>
        );
      case "unhealthy":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Unhealthy
          </Badge>
        );
      case "unavailable":
        return <Badge variant="secondary">Unavailable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advanced MCP Services</CardTitle>
          <CardDescription>Loading service status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced MCP Services</CardTitle>
        <CardDescription>
          Integrated services for enhanced AI capabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {services &&
                Object.entries(services).map(([service, _available]) => (
                  <div
                    key={service}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getServiceIcon(service)}
                      <div>
                        <h3 className="font-medium capitalize">{service}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service === "deerFlow" &&
                            "Workflow automation and orchestration"}
                          {service === "browserbase" &&
                            "Browser automation and testing"}
                          {service === "e2b" && "Secure code execution sandbox"}
                          {service === "mem0" &&
                            "Intelligent memory management"}
                          {service === "firecrawl" &&
                            "Web scraping and crawling"}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(
                      getServiceStatus(service as keyof ServiceStatus),
                    )}
                  </div>
                ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={loadServices} variant="outline" size="sm">
                Refresh Status
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <div className="space-y-6">
              {/* DeerFlow Tools */}
              {services?.deerFlow && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    DeerFlow - Workflow Automation
                  </h3>

                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Create Workflow</h4>
                      <div className="space-y-2">
                        <Input placeholder="Workflow name" id="workflow-name" />
                        <Textarea
                          placeholder="Workflow description"
                          id="workflow-desc"
                        />
                        <Button
                          onClick={() =>
                            executeTool("deerflow_create_workflow", {
                              name: (
                                document.getElementById(
                                  "workflow-name",
                                ) as HTMLInputElement
                              )?.value,
                              description: (
                                document.getElementById(
                                  "workflow-desc",
                                ) as HTMLTextAreaElement
                              )?.value,
                              steps: [],
                            })
                          }
                          disabled={executing === "deerflow_create_workflow"}
                          size="sm"
                        >
                          {executing === "deerflow_create_workflow" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Create Workflow
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Browserbase Tools */}
              {services?.browserbase && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Browserbase - Browser Automation
                  </h3>

                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Create Session</h4>
                      <div className="space-y-2">
                        <Input placeholder="Session name" id="session-name" />
                        <Button
                          onClick={() =>
                            executeTool("browserbase_create_session", {
                              name:
                                (
                                  document.getElementById(
                                    "session-name",
                                  ) as HTMLInputElement
                                )?.value || "MCP Session",
                            })
                          }
                          disabled={executing === "browserbase_create_session"}
                          size="sm"
                        >
                          {executing === "browserbase_create_session" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Create Session
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Navigate to URL</h4>
                      <div className="space-y-2">
                        <Input placeholder="Session ID" id="nav-session-id" />
                        <Input placeholder="URL to navigate to" id="nav-url" />
                        <Button
                          onClick={() =>
                            executeTool("browserbase_navigate", {
                              sessionId: (
                                document.getElementById(
                                  "nav-session-id",
                                ) as HTMLInputElement
                              )?.value,
                              url: (
                                document.getElementById(
                                  "nav-url",
                                ) as HTMLInputElement
                              )?.value,
                            })
                          }
                          disabled={executing === "browserbase_navigate"}
                          size="sm"
                        >
                          {executing === "browserbase_navigate" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Navigate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* E2B Tools */}
              {services?.e2b && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    E2B - Code Execution
                  </h3>

                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Create Sandbox</h4>
                      <div className="space-y-2">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="node">Node.js</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() =>
                            executeTool("e2b_create_sandbox", {
                              templateId: "base",
                            })
                          }
                          disabled={executing === "e2b_create_sandbox"}
                          size="sm"
                        >
                          {executing === "e2b_create_sandbox" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Create Sandbox
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Execute Python Code</h4>
                      <div className="space-y-2">
                        <Input
                          placeholder="Sandbox ID"
                          id="python-sandbox-id"
                        />
                        <Textarea
                          placeholder="Python code to execute"
                          id="python-code"
                        />
                        <Button
                          onClick={() =>
                            executeTool("e2b_execute_python", {
                              sandboxId: (
                                document.getElementById(
                                  "python-sandbox-id",
                                ) as HTMLInputElement
                              )?.value,
                              code: (
                                document.getElementById(
                                  "python-code",
                                ) as HTMLTextAreaElement
                              )?.value,
                            })
                          }
                          disabled={executing === "e2b_execute_python"}
                          size="sm"
                        >
                          {executing === "e2b_execute_python" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Execute Python
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mem0 Tools */}
              {services?.mem0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Mem0 - Memory Management
                  </h3>

                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Add Memory</h4>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Memory text to store"
                          id="memory-text"
                        />
                        <Button
                          onClick={() =>
                            executeTool("mem0_add_memory", {
                              text: (
                                document.getElementById(
                                  "memory-text",
                                ) as HTMLTextAreaElement
                              )?.value,
                            })
                          }
                          disabled={executing === "mem0_add_memory"}
                          size="sm"
                        >
                          {executing === "mem0_add_memory" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Add Memory
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Search Memories</h4>
                      <div className="space-y-2">
                        <Input placeholder="Search query" id="memory-search" />
                        <Button
                          onClick={() =>
                            executeTool("mem0_search_memories", {
                              query: (
                                document.getElementById(
                                  "memory-search",
                                ) as HTMLInputElement
                              )?.value,
                            })
                          }
                          disabled={executing === "mem0_search_memories"}
                          size="sm"
                        >
                          {executing === "mem0_search_memories" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Search
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Firecrawl Tools */}
              {services?.firecrawl && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    Firecrawl - Web Scraping
                  </h3>

                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Scrape URL</h4>
                      <div className="space-y-2">
                        <Input placeholder="URL to scrape" id="scrape-url" />
                        <Button
                          onClick={() =>
                            executeTool("firecrawl_scrape_url", {
                              url: (
                                document.getElementById(
                                  "scrape-url",
                                ) as HTMLInputElement
                              )?.value,
                              includeMarkdown: true,
                            })
                          }
                          disabled={executing === "firecrawl_scrape_url"}
                          size="sm"
                        >
                          {executing === "firecrawl_scrape_url" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Scrape URL
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Crawl Website</h4>
                      <div className="space-y-2">
                        <Input placeholder="Base URL to crawl" id="crawl-url" />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Max depth"
                            type="number"
                            id="crawl-depth"
                            defaultValue="3"
                          />
                          <Input
                            placeholder="Page limit"
                            type="number"
                            id="crawl-limit"
                            defaultValue="100"
                          />
                        </div>
                        <Button
                          onClick={() =>
                            executeTool("firecrawl_crawl_site", {
                              url: (
                                document.getElementById(
                                  "crawl-url",
                                ) as HTMLInputElement
                              )?.value,
                              maxDepth: parseInt(
                                (
                                  document.getElementById(
                                    "crawl-depth",
                                  ) as HTMLInputElement
                                )?.value || "3",
                              ),
                              limit: parseInt(
                                (
                                  document.getElementById(
                                    "crawl-limit",
                                  ) as HTMLInputElement
                                )?.value || "100",
                              ),
                              includeMarkdown: true,
                            })
                          }
                          disabled={executing === "firecrawl_crawl_site"}
                          size="sm"
                        >
                          {executing === "firecrawl_crawl_site" && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Crawl Site
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Display */}
            {Object.keys(results).length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Execution Results
                </h3>
                <div className="space-y-4">
                  {Object.entries(results).map(([toolName, result]) => (
                    <Alert key={toolName}>
                      <AlertDescription>
                        <div className="font-medium mb-2">{toolName}</div>
                        <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
