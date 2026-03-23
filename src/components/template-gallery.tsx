"use client";

import { useState, useEffect, useMemo } from "react";
import { useEditorStore, AgentBlockDescription, Block } from "@/store/editor-store";

// ── Types ──
export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  blocks: AgentBlockDescription[];
  builtIn?: boolean;
}

const CUSTOM_TEMPLATES_KEY = "ui-creator-custom-templates";

function loadCustomTemplates(): Template[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomTemplates(templates: Template[]) {
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
}

function serializeBlocks(blocks: Record<string, Block>, rootIds: string[]): AgentBlockDescription[] {
  function serialize(blockId: string): AgentBlockDescription {
    const b = blocks[blockId];
    if (!b) return { type: "text", props: {} };
    const desc: AgentBlockDescription = { type: b.type, props: { ...b.props } };
    if (b.children.length > 0) desc.children = b.children.map(serialize);
    return desc;
  }
  return rootIds.map(serialize);
}

function countBlocks(blocks: AgentBlockDescription[]): number {
  return blocks.reduce((acc, b) => acc + 1 + countBlocks(b.children || []), 0);
}

// ── Constants ──
const ICON_OPTIONS = ["◆", "◈", "◇", "⊞", "◉", "▦", "⬡", "⬢", "△", "▽", "☆", "♦", "⊡", "⊠", "✦", "❋", "⬟", "⬠"];
const COLOR_OPTIONS = [
  { value: "purple", from: "#7c6af7", to: "#e879f9", bg: "linear-gradient(135deg,rgba(124,106,247,0.18),rgba(232,121,249,0.12))" },
  { value: "teal",   from: "#22d3a0", to: "#06b6d4", bg: "linear-gradient(135deg,rgba(34,211,160,0.18),rgba(6,182,212,0.12))" },
  { value: "amber",  from: "#fbbf24", to: "#f97316", bg: "linear-gradient(135deg,rgba(251,191,36,0.18),rgba(249,115,22,0.12))" },
  { value: "blue",   from: "#60a5fa", to: "#818cf8", bg: "linear-gradient(135deg,rgba(96,165,250,0.18),rgba(129,140,248,0.12))" },
  { value: "rose",   from: "#fb7185", to: "#f43f5e", bg: "linear-gradient(135deg,rgba(251,113,133,0.18),rgba(244,63,94,0.12))" },
  { value: "green",  from: "#4ade80", to: "#22d3a0", bg: "linear-gradient(135deg,rgba(74,222,128,0.18),rgba(34,211,160,0.12))" },
  { value: "orange", from: "#fb923c", to: "#fbbf24", bg: "linear-gradient(135deg,rgba(251,146,60,0.18),rgba(251,191,36,0.12))" },
  { value: "indigo", from: "#a78bfa", to: "#60a5fa", bg: "linear-gradient(135deg,rgba(167,139,250,0.18),rgba(96,165,250,0.12))" },
];

const CATEGORIES = ["All", "Marketing", "Dashboard", "Forms", "Profile", "E-commerce", "Content", "AI Agent"];

// ── Built-in templates ──
const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "hero-landing",
    name: "Hero Landing",
    description: "Full-width hero with headline, subtext, and CTA buttons",
    icon: "◆",
    color: "purple",
    category: "Marketing",
    builtIn: true,
    blocks: [
      {
        type: "container",
        props: { padding: "64px", bgColor: "#0f0f1a", align: "center" },
        children: [
          { type: "badge", props: { text: "New · Now available", bgColor: "#1a1040", textColor: "#a78bfa" } },
          { type: "heading", props: { text: "Build beautiful UIs faster", level: 1, align: "center", textColor: "#ffffff" } },
          { type: "text", props: { text: "The visual editor that turns ideas into polished interfaces in minutes.", align: "center", textColor: "#94a3b8" } },
          {
            type: "flex-row",
            props: { justify: "center", gap: 12 },
            children: [
              { type: "button", props: { text: "Get started free", variant: "primary" } },
              { type: "button", props: { text: "See demo", variant: "ghost" } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pricing-cards",
    name: "Pricing Cards",
    description: "Three-tier pricing layout with feature lists",
    icon: "♦",
    color: "teal",
    category: "Marketing",
    builtIn: true,
    blocks: [
      {
        type: "container",
        props: { padding: "48px", align: "center" },
        children: [
          { type: "heading", props: { text: "Simple, transparent pricing", level: 2, align: "center" } },
          { type: "text", props: { text: "Choose the plan that works for you.", align: "center", textColor: "#94a3b8" } },
          {
            type: "flex-row",
            props: { justify: "center", gap: 16 },
            children: [
              {
                type: "card",
                props: { padding: "24px", borderRadius: "12px" },
                children: [
                  { type: "heading", props: { text: "Starter", level: 3 } },
                  { type: "heading", props: { text: "$9/mo", level: 2 } },
                  { type: "text", props: { text: "Perfect for individuals" } },
                  { type: "button", props: { text: "Get started", variant: "ghost" } },
                ],
              },
              {
                type: "card",
                props: { padding: "24px", borderRadius: "12px", bgColor: "#1a0a3a" },
                children: [
                  { type: "badge", props: { text: "Popular", bgColor: "#7c3aed", textColor: "#fff" } },
                  { type: "heading", props: { text: "Pro", level: 3 } },
                  { type: "heading", props: { text: "$29/mo", level: 2 } },
                  { type: "text", props: { text: "For growing teams" } },
                  { type: "button", props: { text: "Get started", variant: "primary" } },
                ],
              },
              {
                type: "card",
                props: { padding: "24px", borderRadius: "12px" },
                children: [
                  { type: "heading", props: { text: "Enterprise", level: 3 } },
                  { type: "heading", props: { text: "Custom", level: 2 } },
                  { type: "text", props: { text: "For large organizations" } },
                  { type: "button", props: { text: "Contact us", variant: "ghost" } },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Stats grid with metric cards and activity feed",
    icon: "▦",
    color: "blue",
    category: "Dashboard",
    builtIn: true,
    blocks: [
      {
        type: "container",
        props: { padding: "24px" },
        children: [
          { type: "heading", props: { text: "Dashboard", level: 2 } },
          {
            type: "grid",
            props: { cols: 4, gap: 12 },
            children: [
              { type: "card", props: { padding: "20px" }, children: [{ type: "text", props: { text: "Total Users", textColor: "#94a3b8", fontSize: "12px" } }, { type: "heading", props: { text: "24,521", level: 2 } }] },
              { type: "card", props: { padding: "20px" }, children: [{ type: "text", props: { text: "Revenue", textColor: "#94a3b8", fontSize: "12px" } }, { type: "heading", props: { text: "$84,200", level: 2 } }] },
              { type: "card", props: { padding: "20px" }, children: [{ type: "text", props: { text: "Conversions", textColor: "#94a3b8", fontSize: "12px" } }, { type: "heading", props: { text: "3.6%", level: 2 } }] },
              { type: "card", props: { padding: "20px" }, children: [{ type: "text", props: { text: "Active Now", textColor: "#94a3b8", fontSize: "12px" } }, { type: "heading", props: { text: "1,204", level: 2 } }] },
            ],
          },
          {
            type: "flex-row",
            props: { gap: 16 },
            children: [
              { type: "card", props: { padding: "20px", width: "66%" }, children: [{ type: "heading", props: { text: "Activity Overview", level: 3 } }, { type: "text", props: { text: "Chart placeholder — connect your data source", textColor: "#94a3b8" } }] },
              { type: "card", props: { padding: "20px" }, children: [{ type: "heading", props: { text: "Top Pages", level: 3 } }, { type: "text", props: { text: "/home · 8,432 visits" } }, { type: "text", props: { text: "/pricing · 4,210 visits" } }, { type: "text", props: { text: "/docs · 2,981 visits" } }] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Clean contact form with name, email, message fields",
    icon: "⊡",
    color: "green",
    category: "Forms",
    builtIn: true,
    blocks: [
      {
        type: "container",
        props: { padding: "48px", align: "center" },
        children: [
          { type: "heading", props: { text: "Get in touch", level: 2, align: "center" } },
          { type: "text", props: { text: "We'd love to hear from you. Fill out the form below.", align: "center", textColor: "#94a3b8" } },
          {
            type: "card",
            props: { padding: "32px", borderRadius: "16px", width: "480px" },
            children: [
              { type: "text", props: { text: "Name", fontWeight: "600", fontSize: "13px" } },
              { type: "input", props: { placeholder: "Your full name" } },
              { type: "text", props: { text: "Email", fontWeight: "600", fontSize: "13px" } },
              { type: "input", props: { placeholder: "you@example.com" } },
              { type: "text", props: { text: "Message", fontWeight: "600", fontSize: "13px" } },
              { type: "input", props: { placeholder: "Your message..." } },
              { type: "button", props: { text: "Send message", variant: "primary" } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "user-profile",
    name: "User Profile",
    description: "Profile card with avatar, bio, stats, and social links",
    icon: "◉",
    color: "rose",
    category: "Profile",
    builtIn: true,
    blocks: [
      {
        type: "container",
        props: { padding: "32px", align: "center" },
        children: [
          {
            type: "card",
            props: { padding: "32px", borderRadius: "20px", align: "center", width: "360px" },
            children: [
              { type: "avatar", props: { text: "JD", bgColor: "#7c3aed", textColor: "#fff" } },
              { type: "heading", props: { text: "Jane Doe", level: 3, align: "center" } },
              { type: "text", props: { text: "Product Designer · San Francisco", align: "center", textColor: "#94a3b8", fontSize: "13px" } },
              { type: "text", props: { text: "Crafting beautiful digital experiences with a focus on simplicity and user delight.", align: "center", fontSize: "13px" } },
              {
                type: "flex-row",
                props: { justify: "center", gap: 24 },
                children: [
                  { type: "card", props: { padding: "12px 20px", align: "center" }, children: [{ type: "heading", props: { text: "128", level: 3, align: "center" } }, { type: "text", props: { text: "Projects", textColor: "#94a3b8", fontSize: "12px" } }] },
                  { type: "card", props: { padding: "12px 20px", align: "center" }, children: [{ type: "heading", props: { text: "4.9k", level: 3, align: "center" } }, { type: "text", props: { text: "Followers", textColor: "#94a3b8", fontSize: "12px" } }] },
                  { type: "card", props: { padding: "12px 20px", align: "center" }, children: [{ type: "heading", props: { text: "312", level: 3, align: "center" } }, { type: "text", props: { text: "Following", textColor: "#94a3b8", fontSize: "12px" } }] },
                ],
              },
              { type: "button", props: { text: "Follow", variant: "primary" } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "product-card",
    name: "Product Card",
    description: "E-commerce product listing with image, price, and CTA",
    icon: "⬡",
    color: "amber",
    category: "E-commerce",
    builtIn: true,
    blocks: [
      {
        type: "flex-row",
        props: { justify: "center", gap: 20 },
        children: [
          {
            type: "card",
            props: { padding: "0", borderRadius: "16px", width: "260px" },
            children: [
              { type: "image", props: { src: "", alt: "Product", height: "200px", bgColor: "#1e1e2e" } },
              {
                type: "container",
                props: { padding: "16px" },
                children: [
                  { type: "badge", props: { text: "In stock", bgColor: "#052e16", textColor: "#4ade80" } },
                  { type: "heading", props: { text: "Premium Headphones", level: 3 } },
                  { type: "text", props: { text: "Studio-quality sound with active noise cancellation.", textColor: "#94a3b8", fontSize: "13px" } },
                  { type: "flex-row", props: { justify: "between" }, children: [{ type: "heading", props: { text: "$249", level: 3 } }, { type: "button", props: { text: "Add to cart", variant: "primary" } }] },
                ],
              },
            ],
          },
          {
            type: "card",
            props: { padding: "0", borderRadius: "16px", width: "260px" },
            children: [
              { type: "image", props: { src: "", alt: "Product", height: "200px", bgColor: "#1e1a2e" } },
              {
                type: "container",
                props: { padding: "16px" },
                children: [
                  { type: "badge", props: { text: "Sale", bgColor: "#450a0a", textColor: "#f87171" } },
                  { type: "heading", props: { text: "Wireless Keyboard", level: 3 } },
                  { type: "text", props: { text: "Compact mechanical keyboard with RGB backlighting.", textColor: "#94a3b8", fontSize: "13px" } },
                  { type: "flex-row", props: { justify: "between" }, children: [{ type: "heading", props: { text: "$129", level: 3 } }, { type: "button", props: { text: "Add to cart", variant: "primary" } }] },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "blog-post",
    name: "Blog Post",
    description: "Article layout with header, meta, body, and tags",
    icon: "✦",
    color: "indigo",
    category: "Content",
    builtIn: true,
    blocks: [
      {
        type: "container",
        props: { padding: "48px", width: "680px" },
        children: [
          { type: "badge", props: { text: "Design", bgColor: "#1e1b4b", textColor: "#a5b4fc" } },
          { type: "heading", props: { text: "How to build great design systems", level: 1 } },
          { type: "flex-row", props: { gap: 12 }, children: [{ type: "avatar", props: { text: "AK", bgColor: "#6366f1" } }, { type: "text", props: { text: "Alex Kim · March 23, 2026 · 5 min read", textColor: "#94a3b8", fontSize: "13px" } }] },
          { type: "divider", props: {} },
          { type: "text", props: { text: "A design system is more than a component library. It's a shared language between designers and developers that enables teams to build consistent, scalable products faster." } },
          { type: "heading", props: { text: "Why consistency matters", level: 2 } },
          { type: "text", props: { text: "When every button looks different, users lose trust. When every input behaves uniquely, they lose confidence. A design system solves this by providing a single source of truth." } },
          { type: "divider", props: {} },
          { type: "flex-row", props: { gap: 8 }, children: [{ type: "badge", props: { text: "Design Systems" } }, { type: "badge", props: { text: "UI" } }, { type: "badge", props: { text: "Developer Experience" } }] },
        ],
      },
    ],
  },
  {
    id: "login-form",
    name: "Login Form",
    description: "Sign in form with email, password, and social logins",
    icon: "⊠",
    color: "orange",
    category: "Forms",
    builtIn: true,
    blocks: [
      {
        type: "container",
        props: { padding: "48px", align: "center" },
        children: [
          {
            type: "card",
            props: { padding: "40px", borderRadius: "20px", width: "400px" },
            children: [
              { type: "heading", props: { text: "Welcome back", level: 2, align: "center" } },
              { type: "text", props: { text: "Sign in to continue to your account.", align: "center", textColor: "#94a3b8", fontSize: "13px" } },
              { type: "spacer", props: { height: "8px" } },
              { type: "text", props: { text: "Email address", fontWeight: "600", fontSize: "13px" } },
              { type: "input", props: { placeholder: "you@example.com" } },
              { type: "flex-row", props: { justify: "between" }, children: [{ type: "text", props: { text: "Password", fontWeight: "600", fontSize: "13px" } }, { type: "link", props: { text: "Forgot password?", href: "#", textColor: "#7c6af7" } }] },
              { type: "input", props: { placeholder: "••••••••" } },
              { type: "button", props: { text: "Sign in", variant: "primary" } },
              { type: "divider", props: {} },
              { type: "text", props: { text: "Don't have an account?", align: "center", textColor: "#94a3b8", fontSize: "13px" } },
              { type: "button", props: { text: "Create account", variant: "ghost" } },
            ],
          },
        ],
      },
    ],
  },
  // ── Tambo AI Agent Templates ──
  {
    id: "tambo-chat-app",
    name: "Tambo Chat App",
    description: "Full AI chat interface with TamboProvider, thread, and generative component rendering",
    icon: "⚡",
    color: "purple",
    category: "AI Agent",
    builtIn: true,
    blocks: [
      {
        type: "agent-provider",
        props: { apiKey: "NEXT_PUBLIC_TAMBO_API_KEY", userKey: "user-1" },
        children: [
          {
            type: "container",
            props: { padding: "0", bgColor: "transparent" },
            children: [
              { type: "navbar", props: { text: "My AI App", bgColor: "#0d0d12", padding: "12px 24px" }, children: [
                { type: "badge", props: { text: "Tambo AI", bgColor: "#1a0a3a", textColor: "#a78bfa" } },
              ]},
              {
                type: "flex-row",
                props: { gap: 0, padding: "0" },
                children: [
                  {
                    type: "sidebar",
                    props: { bgColor: "#0d0d12", padding: "16px", width: "220px" },
                    children: [
                      { type: "heading", props: { text: "Threads", level: 3, fontSize: "13px" } },
                      { type: "button", props: { text: "+ New Thread", variant: "ghost" } },
                      { type: "divider", props: {} },
                      { type: "text", props: { text: "Thread #1", fontSize: "12px", textColor: "#a78bfa" } },
                      { type: "text", props: { text: "Thread #2", fontSize: "12px", textColor: "#94a3b8" } },
                    ],
                  },
                  {
                    type: "container",
                    props: { padding: "16px", bgColor: "transparent" },
                    children: [
                      {
                        type: "chat-thread",
                        props: { height: "380px", bgColor: "transparent" },
                        children: [
                          { type: "chat-message", props: { text: "Hello! I can help you visualize data, manage tasks, and more. What would you like to do?", role: "assistant" } },
                          { type: "chat-message", props: { text: "Show me a sales chart", role: "user" } },
                          { type: "tool-call", props: { toolName: "get-sales-data", text: "Fetching sales data...", toolStatus: "done" } },
                          { type: "data-chart", props: { chartType: "bar", text: "Monthly Sales", label: "Revenue" } },
                          { type: "chat-message", props: { text: "Here's your sales chart for the past week. Revenue peaked on Wednesday at $90k.", role: "assistant" } },
                          { type: "streaming-indicator", props: { text: "AI is thinking..." } },
                        ],
                      },
                      { type: "chat-input", props: { placeholder: "Ask me anything..." } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "tambo-dashboard-agent",
    name: "AI Dashboard Agent",
    description: "Analytics dashboard with AI agent that can update charts and stats via conversation",
    icon: "◈",
    color: "blue",
    category: "AI Agent",
    builtIn: true,
    blocks: [
      {
        type: "agent-provider",
        props: { apiKey: "NEXT_PUBLIC_TAMBO_API_KEY", userKey: "user-1" },
        children: [
          {
            type: "container",
            props: { padding: "24px", bgColor: "transparent" },
            children: [
              {
                type: "flex-row",
                props: { justify: "between", padding: "0 0 16px 0" },
                children: [
                  { type: "heading", props: { text: "Analytics Dashboard", level: 2 } },
                  { type: "badge", props: { text: "AI-Powered", bgColor: "#1a0a3a", textColor: "#a78bfa" } },
                ],
              },
              {
                type: "grid",
                props: { cols: 4, gap: 12 },
                children: [
                  { type: "stat-card", props: { label: "Total Users", value: 24521, text: "+12% this month", color: "purple" } },
                  { type: "stat-card", props: { label: "Revenue", value: 84200, text: "+8% this month", color: "teal" } },
                  { type: "stat-card", props: { label: "Conversions", value: 3621, text: "+3.6% this month", color: "amber" } },
                  { type: "stat-card", props: { label: "Active Now", value: 1204, text: "Live users", color: "green" } },
                ],
              },
              {
                type: "flex-row",
                props: { gap: 16, padding: "16px 0 0 0" },
                children: [
                  {
                    type: "card",
                    props: { padding: "20px", borderRadius: "12px", width: "60%" },
                    children: [
                      { type: "heading", props: { text: "Revenue Overview", level: 3 } },
                      { type: "data-chart", props: { chartType: "bar", text: "Weekly Revenue", label: "Revenue" } },
                    ],
                  },
                  {
                    type: "card",
                    props: { padding: "20px", borderRadius: "12px" },
                    children: [
                      { type: "heading", props: { text: "Ask AI", level: 3 } },
                      { type: "chat-message", props: { text: "What were the top performing days?", role: "user" } },
                      { type: "chat-message", props: { text: "Wednesday had the highest revenue at $90k, followed by Friday at $70k.", role: "assistant" } },
                      { type: "chat-input", props: { placeholder: "Ask about your data..." } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "tambo-generative-ui",
    name: "Generative UI Demo",
    description: "Shows Tambo's generative component pattern — AI picks and renders components from your registry",
    icon: "◧",
    color: "teal",
    category: "AI Agent",
    builtIn: true,
    blocks: [
      {
        type: "agent-provider",
        props: { apiKey: "NEXT_PUBLIC_TAMBO_API_KEY", userKey: "user-1" },
        children: [
          {
            type: "container",
            props: { padding: "32px", bgColor: "transparent" },
            children: [
              { type: "heading", props: { text: "Generative UI with Tambo", level: 1, align: "center" } },
              { type: "text", props: { text: "Ask the AI to show data — it picks the right component automatically.", align: "center", textColor: "#94a3b8" } },
              { type: "spacer", props: { height: "24px" } },
              {
                type: "grid",
                props: { cols: 2, gap: 16 },
                children: [
                  {
                    type: "card",
                    props: { padding: "20px", borderRadius: "12px" },
                    children: [
                      { type: "badge", props: { text: "User Message", bgColor: "#1a0a3a", textColor: "#a78bfa" } },
                      { type: "chat-message", props: { text: "Show me sales by region as a chart", role: "user" } },
                      { type: "spacer", props: { height: "8px" } },
                      { type: "badge", props: { text: "AI Response", bgColor: "#052e16", textColor: "#4ade80" } },
                      { type: "tool-call", props: { toolName: "get-regional-sales", text: "Fetching regional data", toolStatus: "done" } },
                      { type: "component-renderer", props: { componentName: "SalesChart", text: "Rendered by Tambo AI" } },
                    ],
                  },
                  {
                    type: "card",
                    props: { padding: "20px", borderRadius: "12px" },
                    children: [
                      { type: "badge", props: { text: "User Message", bgColor: "#1a0a3a", textColor: "#a78bfa" } },
                      { type: "chat-message", props: { text: "Add a task: Review Q4 report", role: "user" } },
                      { type: "spacer", props: { height: "8px" } },
                      { type: "badge", props: { text: "AI Response", bgColor: "#052e16", textColor: "#4ade80" } },
                      { type: "component-renderer", props: { componentName: "TaskBoard", text: "Interactable — updates in place" } },
                      { type: "chat-message", props: { text: "Added 'Review Q4 report' to your task board.", role: "assistant" } },
                    ],
                  },
                ],
              },
              { type: "spacer", props: { height: "16px" } },
              {
                type: "card",
                props: { padding: "20px", borderRadius: "12px" },
                children: [
                  { type: "heading", props: { text: "Component Registry", level: 3 } },
                  { type: "code-block", props: { language: "typescript", text: 'const components: TamboComponent[] = [\n  {\n    name: "SalesChart",\n    description: "Displays sales data as a chart",\n    component: SalesChart,\n    propsSchema: z.object({\n      data: z.array(z.object({ region: z.string(), value: z.number() })),\n      type: z.enum(["bar", "line", "pie"]),\n    }),\n  },\n];' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "tambo-thread-collapsible",
    name: "Collapsible AI Chat",
    description: "MessageThreadCollapsible pattern — floating AI assistant that expands on demand",
    icon: "⊕",
    color: "rose",
    category: "AI Agent",
    builtIn: true,
    blocks: [
      {
        type: "agent-provider",
        props: { apiKey: "NEXT_PUBLIC_TAMBO_API_KEY", userKey: "user-1" },
        children: [
          {
            type: "container",
            props: { padding: "32px", bgColor: "transparent" },
            children: [
              { type: "heading", props: { text: "Your App Content", level: 2 } },
              { type: "text", props: { text: "The AI assistant floats over your existing UI. Click the button to expand.", textColor: "#94a3b8" } },
              { type: "spacer", props: { height: "16px" } },
              {
                type: "grid",
                props: { cols: 3, gap: 12 },
                children: [
                  { type: "stat-card", props: { label: "Projects", value: 12, text: "Active" } },
                  { type: "stat-card", props: { label: "Tasks", value: 48, text: "In progress" } },
                  { type: "stat-card", props: { label: "Team", value: 8, text: "Members" } },
                ],
              },
              { type: "spacer", props: { height: "24px" } },
              {
                type: "thread-collapsible",
                props: { text: "AI Assistant", placeholder: "Ask me anything about your projects..." },
                children: [
                  { type: "chat-message", props: { text: "Hi! I can help you manage your projects and tasks. What do you need?", role: "assistant" } },
                  { type: "chat-message", props: { text: "How many tasks are overdue?", role: "user" } },
                  { type: "tool-call", props: { toolName: "get-overdue-tasks", text: "Checking task deadlines", toolStatus: "done" } },
                  { type: "chat-message", props: { text: "You have 3 overdue tasks. Would you like me to show them?", role: "assistant" } },
                  { type: "chat-input", props: { placeholder: "Ask about your projects..." } },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "tambo-mcp-agent",
    name: "MCP Tool Agent",
    description: "AI agent with MCP server integration — connects to databases, APIs, and external systems",
    icon: "⚙",
    color: "amber",
    category: "AI Agent",
    builtIn: true,
    blocks: [
      {
        type: "agent-provider",
        props: { apiKey: "NEXT_PUBLIC_TAMBO_API_KEY", userKey: "user-1" },
        children: [
          {
            type: "container",
            props: { padding: "24px", bgColor: "transparent" },
            children: [
              { type: "heading", props: { text: "MCP-Powered Agent", level: 2 } },
              { type: "text", props: { text: "Connected to filesystem, database, and external APIs via Model Context Protocol.", textColor: "#94a3b8", fontSize: "13px" } },
              { type: "spacer", props: { height: "16px" } },
              {
                type: "flex-row",
                props: { gap: 8, padding: "0 0 16px 0" },
                children: [
                  { type: "badge", props: { text: "filesystem", bgColor: "#1a1040", textColor: "#a78bfa" } },
                  { type: "badge", props: { text: "database", bgColor: "#052e16", textColor: "#4ade80" } },
                  { type: "badge", props: { text: "http-api", bgColor: "#1c1007", textColor: "#fbbf24" } },
                ],
              },
              {
                type: "chat-thread",
                props: { height: "320px", bgColor: "transparent" },
                children: [
                  { type: "chat-message", props: { text: "I'm connected to your filesystem, database, and APIs. What would you like to do?", role: "assistant" } },
                  { type: "chat-message", props: { text: "Read the latest sales report from the database", role: "user" } },
                  { type: "tool-call", props: { toolName: "database:query", text: "SELECT * FROM sales ORDER BY date DESC LIMIT 10", toolStatus: "done" } },
                  { type: "data-table", props: { label: "Sales Report", columns: "Date,Product,Revenue", items: "Mar 23,Pro Plan,$12,400\nMar 22,Starter,$4,200\nMar 21,Enterprise,$28,000" } },
                  { type: "chat-message", props: { text: "Here are the latest 3 sales records. Enterprise deals are driving the most revenue.", role: "assistant" } },
                ],
              },
              { type: "chat-input", props: { placeholder: "Query your data with natural language..." } },
              { type: "spacer", props: { height: "12px" } },
              {
                type: "code-block",
                props: {
                  language: "typescript",
                  text: 'const mcpServers = [\n  { name: "database", url: "http://localhost:8261/mcp", transport: MCPTransport.HTTP },\n  { name: "filesystem", url: "http://localhost:8262/mcp", transport: MCPTransport.HTTP },\n];\n\n<TamboProvider components={components} mcpServers={mcpServers}>\n  <App />\n</TamboProvider>',
                },
              },
            ],
          },
        ],
      },
    ],
  },];

// ── Component ──
interface TemplateGalleryProps {
  onClose: () => void;
  onApply: (name: string) => void;
  inline?: boolean;
}

export default function TemplateGallery({ onClose, onApply, inline = false }: TemplateGalleryProps) {
  const addBlocksFromAgent = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => s.addBlocksFromAgent);
  const storeBlocks = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => s.blocks);
  const rootIds = useEditorStore((s: ReturnType<typeof useEditorStore.getState>) => s.rootIds);

  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [saveIcon, setSaveIcon] = useState(ICON_OPTIONS[0]);
  const [saveColor, setSaveColor] = useState(COLOR_OPTIONS[0].value);

  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
  }, []);

  useEffect(() => {
    if (inline) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, inline]);

  const allTemplates = useMemo(() => [...BUILT_IN_TEMPLATES, ...customTemplates], [customTemplates]);

  const filtered = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchCat = selectedCategory === "All" || t.category === selectedCategory;
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allTemplates, selectedCategory, search]);

  function applyTemplate(template: Template) {
    addBlocksFromAgent(template.blocks);
    onApply(template.name);
    if (!inline) onClose();
  }

  function handleSaveTemplate() {
    if (!saveName.trim()) return;
    const serialized = serializeBlocks(storeBlocks, rootIds);
    if (serialized.length === 0) return;
    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: saveName.trim(),
      description: saveDesc.trim() || `${countBlocks(serialized)} blocks`,
      icon: saveIcon,
      color: saveColor,
      category: "Content",
      blocks: serialized,
    };
    const updated = [...customTemplates, newTemplate];
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
    setShowSaveForm(false);
    setSaveName("");
    setSaveDesc("");
  }

  function deleteCustomTemplate(id: string) {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
  }

  function getColorStyle(colorValue: string) {
    const c = COLOR_OPTIONS.find((o) => o.value === colorValue) || COLOR_OPTIONS[0];
    return { background: c.bg, iconGradient: `linear-gradient(135deg,${c.from},${c.to})` };
  }

  const canSave = rootIds.length > 0;

  // ── Inline mode (sidebar panel) ──
  if (inline) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Search */}
        <div className="p-2.5 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…" className="input-base w-full pl-8 pr-3 py-1.5 text-[12px]" />
          </div>
        </div>

        {/* Category pills */}
        <div className="px-2.5 py-2 flex flex-wrap gap-1 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className="px-2 py-0.5 rounded-md text-[10px] transition-colors"
              style={{
                background: selectedCategory === cat ? "var(--accent-subtle)" : "transparent",
                color: selectedCategory === cat ? "var(--accent)" : "var(--text-muted)",
                border: `1px solid ${selectedCategory === cat ? "var(--accent)" : "transparent"}`,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Save current button */}
        {canSave && (
          <div className="px-2.5 py-2 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <button onClick={() => setShowSaveForm((v) => !v)} className="btn btn-ghost w-full text-[11px] gap-1.5 justify-center">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save canvas as template
            </button>
            {showSaveForm && (
              <div className="mt-2 space-y-2">
                <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Template name" className="input-base w-full text-[11px] px-2.5 py-1.5" />
                <input value={saveDesc} onChange={(e) => setSaveDesc(e.target.value)} placeholder="Description (optional)" className="input-base w-full text-[11px] px-2.5 py-1.5" />
                <div className="flex gap-1.5">
                  <button onClick={handleSaveTemplate} disabled={!saveName.trim()} className="btn btn-primary text-[10px] flex-1">Save</button>
                  <button onClick={() => setShowSaveForm(false)} className="btn btn-ghost text-[10px]">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Template list */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-[11px] text-center mt-6" style={{ color: "var(--text-muted)" }}>No templates found</p>
          ) : (
            filtered.map((template) => {
              const cs = getColorStyle(template.color);
              return (
                <button key={template.id} onClick={() => applyTemplate(template)}
                  className="w-full text-left p-2.5 rounded-lg transition-all group"
                  style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-color)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.background = "var(--accent-subtle)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-color)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-tertiary)"; }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shrink-0" style={{ background: cs.iconGradient }}>
                      {template.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{template.name}</p>
                      <p className="text-[9.5px] truncate" style={{ color: "var(--text-muted)" }}>{template.description}</p>
                    </div>
                    {!template.builtIn && (
                      <button className="shrink-0 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-muted)" }}
                        onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(template.id); }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                      </button>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Modal mode (overlay) ──
  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div
        className="overlay-panel animate-scale flex flex-col"
        style={{ width: 860, maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Templates</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{allTemplates.length} templates · Click to apply</p>
          </div>
          <div className="flex items-center gap-2">
            {canSave && (
              <button onClick={() => setShowSaveForm((v) => !v)} className="btn btn-subtle text-[11px] gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save current
              </button>
            )}
            <button onClick={onClose} className="toolbar-btn text-[16px] leading-none">×</button>
          </div>
        </div>

        {/* Save form */}
        {showSaveForm && (
          <div className="px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
            <p className="text-[12px] font-medium mb-3" style={{ color: "var(--text-primary)" }}>Save canvas as template</p>
            <div className="flex gap-3 mb-3">
              <input
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Template name"
                className="input-base flex-1 text-[12px] px-3 py-1.5"
              />
              <input
                value={saveDesc}
                onChange={(e) => setSaveDesc(e.target.value)}
                placeholder="Description (optional)"
                className="input-base flex-1 text-[12px] px-3 py-1.5"
              />
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {ICON_OPTIONS.map((ic) => (
                  <button key={ic} onClick={() => setSaveIcon(ic)}
                    className="w-7 h-7 rounded-md text-[13px] flex items-center justify-center transition-colors"
                    style={{ background: saveIcon === ic ? "var(--accent-subtle)" : "var(--bg-secondary)", border: `1px solid ${saveIcon === ic ? "var(--accent)" : "var(--border-color)"}` }}>
                    {ic}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c.value} onClick={() => setSaveColor(c.value)}
                    className="w-5 h-5 rounded-full transition-transform"
                    style={{ background: `linear-gradient(135deg,${c.from},${c.to})`, transform: saveColor === c.value ? "scale(1.3)" : "scale(1)", outline: saveColor === c.value ? `2px solid ${c.from}` : "none", outlineOffset: "2px" }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveTemplate} disabled={!saveName.trim()} className="btn btn-primary text-[11px]">Save template</button>
              <button onClick={() => setShowSaveForm(false)} className="btn btn-ghost text-[11px]">Cancel</button>
            </div>
          </div>
        )}

        {/* Search + categories */}
        <div className="px-6 py-3 shrink-0 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <div className="relative flex-1 max-w-[240px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--text-muted)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="input-base w-full pl-8 pr-3 py-1.5 text-[12px]"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="px-2.5 py-1 rounded-md text-[11px] transition-colors"
                style={{
                  background: selectedCategory === cat ? "var(--accent-subtle)" : "transparent",
                  color: selectedCategory === cat ? "var(--accent)" : "var(--text-muted)",
                  border: `1px solid ${selectedCategory === cat ? "var(--accent)" : "transparent"}`,
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <span className="text-2xl" style={{ color: "var(--text-muted)" }}>◇</span>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No templates found</p>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))" }}>
              {filtered.map((template) => {
                const cs = getColorStyle(template.color);
                return (
                  <div
                    key={template.id}
                    className="group relative rounded-xl overflow-hidden cursor-pointer transition-all"
                    style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
                    onClick={() => applyTemplate(template)}
                  >
                    {/* Preview area */}
                    <div className="h-28 flex items-center justify-center relative" style={{ background: cs.background }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                        style={{ background: cs.iconGradient }}>
                        {template.icon}
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
                        <span className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
                          style={{ background: "var(--accent)" }}>
                          Apply template
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{template.name}</p>
                          <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>{template.description}</p>
                        </div>
                        {!template.builtIn && (
                          <button
                            className="shrink-0 w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                            style={{ color: "var(--text-muted)" }}
                            onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(template.id); }}
                            title="Delete template"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="pill text-[10px]" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>{template.category}</span>
                        <span className="pill text-[10px]" style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}>{countBlocks(template.blocks)} blocks</span>
                        {!template.builtIn && <span className="pill text-[10px]" style={{ background: "var(--accent-subtle)", color: "var(--accent)" }}>Custom</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
