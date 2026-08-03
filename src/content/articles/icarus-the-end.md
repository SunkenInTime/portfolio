---
title: "Icarus: Flying Too Close to the Sun (and Loving Every Minute)"
description: "The story of building an open-source Valorant strategy tool, one mental breakdown at a time"
date: 2026-02-03
image: "/images/icarus-the-end-thumbnail.jpg"
---
## The Spark

It started with rage. Not the quiet, simmering kind—the kind that makes you close a laptop at your cousin's house at 2 AM and think, "Dead ass, I'm just going to build it myself."

I was a high school senior with 100+ hours in Aim Labs and a dream of escaping Platinum. My aim was crisp, but my game sense was, in technical terms, "dog shit." So I did what every aspiring pro does: I watched Woohoojin, I studied VODs, and I lived in ValoPlant, the only pseudo-replay system Valorant had.

That night, I was deep in Jet lineups for Bind. An hour of meticulous angles, smoke placements, and entry paths—gone. Laptop closed, tab lost, work vanished. ValoPlant's free tier doesn't auto-save, and my PC was too potato to record VODs. In that moment of pure, unfiltered frustration, Icarus was born.

Not with a grand plan. Just a pissed-off 17-year-old who thought, "How hard could it be?"

*(Spoiler: Very hard. But we'll get there.)*

## The Leap

My programming resume? One calculator app. My Flutter experience? Textbook tutorials and a graveyard of unfinished projects. But here's the thing about being young and stupid—you don't know what you don't know, so you just... do it.

I started with tutorials, placing agents on a map with a coordinate system. The goal was simple: create a local-first Valorant strategy tool that wouldn't betray you when you closed your laptop. No subscriptions, no lost work, no compromises.

First principle: build everything from scratch. No external packages unless absolutely necessary. I wanted to understand every line of code, every pixel, every bug. I wasn't cutting corners; I was carving a path through the wilderness.

I was finally learning to design by stealing from the best. But Icarus was about to teach me I could impact the world in ways I never imagined.

## The Grind (Or: How I Learned to Fear Coordinate Systems)

The drawing algorithm was my first nemesis. My implementation was so performance-heavy it could've doubled as a space heater. Then the lines looked jagged, like a caffeinated raccoon had scribbled them. I spent a week drowning in line simplification algorithms—math I still don't understand—to make a curve look like a curve.

Then came the rotation saga. Abilities in Valorant don't just spin around their center—Breach's ult rotates around an offset point, because of course it does. I filed a PR to Flutter's docs when I cracked it, which felt like winning the Olympics.

But the *real* villain? **Maps that lie to you.** Valorant's maps look uniform on screen, but their internal coordinate systems are wildly different. What works on Bind is broken on Haven. I discovered I needed a unique scalar value for *every single map*—a hidden multiplier that made abilities place correctly. It took weeks of debugging to realize the game itself was gaslighting me.

And then Valorant's API assets poured gasoline on the fire. The images they provide for ability positions? Some are rotated horizontally. Others aren't centered. A few seem to exist in their own dimension. I had to manually edit each asset, creating custom conversion formulas per map just to make sure a smoke placed in-game matched where it placed in Icarus. It was like translating a book where every chapter uses a different alphabet.

These weren't just bugs. They were a masterclass in "the real world doesn't care about your assumptions."

I had the UI figured out. Now I had to figure out if I could handle the weight of what I'd built.

Various States of Icarus
![Early image of Icarus](https://l7y6qjyp5m.ufs.sh/f/usun6XPoM0UChs7ete3xzLyZeV0KPJYGXIwN23Hr5ifs6MCl)

![Mid Stage](https://l7y6qjyp5m.ufs.sh/f/usun6XPoM0UCCzWjt0fBotb9Ny0l3H6cY4aDWZsA8fF1ewvm)

![Current View of Icarus](https://l7y6qjyp5m.ufs.sh/f/usun6XPoM0UCsTWgf5SXdfDWjgzuKqSZtbcJRoC1VG0IUYB3)

## The Weight (and Why I Carry It)

With 1,000 users comes 1,000 points of failure. Every update is a potential catastrophe. What if I corrupt someone's strategies? What if I break backwards compatibility? The pressure is constant, heavy, and entirely self-inflicted.

But the weight got heavier. I started Icarus when my parents were together. Now they're divorced. My dad survived a car accident where the other driver didn't. My family is going through it, and Icarus became more than a project—it became a lifeline. The idea that I could generate income from this thing I built, that it could help support my family while helping players improve? That's the dream.

And yet, this is the same community that raised me. Let me take you back to 2020. I'm on a Core 2 Duo with integrated graphics and 4GB of RAM. I can barely run Valorant, but my friend won't stop asking me to play. My first game? Two kills, countless deaths, absolute dog shit. But I kept playing because of the people.

I joined my high school esports team. I started a Discord for a band called Co Shu Nie (130 members now). I met my closest friend through a random "who wants to play Valorant?" message. This game gave me community when I had none. It gave me purpose when I was lost.

**Six years and 1,000+ hours later, I still love this stupid, beautiful game.** Even when it makes me tense. Even when I'm hardstuck. Even when I spend more time coding than playing. Valorant isn't just a game—it's the foundation my adult life was built on.

Building Icarus is my way of giving back. Every time a user posts a screenshot of their cleaned-up lineups, every time someone says "this made my life better," I feel a joy that nothing else can replicate. I'm not just building software; I'm building tools for the community that saved me.

Icarus had given me a voice. Now I needed to decide what to say next.

## The Unexpected Pivot (Or: How I Became a TikToker)

I never planned to be a content creator. I was just a kid who built a tool and wanted to share it. But Icarus changed something fundamental in me—it made me realize I could actually impact the world beyond my IDE.

I started posting dev logs on TikTok. Raw, unfiltered: me staring at broken rotations, ranting about coordinate systems, celebrating when drawing finally worked. I figured maybe a few fellow devs would relate. What I didn't expect was **a million-plus views**.

The videos that resonated weren't the technical deep-dives—they were the moments of pure humanity. Me admitting I was hardstuck Platinum. Showing the before-and-after UI and saying "I have no idea what I'm doing, but we're figuring it out." Explaining how a calculator app kid built something 1,000 people use daily.

Icarus gave me a voice I didn't know I had. It taught me that vulnerability beats perfection. That saying "I don't know, let's find out together" builds more community than pretending you have all the answers.

The DMs I get now aren't just bug reports—they're people saying "your videos made me start coding" or "I was about to quit my project until I saw you struggle through the same thing." That's impact. That's the ripple effect you can't plan for but chase forever once you taste it.

## The Future (Or: Why I'll Never Drop This Game)

The dream is bigger now. But the mission is the same: keep Icarus free for the kid on a Core 2 Duo who can't afford another subscription. Everything that costs me money—servers, sync, multiplayer—will have a price tag. Everything else? That's my gift back to the community that saved me.

Online sync so you can work across devices. Live multiplayer collaboration so teams can strategize in real-time. A public lineup repository. Maybe even support for other games like Marvel Rivals.

The core remains: local-first, open-source, built with passion. Icarus is on GitHub for anyone to fork, modify, or learn from. Maybe a Marvel Rivals player will find it and think, "Hey, planning strategies kinda sucks. I can fix that." That's the cycle I want to continue.

The match replay feature is coming. I have the JSON pipeline working manually; now I just need to connect it to the live API. It seemed impossible a year ago. Now it's just another problem to solve.

## The Feeling

Someone asked me recently if I've flown too close to the sun. Maybe I have. But in those moments—when the rotation finally works, when a user posts their perfect lineup, when I merge a PR that helps other developers—I feel nothing but peace and happiness.

I love Icarus. I love the community. I love that a tool born from rage has become a source of joy for thousands. I love that my side project taught me more than any class ever could.

The best advice I can give to any young developer? Find something that pisses you off and fix it. Don't contribute to open source for the sake of it. Contribute because you're actively using a framework and find a bug that'll impact others. Build because you need the tool. Learn because you're solving real problems.

I started as a hardstuck Platinum player who couldn't record VODs. Now I have 1,000 users, an Amazon internship, a million TikTok views, and a project that makes people's lives better.

Not bad for a calculator app developer.

---

*Icarus is open-source and available at [github.com/SunkenInTime/icarus](https://github.com/SunkenInTime/icarus). If you've ever lost work to a crashed tab, come join us. We've got local saves and a community that gets it.*
