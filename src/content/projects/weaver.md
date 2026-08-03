---
title: "Weaver"
tagline: "Conjure. Share. Remix."
description: "An agent-native desktop widget platform — think Rainmeter, rebuilt for 2026. Widgets are built by prompting your agent, shared as source, and remixed by anyone's agent."
date: 2026-07-13
timeframe: "2026 —"
status: "v0 · early beta"
image: "/images/weaver-live-desktop.png"
---

![](/images/weaver-live-desktop.png)

## About

Weaver is an agent-native, cross-platform desktop widget platform — think Rainmeter, rebuilt for 2026. I'm building the entire framework almost from scratch: a Widget is a TypeScript component rendered by a Zig/QuickJS runtime through Weaver's fork of Vercel Labs' Native SDK — no browser and no webview. Widgets are crash-isolated, GPU-rendered where that is the measured winner, and presented with per-pixel transparency on the desktop layer.

**Conjure. Share. Remix.** Widgets are built by prompting your agent, shared as source, and remixed by anyone's agent. A single TSX file is a complete widget:

```tsx
import { useProvider, widget } from "@weaver/sdk";

export default widget({
  name: "Clock",
  size: [240, 110],
  anchor: { corner: "top-right", offset: [24, 24] },
  subscribe: ["time"],
}, () => {
  const time = useProvider("time");
  return (
    <column class="p-4 gap-1 bg-[#11141c]/86 rounded-2xl">
      <row class="items-baseline gap-2">
        <text class="text-3xl font-light">{time.hh}:{time.mm}</text>
        <text class="text-sm opacity-70">{time.ss}</text>
      </row>
      <text class="text-xs opacity-60">{time.weekday}, {time.month} {time.day}</text>
    </column>
  );
});
```

That file is also the *distribution format*: a shared Weaver widget is always its source — what you read is what runs, and every install is a potential remix.

## Why Weaver is different

- **Prompt-to-desktop authoring**: TSX, familiar hooks, and Tailwind-like classes give coding agents a surface they already know.
- **Native pixels without a browser tax**: a small Zig runtime embeds QuickJS and projects retained operations into a native renderer instead of shipping Chromium with every widget.
- **Source is the artifact**: a deterministic `.weave` contains readable source, assets, declared access, provenance, and remix lineage — never an opaque executable.
- **Isolation without duplicated collection**: widgets fail independently; expensive system data is collected once by the host and fanned out only to subscribers.
- **Performance has receipts**: CPU, memory footprint, wakeups, and frame cadence are product gates with measured tripwires, not silent guesses.

## Current status

Early beta (v0), with developer builds for **Windows** and **macOS**. The authoring and source-sharing paths work end to end: scaffold → agent edits the TSX → `weaver check` → `weaver dev` → live widget. Expect everything to change.

## Links

- [Source code](https://github.com/SunkenInTime/weaver)
