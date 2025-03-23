"use client"
import React from "react";
import {
  Webhook,
  GitBranch,
  Globe,
  Bot,
  Copy,
  Check,
  AlertCircle,
  Lock,
} from "lucide-react";

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  status: "active" | "inactive";
  lastDelivery?: string;
  successRate?: number;
}

export const IntegrationSettings = () => {
  const [webhooks, setWebhooks] = React.useState<WebhookConfig[]>([
    {
      id: "1",
      name: "GitHub Integration",
      url: "https://api.github.com/webhooks/123",
      secret: "whsec_abcdef123456",
      status: "active",
      lastDelivery: "2 minutes ago",
      successRate: 98,
    },
  ]);

  const [copied, setCopied] = React.useState<string | null>(null);
  const [showNewWebhook, setShowNewWebhook] = React.useState(false);
  const [newWebhook, setNewWebhook] = React.useState({
    name: "",
    url: "",
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAddWebhook = () => {
    if (newWebhook.name && newWebhook.url) {
      const webhook: WebhookConfig = {
        id: Date.now().toString(),
        name: newWebhook.name,
        url: newWebhook.url,
        secret: `whsec_${Math.random().toString(36).substr(2, 10)}`,
        status: "active",
      };
      setWebhooks([...webhooks, webhook]);
      setNewWebhook({ name: "", url: "" });
      setShowNewWebhook(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Integrations & Webhooks</h2>
        <button
          onClick={() => setShowNewWebhook(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80 flex items-center gap-2"
        >
          <Webhook className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Webhook Information */}
        <div className="p-4 bg-secondary rounded-lg border border-border">
          <div className="flex items-start gap-3 mb-4">
            <Bot className="w-5 h-5 text-indigo-400 mt-1" />
            <div>
              <h3 className="font-medium">Smart Webhook Processing</h3>
              <p className="text-sm text-gray-400 mt-1">
                Our AI automatically identifies and categorizes incoming webhook
                data based on the source domain and payload structure. This
                enables automatic task creation, updates, and intelligent
                routing of information.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            {[
              {
                icon: <Globe className="w-4 h-4 text-blue-400" />,
                title: "Auto-Detection",
                description: "Automatically identifies webhook sources",
              },
              {
                icon: <GitBranch className="w-4 h-4 text-green-400" />,
                title: "Smart Routing",
                description: "Routes data to appropriate project sections",
              },
              {
                icon: <Bot className="w-4 h-4 text-purple-400" />,
                title: "AI Processing",
                description: "Extracts context and creates relevant tasks",
              },
            ].map((feature, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {feature.icon}
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                </div>
                <p className="text-xs text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Webhooks */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Active Webhooks</h3>
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="p-4 bg-secondary rounded-lg border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium">{webhook.name}</h4>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      webhook.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {webhook.status}
                  </span>
                </div>
                <button className="p-2 hover:bg-muted rounded-md text-red-400">
                  Delete
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{webhook.url}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(webhook.url, `url-${webhook.id}`)}
                    className="p-1.5 hover:bg-border rounded-md"
                  >
                    {copied === `url-${webhook.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-mono">{webhook.secret}</span>
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(webhook.secret, `secret-${webhook.id}`)
                    }
                    className="p-1.5 hover:bg-border rounded-md"
                  >
                    {copied === `secret-${webhook.id}` ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {webhook.lastDelivery && (
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Last delivery: {webhook.lastDelivery}</span>
                    <span>Success rate: {webhook.successRate}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add New Webhook Modal */}
        {showNewWebhook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-muted rounded-lg p-6 w-[500px]">
              <h3 className="text-lg font-semibold mb-4">Add New Webhook</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Webhook Name
                  </label>
                  <input
                    type="text"
                    value={newWebhook.name}
                    onChange={(e) =>
                      setNewWebhook({ ...newWebhook, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., GitHub Integration"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) =>
                      setNewWebhook({ ...newWebhook, url: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-muted border border-border rounded-md focus:outline-none focus:border-indigo-500"
                    placeholder="https://"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowNewWebhook(false)}
                    className="px-4 py-2 bg-muted text-gray-400 rounded-md hover:bg-border"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddWebhook}
                    className="px-4 py-2 bg-primary text-foreground rounded-md hover:bg-primary/80"
                  >
                    Add Webhook
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
