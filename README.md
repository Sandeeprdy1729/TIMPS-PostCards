# TIMPS PostCards

Daily news of What Happened in AI and Technology 

[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.gg/MmsTNm8WF6)

---

## Community

Join the TIMPS Discord community for real-time updates, discussion, and announcements:

**[discord.gg/MmsTNm8WF6](https://discord.gg/MmsTNm8WF6)**

---

## Dynamic Island (installed app)

Every daily issue is announced in a Dynamic-Island-style capsule inside the installed PWA — a black pill under the notch that expands to the day's five headlines. It works on iPhone (Safari, added to Home Screen, iOS 16.4+) and Android (Chrome, installed or in-browser).

How it fits together:

1. `assets/dynamic-island.js` renders the capsule in a shadow root and reads the five `.story-card` headlines (from the current issue, or the latest issue fetched from the home/archive page).
2. `sw.js` injects that script into every HTML page it serves, so new **and** existing issues get the island without editing each file. It also forwards push payloads to any open app window, which lights up the island live.
3. `.github/workflows/notify.yml` extracts the five headlines with `pick-title.py --json` and posts them to `api/send.js`, which broadcasts them with the push.
4. Tapping a notification opens the issue with `?island=1`, so the capsule starts expanded.

To include it explicitly in a new daily page (recommended), add before `</body>`:

```html
<script src="../assets/dynamic-island.js" defer></script>
```

Nothing else is needed — the issue number, date, and headlines are read from the existing `.cover-meta` and `.story-card` markup.

> A PWA cannot draw inside the hardware Dynamic Island itself; iOS only exposes that to native apps via ActivityKit. This recreates the look and behaviour in-app on both platforms.

---

## Related Projects

- [TIMPS](https://github.com/Sandeeprdy1729/timps) — The AI coding agent that remembers everything
- [TIMPS-Coder](https://github.com/Sandeeprdy1729/TIMPS-Coder) — Fine-tuned 0.5B bug-fixing model
- [TIMPS Swarm](https://github.com/Sandeeprdy1729/timps-swarm) — 64-agent local AI swarm
- [SkillGalaxy](https://github.com/Sandeeprdy1729/skill_galaxy) — Claude skills marketplace
- [Claude Design Skill](https://github.com/Sandeeprdy1729/claude-design-skill) — Design skill for Claude

---

## License

MIT
