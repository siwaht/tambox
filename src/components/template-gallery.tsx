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

const CATEGORIES = ["All", "Marketing", "Dashboard", "Forms", "Profile", "E-commerce", "Content"];
