---
title: "Icarus Dev Update: Custom Abilities, Rotations, and Math Gone Wrong"
description: "Where you finally use what you learnt in Pre-calc, and SVGs continue to haunt my dreams"
date: 2025-01-10
image: "/images/i_am_coding.png"
---
## The Good News First! 🎉

Remember when I said I was building an open-source Valorant strategy tool? Well, we've made some serious progress! We now have custom ability icons for (almost) all agents. Sorry Deadlock, you're still on my todo list.

The biggest win? We've got every agent imported - including Tejo, who was literally released yesterday. And yes, I'm absolutely going to brag about having Tejo's abilities implemented before Valoplant. Small victories, right?

## The Great Measurement Mystery 📏

Remember when you thought converting measurements would be simple? Yeah, me too. The journey of implementing custom ability icons turned into an adventure of converting between Icarus's measurement system and Valorant's meters.

Here's a fun story: I initially used Sova's recon dart as a reference point because... well, I main Sova, and it seemed logical at the time. I spent hours comparing my implementation with Valoplant's, getting increasingly frustrated when things weren't lining up. After about three hours of hair-pulling, I had a revolutionary thought: "Why don't I just check the actual game?"





Plot twist: Valoplant's proposed size for Sova's dart was off by about 3 meters in-game.

![Sova's dart in Valoplant](/images/valoplant_sova_dart.png)

![Sova's dart in-game](/images/ingame_sova_dart.png)

 Also, during this debugging marathon, I discovered my map drawing was "slightly" (read: significantly) elongated. Nothing like fixing one bug to discover three more!


## The Web Plot Twist 🌐

Remember how I said Icarus would be strictly offline? Well... plans change! I'm considering a web version, but with a twist. The idea is to host it on a free tier initially to make it more accessible. Once we hit a sizeable user base (and it starts costing me money), we'll charge for the website and online sync features - but keep everything free on desktop/iPad applications. Because why make things simple when you can make them interesting?

## Current Battles with Flutter 🥊

### The Center Point Saga
Getting center point dragging to work properly has been... an experience. Here's what I've tried:

1. **The Almost Solution**: Calculate the center point when `AbilityInfo` gets its widget. Works great until you resize the window, then everything breaks because the data is set at compile time, not runtime.

2. **The Other Almost Solution**: Set it when the AbilityWidget is used in-app. Perfectly fine until you try to drag an ability for the first time, then it's about as centered as my sleep schedule.

3. **The Theoretical Solution**: Make only the ability icon draggable and wrap everything else. Sounds great in theory, still figuring out the implementation. Currently filed under "good ideas I haven't broken yet."

### The Rotation Saga 🔄

If you ever want to watch a developer lose their mind, ask them to implement dynamic widget rotation in Flutter. Here's why:

Flutter's `Offset.direction` returns values in radians from -π to π, which sounds reasonable until you realize it's assuming positive y-axis values go DOWN. Why? Because Flutter's coordinate system starts at the top-left corner. Thanks for the existential crisis, Flutter!

Here's a diagram incase you're a little confused:
![flutter radians cheat sheet](https://l7y6qjyp5m.ufs.sh/f/usun6XPoM0UCXCQD7JMcWBO57RMVIl8LFsfHGu6Ub1teynah)


After abandoning `direction` entirely, I went old school with trigonometry. `atan()` seemed like the answer until edge cases appeared. Finally, `atan2()` saved the day - shoutout to the friend who recommended it! Though now the widgets snap back to their previous orientation when dragged, because apparently we can't have nice things.

Here's what it currently looks like:
![Current image of icarus](https://l7y6qjyp5m.ufs.sh/f/usun6XPoM0UCpPdLpPeWNaYX3kSziMD5UmKObA6uIe7wB0Zl)

## Coming Soon™ Features 🚀

- Custom ability widgets for special cases (looking at you, Astra ult and Harbor wall)
- Dynamically scaling ability widgets (pray for me)
- Making everything pretty (goodbye random colors!)
- Fixing the center point and rotation issues (estimated time: somewhere between "a day" and "when pigs fly")
- More painting options and proper undo functionality
- Saving capabilities (once I figure out all the ability stuff)
- That YouTube video I promised (it's coming, really!)

Want to check out the project or contribute? Find it at [Github](https://github.com/SunkenInTime/icarus)

*Well that's all folks...Toodles*😝
