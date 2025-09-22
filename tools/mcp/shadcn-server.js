#!/usr/bin/env node
// Minimal MCP server exposing tools to add/list shadcn components by shelling out to the CLI.
// This is a pragmatic helper for MCP-compatible AI clients; it does not run in production.
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { z } from "zod"
import { execa } from "execa"

const server = new Server({ name: "shadcn-mcp", version: "0.1.0" })

server.tool(
  "shadcn.add",
  "Add one or more shadcn/ui components",
  {
    components: z.array(z.string()),
  },
  async ({ components }) => {
    const args = ["shadcn", "add", ...components]
    const { stdout } = await execa("npx", args, { stdio: "pipe" })
    return { content: [{ type: "text", text: stdout }] }
  }
)

server.tool(
  "shadcn.list",
  "List available shadcn components",
  {},
  async () => {
    const { stdout } = await execa("npx", ["shadcn", "list"], { stdio: "pipe" })
    return { content: [{ type: "text", text: stdout }] }
  }
)

server.start()
