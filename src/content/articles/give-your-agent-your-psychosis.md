---
title: "give your agent your psychosis"
description: "a guide to writing your own AGENTS.md"
date: 2026-08-02
image: "/images/agents-md-cover.jpg"
---

[@theo](https://x.com/theo) recently made a video walking through his AGENTS.md and the thinking behind it. This is my version of that. I'm going to walk through how I wrote the CLAUDE.md for [Weaver](/projects/weaver/), the desktop widget framework I'm building, and the AGENTS.md for [Icarus](https://icarusstrats.com), my Valorant strategy tool with 1,000+ users. Same skeleton, completely different content, and that difference is the entire point.

By the end you should be able to write your own. It takes about an hour and a half. It will save you way more than that.

## step 0: do the homework first

Before you write anything, go watch Matt Pocock's ([@mattpocockuk](https://x.com/mattpocockuk)) ["Building Great Agent Skills" video](https://youtu.be/UNzCG3lw6O0?si=rB1iohsAbRBGV6I8) and read his "writing-great-skills" agent skill. Seriously. A lot of the actual technique in this is just knowing how to codify information for an agent, and he covers it better than anyone.

My actual workflow when I want a base draft of a skill or a section: I have Fable look at the writing-great-skills skill, I talk about what I want codified, and it gives me a rough draft. Then I edit it myself, or ask it to clean stuff up. The model gets you to a solid base format fast. Your job is the taste.

One pattern to watch for in drafts: no-ops. A no-op is a line that restates information without changing what the agent does. It feels like content but it's dead weight. Compress everything into keywords. Every line should be doing work.

## why would you want to do this?

agents are just really, really good autocomplete.

When you start a session with certain tokens, you're activating different weights in the model. You're steering it toward a region of behavior before it's written a single line. That's why your AGENTS.md matters so much. It's removing the context you'd otherwise have to re-provide in every single chat to get the model to where you want it.

And notice I said behavior, not intelligence. These models are already smart. They're resilient. What you're telling them is what to prioritize and where to put in the most effort. That matters because different applications have different stakes and need different types of thinking. A widget framework where the memory profile is the product needs a different agent than a consumer app where the user will never read a log.

Think of this like a Plinko board. You drop the ball at the top and it bounces off all the pegs. Your AGENTS.md is you reshaping the pegs so the ball lands in the hole you want. You're not pushing the ball. You're setting up the board so the natural fall goes your way.

![Image of the plinko board](/images/agents-md-plinko.jpg)

So give your agent your psychosis. Your specific obsessions, your scars, your taste. That's the stuff a general LLM won't assume on its own.

## let's walk through an example

![Weaver running agent-built widgets beside their TSX source](/images/weaver-live-desktop.png)

*Weaver running agent-built widgets beside their TSX source — the file below is what steered them.*

[Weaver](/projects/weaver/) is the framework I just made. Here's how the file opens:

```md
i(Dara,me) want to write this to you(agent). weaver we are building this together.
```

Start with definitions. This helps the agent know: hey, what am I? What are we talking about? Who's who? Then immediately, define the thing:

```md
weaver is a desktop widget platform: Rainmeter, but cross platform (macOS and Windows) and authored in tsx instead of a bespoke markup language. It has to match or beat Rainmeter on performance: these are desk widgets, so the memory and cpu profile is the product, not a nice-to-have.
```

Look at what this paragraph is doing. "Cross platform" means every change we make needs to work on both Windows and macOS. "Authored in tsx instead of a bespoke markup language" tells the agent this is a different way of going about widgets. "Rainmeter" is a keyword. The agent knows what kind of app this is now, what the reference point is, and that CPU and memory performance are a thing to care about constantly.

Then:

```md
This is meant to be a bold project. Going with the flow and using existing solutions will not get us where we want to be.
```

This line exists because agents will give you timelines and plans from the pre-agent era. They'll structure work like adding a feature takes weeks when it should take two hours. Saying "this is a bold project" up front pushes the agent to break assumptions. We are doing things faster and differently than they used to be done.

## the who and why

```md
you - the agent reading this document and working on weaver directly.

me/we/us - the humans contributing to weaver. This is the party talking to you as we build.

developers - these are our users. We are assuming they won't read code much, rather they will prompt their own agents to build things using this framework.
```

That last one is load-bearing. Weaver is agentic-first. Our users won't read code, they'll prompt their own agents. Which means the framework's agents need to go from zero to hero without problems, and debugging has to be easy when things go wrong. That one assumption shapes half the philosophy sections below it.

## the "leading words"

This is my favorite part of the file, and it's the part most people skip. When you're building a framework, you're working at a low level, and wrong assumptions made early kick you in the ass later. So I named the patterns:

```md
landmine - a decision that costs nothing now and blows up later. by the time it detonates it's load-bearing. (i.e. an unmeasured limit, a silent catch)
```

The silent catch example is real. Like three days ago I kept hitting try/catch statements in the codebase that swallowed platform errors instead of propagating them up. The agent couldn't debug anything because the errors just vanished. That's a no-go, so it got codified as a named concept. Once it has a name, you can say "that's a landmine" in a review and the agent knows exactly what you mean.

```md
receipt - the measurement behind a number. no receipt, no number.

tripwire - a limit placed past where any good widget goes, so only broken things touch it. good widgets never feel it exists.
```

The tripwire idea came from an actual bug pattern. Early in Weaver, widgets the agent built kept breaking on a max nodes limit for styling that it had set arbitrarily. Reasonable designs broke, elements started dropping, and the number wasn't measuring anything real. It was made up, and it was punishing good widgets.

So the rule: measure the real thing first, then set the limit way past where any good widget goes, so only genuinely broken things touch it. A tripwire hit means the widget is outside the spirit of what we're building, the construction went wrong, or it should be using a different primitive instead of stacking four statements to get there. If a good widget hits it, the wire is wrong, not the widget. And the hit is a late symptom: by then I have no idea what already went quietly wrong, so the fix is remeasuring the whole path, not raising the number.

```md
simple - how cleanly the logic breaks down. each step follows from the last, no step doing two jobs.

obvious - the next reader never asks "why is this here?". measured by the reader. not always simple; sometimes obvious has more parts.
```

These two need to be defined together because they're not the same thing. Recursion can be simple and not obvious. A return built from nested ternaries is simple, each branch follows cleanly from the last, but the reader has to run it in their head to know what comes out. A lookup table doing the same job has more parts, and nobody ever asks why it's there. That's obvious winning with more parts. Regular programmers know this tension. We love writing simple things, and some people write complex things because it makes their ego go up. The file tells the agent to strike the balance on purpose. No function with 38 sub-functions recursing over itself a million times because it looks cool. The code should explain itself.

## the philosophy sections

Now the principles. One thing to notice before reading them: they're written in the leading words. "A limit without a measurement is a landmine." "Size it as a tripwire." "Update the receipt." That's deliberate. Defining a word and then immediately using it in context is what hammers it home. 

```md
**Boil the ocean**

When planning, do not be afraid to suggest seemingly insane solutions. we effectively have to rethink and rebuild what it means to make a desk widget platform.
```

Again: we are doing something very different, rethink the whole stack, don't default to the safe answer.

Then the receipt principle in full:

```md
**Every number needs a receipt**

A limit without a measurement is a landmine. Before writing any number (a max_nodes, a byte cap, a timeout), measure the real thing first, then size it as a tripwire. Capacity is free until touched (reserve big, commit lazily, never zero an arena eagerly), so be generous. If a good widget hits a budget, the budget is wrong. Remeasure, update the receipt.
```

This is the max-commands bug, codified forever. No assumed numbers. Everything based on measurements. And modern computers have plenty of memory, so be generous with the tripwires.

Then DX:

```md
**DX is for humans and agents**

Every surface we ship has two readers: a human debugging at 2am and an agent with nothing but the error text. Design for both. Apis should be guessable by anyone who knows tsx; errors and check output should carry enough that an agent can act without reading our code. An agent can fix "max_nodes=128, asked for 129". It cannot fix a blank window. The test for done: given only the message, could a fresh agent fix the widget? Given only the log, would a human know where to look? A no on either means not done.
```

This is the silent-catch problem from the other side. Errors have to travel upward with enough detail to act on. Related:

```md
**A limit developers can hit is a limit they must see**

Every budget failure names the budget, the limit, and the ask: at weaver check if knowable there, loudly at runtime if not. A silent budget is worse than no budget.
```

I'll be honest, I'm still going to do a pass on this section. I want to deep-dive Effect for a week or so because their errors-as-values DX is the best in the game, and I want to bring more of that styling into Weaver and everything else I build. If I'm not going to write the code myself anymore, I might as well make the experience of working on it the best it can be.

Then my favorite:

```md
**Fight for the "obvious" solution**

Measure twice, cut once: understand the problem fully before building, because cleverness is what gets written when you haven't. The biggest simplicity win is refusing to solve problems we don't have.
```

I think this section belongs in every project. GPT-5-class models have this thing where they write absolutely insane code that is completely correct and horrible to look at. This section smooths that out. It won't solve every issue, but it makes the code that comes out of your agents read like a human wrote it, and that makes everything downstream easier to deal with.

And finally:

```md
**Some general rules**

These are meant to steer us in the right direction. They are not hard-set, but we should default to following them. If you think one should be ignored, be very loud and clear about that and get approval from us before doing it.
```

Rules the agent can break, but only with very loud approval. Not hills to die on, just defaults with a cost to override.

## icarus: psychosis changes with projects

Now here's the part that proves the whole thesis. [Icarus](https://icarusstrats.com) is my desktop Valorant strategy tool, built in Flutter, shipped as an installer with an auto-updater, over a thousand users. Until recently its entire agent file was one line: "don't edit *.g.dart files." I just rewrote it using the exact same skeleton as Weaver. Same opening line format, glossary of parties, working vocabulary, philosophy sections, general rules.

![The Icarus strategy board](/images/icarus-board-preview.png)

*Icarus — same skeleton in its agent file, completely different psychosis.*

The content is completely different, because the stakes are completely different. Weaver's psychosis is performance receipts and loud budgets. Icarus's psychosis is data safety and users who never read logs:

```md
users - Valorant players and coaches. They are not developers. They will never read an error log, they will only feel whether the app worked.
```

So the principles are things like:

```md
**The library is sacred**

Corrupted or dropped library data is unrecoverable. Schema changes are the dangerous moment: a change to the Hive models means source models, generated adapters, and a migration (lib/migrations/) so that data written by any past version loads in this one. When a write path is uncertain, fail loudly without saving rather than save something wrong.

**Everything exported must come home**

Every .ica file and library backup from every version we ever shipped must round-trip.

**The user is mid-thought**

People use Icarus while their tactical idea is still hot, the interface must never make them wait or wonder. So when a feature works but feels wrong, it is not done.
```

None of these would make sense in Weaver. Weaver's "every number needs a receipt" would be noise in Icarus. But "fight for the obvious solution" and the general rules made the trip unchanged, because good taste is good taste. The template transfers. The priorities don't. That's the demonstration: your AGENTS.md is not a format, and it's not really instructions either. It's you molding the model into your own thing. You're tuning it, shaping it, activating different parts of it for your project's stakes and nobody else's. Same reason you can't borrow mine: the shape only fits the hands that made it.

## how to write yours

1. Watch [Matt Pocock's video](https://youtu.be/UNzCG3lw6O0?si=rB1iohsAbRBGV6I8), read the writing-great-skills skill. Learn to spot no-ops.
2. Write down the principles you want your agent to focus on that a general LLM wouldn't assume on its own. This is the psychosis part. What do you obsess over? What has bitten you? What do your users never see but always feel?
3. Define your parties and your vocabulary. Give your recurring problems names. Landmine, receipt, tripwire, whatever fits your project. Named patterns are reusable in every future conversation.
4. Have your agent draft the base format using the skill, then edit it yourself. Add your taste. This part is not optional.
5. Read the thing yourself. Actually read it. Every line should change behavior or get cut.
6. Keep updating it. The file is a living record of patterns you've spotted your agent struggling with. Every time you catch a repeated mistake, that's a new line or a new word in the glossary.

One warning: you can't copy someone else's AGENTS.md one for one. You can't ctrl+c Theo's file or mine into your project and expect it to work. The whole value is that it's tuned to your stakes, your users, your scars. Mine says "if a good widget hits a budget, the budget is wrong" because I watched widgets break on an arbitrary number. Yours should say whatever your version of that pain is.

All of this takes an hour and a half, max. You're putting 90 minutes in to save yourself many more dev hours of re-explaining, re-correcting, and re-debugging. Reshape the Plinko board once, and every ball you drop after that lands closer to the hole.

100% worth it.

Attribution:

- Theo's video isn't out yet LOL
- Matt Pocock Article: [aihero.dev/skills-writing-great-skills](https://www.aihero.dev/skills-writing-great-skills)
- Matt Pocock Video: ["Build Great Agent Skills: The Missing Manual"](https://youtu.be/UNzCG3lw6O0?si=rB1iohsAbRBGV6I8)
- Icarus Repo: [github.com/SunkenInTime/icarus](https://github.com/SunkenInTime/icarus)
- Weaver Repo: [github.com/SunkenInTime/weaver](https://github.com/SunkenInTime/weaver)

I'm still a student so Buy Me a Coffee so I can keep making slop forks :D\
[buymeacoffee.com/daradoescode](https://buymeacoffee.com/daradoescode)

---

*Originally published as [an article on X](https://x.com/daradoescode/status/2084007600463716404).*
