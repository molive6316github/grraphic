import React, { useState } from 'react';
import { 
  Book, Code, Key, BarChart3, MessageSquare, Image, User, 
  ChevronRight, Copy, Check, ExternalLink, Zap, Shield, Clock
} from 'lucide-react';

interface CodeExample {
  language: string;
  code: string;
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
  quota: boolean;
  params?: Array<{ name: string; type: string; required: boolean; description: string }>;
  body?: Array<{ name: string; type: string; required: boolean; description: string }>;
  response: string;
  examples: CodeExample[];
}

interface Props {
  onBack: () => void;
}

const methodColors = {
  GET: 'bg-green-500/20 text-green-400',
  POST: 'bg-blue-500/20 text-blue-400',
  PUT: 'bg-yellow-500/20 text-yellow-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

const endpoints: Record<string, Endpoint[]> = {
  authentication: [
    {
      method: 'GET',
      path: '/api/v1/account',
      description: 'Get current user account information',
      auth: true,
      quota: false,
      response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "tier": "free",
    "emailVerified": true,
    "twoFactorEnabled": false
  }
}`,
      examples: [
        { language: 'curl', code: `curl -X GET "https://api.grraphic.com/api/v1/account" \\
  -H "Authorization: Bearer YOUR_TOKEN"` },
        { language: 'javascript', code: `const response = await fetch('https://api.grraphic.com/api/v1/account', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
const data = await response.json();` },
        { language: 'python', code: `import requests

response = requests.get(
  'https://api.grraphic.com/api/v1/account',
  headers={'Authorization': 'Bearer YOUR_TOKEN'}
)
data = response.json()` }
      ]
    }
  ],
  'api-keys': [
    {
      method: 'GET',
      path: '/api/v1/keys',
      description: 'List all API keys for the authenticated user',
      auth: true,
      quota: false,
      response: `{
  "success": true,
  "data": [{
    "id": "uuid",
    "name": "Production",
    "key_prefix": "grphc_abc123...",
    "scopes": ["read", "write"],
    "is_active": true,
    "last_used_at": "2024-01-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }],
  "count": 1
}`,
      examples: [
        { language: 'curl', code: `curl -X GET "https://api.grraphic.com/api/v1/keys" \\
  -H "Authorization: Bearer YOUR_TOKEN"` },
        { language: 'javascript', code: `const response = await fetch('https://api.grraphic.com/api/v1/keys', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});` }
      ]
    },
    {
      method: 'POST',
      path: '/api/v1/keys',
      description: 'Create a new API key',
      auth: true,
      quota: false,
      body: [
        { name: 'name', type: 'string', required: true, description: 'Name for the API key' },
        { name: 'scopes', type: 'string[]', required: false, description: 'Permissions (default: ["read", "write"])' },
        { name: 'expiresIn', type: 'string', required: false, description: 'Expiration: "30d", "90d", "1y", or "never"' }
      ],
      response: `{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "id": "uuid",
    "name": "Production",
    "key": "grphc_abc123...",  // Only shown once!
    "key_prefix": "grphc_abc1...",
    "scopes": ["read", "write"],
    "expires_at": null
  }
}`,
      examples: [
        { language: 'curl', code: `curl -X POST "https://api.grraphic.com/api/v1/keys" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Production", "expiresIn": "90d"}'` }
      ]
    }
  ],
  analysis: [
    {
      method: 'POST',
      path: '/api/v1/analysis',
      description: 'Analyze a design from URL or base64 image',
      auth: true,
      quota: true,
      body: [
        { name: 'url', type: 'string', required: false, description: 'URL of the website/design to analyze' },
        { name: 'imageBase64', type: 'string', required: false, description: 'Base64 encoded image (alternative to URL)' },
        { name: 'saveResult', type: 'boolean', required: false, description: 'Save analysis to history (default: true)' }
      ],
      response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "analysis": {
      "overallScore": 85,
      "categories": {
        "layout": { "score": 90, "observations": [...], "suggestions": [...] },
        "color": { "score": 80, ... },
        "typography": { "score": 85, ... }
      },
      "summary": "Well-designed interface with strong visual hierarchy",
      "topStrengths": ["Clear navigation", "Consistent spacing"],
      "topImprovements": ["Increase contrast", "Optimize mobile view"]
    }
  }
}`,
      examples: [
        { language: 'curl', code: `curl -X POST "https://api.grraphic.com/api/v1/analysis" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'` },
        { language: 'javascript', code: `const response = await fetch('https://api.grraphic.com/api/v1/analysis', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url: 'https://example.com' })
});` }
      ]
    }
  ],
  gradi: [
    {
      method: 'POST',
      path: '/api/v1/gradi/chat',
      description: 'Send a message to Gradi AI assistant',
      auth: true,
      quota: true,
      body: [
        { name: 'message', type: 'string', required: true, description: 'User message to send' },
        { name: 'conversationHistory', type: 'array', required: false, description: 'Previous messages for context' },
        { name: 'sessionId', type: 'string', required: false, description: 'Session ID to save messages' }
      ],
      response: `{
  "success": true,
  "data": {
    "message": "Here's my response...",
    "role": "assistant",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}`,
      examples: [
        { language: 'curl', code: `curl -X POST "https://api.grraphic.com/api/v1/gradi/chat" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "How do I improve my website color scheme?"}'` },
        { language: 'python', code: `import requests

response = requests.post(
  'https://api.grraphic.com/api/v1/gradi/chat',
  headers={'X-API-Key': 'YOUR_API_KEY'},
  json={'message': 'How do I improve my website color scheme?'}
)
print(response.json()['data']['message'])` }
      ]
    }
  ],
  usage: [
    {
      method: 'GET',
      path: '/api/v1/usage',
      description: 'Get current API usage statistics',
      auth: true,
      quota: false,
      response: `{
  "success": true,
  "data": {
    "tier": "free",
    "today": {
      "date": "2024-01-01",
      "usage": {
        "analysis": { "used": 1, "limit": 1, "remaining": 0 },
        "gradi": { "used": 5, "limit": 10, "remaining": 5 }
      },
      "resetsAt": "2024-01-02T00:00:00Z"
    },
    "totals": { "last7Days": 42, "last30Days": 156 }
  }
}`,
      examples: [
        { language: 'curl', code: `curl -X GET "https://api.grraphic.com/api/v1/usage" \\
  -H "X-API-Key: YOUR_API_KEY"` }
      ]
    }
  ]
};

export function ApiDocs({ onBack }: Props) {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Record<string, string>>({});

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'analysis', label: 'Design Analysis', icon: Image },
    { id: 'gradi', label: 'Gradi AI', icon: MessageSquare },
    { id: 'usage', label: 'Usage & Limits', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-r border-white/10 p-6 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-white">
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">API Docs</h1>
        </div>
        
        <nav className="space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
        </nav>

        <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-sm font-semibold text-white mb-2">Base URL</h4>
          <code className="text-xs text-blue-400 break-all">https://api.grraphic.com</code>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Overview */}
        {activeSection === 'overview' && (
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-4">Grraphic API</h2>
            <p className="text-gray-300 text-lg mb-8">
              Build powerful design tools with the Grraphic API. Analyze designs, chat with Gradi AI, 
              and integrate professional design feedback into your applications.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <Zap className="text-yellow-400 mb-4" size={32} />
                <h3 className="text-lg font-semibold text-white mb-2">Fast & Reliable</h3>
                <p className="text-gray-400 text-sm">Low latency responses with 99.9% uptime SLA for Pro users.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <Shield className="text-green-400 mb-4" size={32} />
                <h3 className="text-lg font-semibold text-white mb-2">Secure</h3>
                <p className="text-gray-400 text-sm">API key authentication with scoped permissions and rate limiting.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <Clock className="text-blue-400 mb-4" size={32} />
                <h3 className="text-lg font-semibold text-white mb-2">Daily Quotas</h3>
                <p className="text-gray-400 text-sm">Generous free tier with daily limits that reset at midnight UTC.</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">Rate Limits</h3>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Tier</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Analysis/Day</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Gradi/Day</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Site Designer/Day</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-400">Rate Limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="px-6 py-4 text-white">Free</td>
                    <td className="px-6 py-4 text-gray-300">1</td>
                    <td className="px-6 py-4 text-gray-300">10 messages</td>
                    <td className="px-6 py-4 text-gray-300">2</td>
                    <td className="px-6 py-4 text-gray-300">10 req/min</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-white">Pro</td>
                    <td className="px-6 py-4 text-green-400">Unlimited</td>
                    <td className="px-6 py-4 text-green-400">Unlimited</td>
                    <td className="px-6 py-4 text-green-400">Unlimited</td>
                    <td className="px-6 py-4 text-gray-300">100 req/min</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-white mb-4">Quick Start</h3>
            <div className="bg-slate-800 rounded-xl p-6 border border-white/10">
              <pre className="text-sm text-gray-300 overflow-x-auto">
{`# 1. Get your API key from the dashboard
# 2. Make your first request

curl -X POST "https://api.grraphic.com/api/v1/gradi/chat" \\
  -H "X-API-Key: grphc_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "What makes a good landing page design?"}'`}
              </pre>
            </div>
          </div>
        )}

        {/* Endpoint Sections */}
        {endpoints[activeSection] && (
          <div className="max-w-4xl space-y-8">
            <h2 className="text-3xl font-bold text-white mb-2 capitalize">
              {activeSection.replace('-', ' ')}
            </h2>
            <p className="text-gray-400 mb-8">
              {activeSection === 'authentication' && 'Authenticate requests using Bearer tokens or API keys.'}
              {activeSection === 'api-keys' && 'Manage your API keys for programmatic access.'}
              {activeSection === 'analysis' && 'Analyze designs and get detailed feedback.'}
              {activeSection === 'gradi' && 'Chat with Gradi AI for design assistance.'}
              {activeSection === 'usage' && 'Monitor your API usage and quotas.'}
            </p>

            {endpoints[activeSection].map((endpoint, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold ${methodColors[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-white font-mono">{endpoint.path}</code>
                    {endpoint.auth && <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">Auth Required</span>}
                    {endpoint.quota && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Quota Limited</span>}
                  </div>
                  <p className="text-gray-300">{endpoint.description}</p>
                </div>

                {endpoint.body && (
                  <div className="p-6 border-b border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3">Request Body</h4>
                    <div className="space-y-2">
                      {endpoint.body.map(param => (
                        <div key={param.name} className="flex items-start gap-3 text-sm">
                          <code className="text-blue-400 min-w-[120px]">{param.name}</code>
                          <span className="text-gray-500">{param.type}</span>
                          {param.required && <span className="text-red-400 text-xs">required</span>}
                          <span className="text-gray-400">{param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 border-b border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Response</h4>
                  <pre className="bg-slate-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                    {endpoint.response}
                  </pre>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">Examples</h4>
                    <div className="flex gap-2">
                      {endpoint.examples.map(ex => (
                        <button
                          key={ex.language}
                          onClick={() => setSelectedLanguage({ ...selectedLanguage, [idx]: ex.language })}
                          className={`px-3 py-1 rounded text-xs transition-colors ${
                            (selectedLanguage[idx] || endpoint.examples[0].language) === ex.language
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {ex.language}
                        </button>
                      ))}
                    </div>
                  </div>
                  {endpoint.examples.map(ex => (
                    (selectedLanguage[idx] || endpoint.examples[0].language) === ex.language && (
                      <div key={ex.language} className="relative">
                        <pre className="bg-slate-800 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                          {ex.code}
                        </pre>
                        <button
                          onClick={() => copyCode(ex.code, `${idx}-${ex.language}`)}
                          className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          {copiedCode === `${idx}-${ex.language}` 
                            ? <Check className="text-green-400" size={16} /> 
                            : <Copy className="text-gray-400" size={16} />}
                        </button>
                      </div>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
