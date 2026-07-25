import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apikeys";
import { createBot, listBots, updateBot } from "@/lib/bots";
import { orgStats } from "@/lib/analytics";
import { assertHttpUrl } from "@/lib/ssrf";

export const runtime = "nodejs";

// Minimal MCP (Model Context Protocol) server over Streamable HTTP. Lets Claude
// Desktop / Cursor manage a workspace's bots, authenticated by a Chatnode API
// key sent as `Authorization: Bearer sk_...` (or `X-API-Key`).

const TOOLS = [
  { name: "list_bots", description: "List all chat bots in the workspace.", inputSchema: { type: "object", properties: {} } },
  {
    name: "create_bot",
    description: "Create a new chat bot that proxies to an n8n webhook.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        webhookUrl: { type: "string", description: "n8n Chat Trigger webhook URL" },
        welcome: { type: "string" },
        color: { type: "string", description: "hex color, e.g. #1c69d4" },
        allowAnonymous: { type: "boolean" },
      },
      required: ["name", "webhookUrl"],
    },
  },
  {
    name: "update_bot",
    description: "Update fields of an existing bot.",
    inputSchema: {
      type: "object",
      properties: {
        botId: { type: "string" },
        name: { type: "string" },
        webhookUrl: { type: "string" },
        welcome: { type: "string" },
        color: { type: "string" },
        allowAnonymous: { type: "boolean" },
      },
      required: ["botId"],
    },
  },
  { name: "get_analytics", description: "Get workspace usage stats.", inputSchema: { type: "object", properties: {} } },
];

function textResult(o: unknown) {
  return { content: [{ type: "text", text: typeof o === "string" ? o : JSON.stringify(o, null, 2) }] };
}

async function callTool(orgId: string, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "list_bots": {
      const bots = await listBots(orgId);
      return textResult(bots.map((b) => ({ id: b.id, name: b.name, allowAnonymous: b.allowAnonymous, webhookUrl: b.webhookUrl, ratePerSession: b.ratePerSession })));
    }
    case "create_bot": {
      const webhookUrl = String(args.webhookUrl);
      assertHttpUrl(webhookUrl);
      const b = await createBot(orgId, {
        name: String(args.name),
        webhookUrl,
        welcome: args.welcome ? String(args.welcome) : undefined,
        color: args.color ? String(args.color) : undefined,
        allowAnonymous: args.allowAnonymous === undefined ? true : Boolean(args.allowAnonymous),
        suggestedPrompts: [],
        allowedOrigins: [],
      });
      return textResult({ id: b.id, embed: `<script src="https://your-host/embed.js" data-bot="${b.id}" defer></script>` });
    }
    case "update_bot": {
      const patch: Record<string, unknown> = {};
      for (const k of ["name", "welcome", "color"] as const) if (args[k] !== undefined) patch[k] = String(args[k]);
      if (args.allowAnonymous !== undefined) patch.allowAnonymous = Boolean(args.allowAnonymous);
      if (args.webhookUrl !== undefined) {
        assertHttpUrl(String(args.webhookUrl));
        patch.webhookUrl = String(args.webhookUrl);
      }
      const b = await updateBot(orgId, String(args.botId), patch);
      return b ? textResult({ updated: true, id: b.id }) : { content: [{ type: "text", text: "Bot not found in your workspace." }], isError: true };
    }
    case "get_analytics":
      return textResult(await orgStats(orgId));
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  }
}

async function dispatch(orgId: string, method: string, params: Record<string, unknown> | undefined) {
  switch (method) {
    case "initialize":
      return { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "Chatnode", version: "1.0.0" } };
    case "ping":
      return {};
    case "tools/list":
      return { tools: TOOLS };
    case "tools/call":
      return callTool(orgId, String(params?.name), (params?.arguments as Record<string, unknown>) ?? {});
    default:
      return undefined;
  }
}

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const key = req.headers.get("x-api-key") ?? (auth.startsWith("Bearer ") ? auth.slice(7) : null);
  const orgId = await validateApiKey(key);

  let rpc: { id?: unknown; method?: string; params?: Record<string, unknown> };
  try {
    rpc = await req.json();
  } catch {
    return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
  const { id, method, params } = rpc;
  // notifications have no id and expect no response
  if (id === undefined || (typeof method === "string" && method.startsWith("notifications/"))) {
    return new NextResponse(null, { status: 202 });
  }
  if (!orgId) {
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32001, message: "Unauthorized: provide a Chatnode API key" } }, { status: 401 });
  }
  try {
    const result = await dispatch(orgId, String(method), params);
    if (result === undefined) {
      return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
    }
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (e) {
    console.error("[mcp] tool error", e);
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32000, message: "internal error" } });
  }
}