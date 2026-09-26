---
name: offer-scout
description: >
  Find money-making proposal opportunities from live market evidence, never from guesswork. Browses freelance marketplaces, job boards and classifieds in the user's topic, pulls real listings with dates, budgets and client counts, then produces 100 ranked offer ideas and shortlists the top 10 by Leverage Gap Score (return versus total cost in money, time, energy and mental load, weighted in favour of return). Use this skill whenever the user says "find me work", "what should I sell", "proposal ideas", "money-making ideas", "check freelance sites", "what pays in this niche", "top 100 ideas", "shortlist the best offers", or names a topic and asks what to pitch. Feeds the proposal-writer skill.
---

# Offer Scout

## CRITICAL: Auto-start on load

When this skill triggers, go straight to Step 1. Do not summarise the method. Do not brainstorm from memory before the research is done. Every idea in the output must trace back to a listing you actually opened.

## Language rule

Reply in the language the user writes in. If the user writes in Persian, all output tables, headings and commentary are in Persian. Keep platform names, currencies and URLs in their original form. Keep the skill logic identical in any language.

## Step 1. Gather the brief

Call AskUserQuestion:

```json
[
  {
    "question": "What topic or skill area should I scout?",
    "header": "Topic",
    "multiSelect": false,
    "options": [
      {"label": "I will type it", "description": "Type the exact topic, service or skill after this"},
      {"label": "Pull from about-me.md", "description": "Use the skills, niche and audience in my voice files"}
    ]
  },
  {
    "question": "Which market are you selling into?",
    "header": "Market",
    "multiSelect": true,
    "options": [
      {"label": "Global remote", "description": "Upwork, Fiverr, Freelancer, PeoplePerHour, Contra, Toptal, Malt, Guru"},
      {"label": "Iran domestic", "description": "Ponisha, Karlancer, Parscoders, Jobinja, Jobvision, E-Estekhdam, Divar, Sheypoor, Bazarkar"},
      {"label": "Direct B2B outbound", "description": "No marketplace. Pitch companies directly by email or LinkedIn"},
      {"label": "Productised or digital", "description": "Gumroad, Lemon Squeezy, template shops, courses, paid communities"}
    ]
  },
  {
    "question": "What can you actually put in?",
    "header": "Capacity",
    "multiSelect": false,
    "options": [
      {"label": "Low", "description": "Under 10 hours a week, near zero cash to invest, need money inside 30 days"},
      {"label": "Medium", "description": "10 to 25 hours a week, small budget for tools, 30 to 90 day horizon"},
      {"label": "High", "description": "Full time, budget for tools and subcontractors, willing to build for 90 days plus"}
    ]
  },
  {
    "question": "What does a win look like?",
    "header": "Target",
    "multiSelect": false,
    "options": [
      {"label": "Fast cash", "description": "First payment inside 2 to 4 weeks, size less important"},
      {"label": "Recurring retainer", "description": "Monthly income that repeats without re-selling"},
      {"label": "High ticket", "description": "Fewer, larger projects with a big single fee"},
      {"label": "Compounding asset", "description": "Product, template or system that sells again with no extra delivery"}
    ]
  }
]
```

Also confirm in one line: currency for all numbers, and any hard exclusions (industries, clients or work types the user refuses).

If the user picked "Pull from about-me.md", read `about-me.md` and `voice.md` from the project root. If they are missing, say so and ask for the topic in one line.

## Step 2. Research the live market

Use live browsing. Order of preference:

1. Claude for Chrome extension
2. Playwright MCP
3. WebSearch plus WebFetch

If none is available, stop and tell the user. Never fabricate a market scan.

Work through `references/sources.md` for the selected markets. Minimum evidence bar before you may write a single idea:

- At least **40 real listings opened and read**, spread across at least **5 different sources**
- At least **25 of them posted within the last 30 days**
- For each listing capture: source, title, URL, posted date, stated budget or rate, number of proposals or applicants, client history if visible, required skills, and the pain in the client's own words
- Record everything in a working file at `outputs/offer-scout/market-evidence.md`

Search patterns to run on every marketplace, swapping in the topic:

- `[topic]` sorted by newest
- `[topic]` filtered to highest budget
- `[topic] urgent` or `[topic] fix`
- `[topic] monthly` or `[topic] ongoing` or `[topic] retainer`
- `[topic] automation`, `[topic] audit`, `[topic] migration`, `[topic] setup`

On job boards also scan full-time adverts. A role posted three times in six months is a company that will buy the same work as a contract.

While reading, tag three signals on every listing:

- **Repeat demand**: the same request appears from many different clients
- **Underserved**: high budget with few proposals, or complaints about bad previous suppliers
- **Unbundleable**: one slice of a big job that can be sold on its own in days, not months

## Step 3. Build the 100

Turn the evidence into exactly 100 distinct offer ideas. Rules for the pool:

- Every idea names a buyer, a promise, a deliverable and a price, and cites at least one evidence listing
- No two ideas may share the same buyer and the same deliverable
- Spread the pool across five buckets so the shortlist has real choice:
  - 30 quick-cash services (deliver in under a week)
  - 25 retainers and ongoing work
  - 20 high ticket projects
  - 15 productised or digital assets
  - 10 arbitrage or unusual plays found in the evidence
- Price every idea against the observed budgets in the evidence, never against a memory of typical rates

Write the full 100 to `outputs/offer-scout/100-offers.md` as a table:

```
| # | Offer name | Buyer | Promise (outcome) | Deliverable | Price (currency) | Evidence (source + link + date) | Bucket |
```

## Step 4. Score and shortlist the 10

Apply `references/scoring-rubric.md` to all 100. Summary of the model:

Return axes, scored 1 to 10: cash size, speed to first payment, repeatability, asset compounding, strategic leverage.
Cost axes, scored 1 to 10 where 10 is expensive: money out, time in, mental and emotional load, skill gap, delivery and maintenance risk.

```
R = 0.30*cash + 0.20*speed + 0.20*repeat + 0.15*asset + 0.15*leverage
C = 0.25*money + 0.30*time + 0.25*mental + 0.10*skillgap + 0.10*risk
Gap = (1.6 * R) - C
LGS = round(((Gap + 8.4) / 23.4) * 100)
```

The 1.6 multiplier is deliberate. Return outweighs cost, as the user asked.

Three gates run before ranking. Any idea failing a gate is out, no matter its score:

1. **Evidence gate**: fewer than 3 live listings in the last 30 days supporting the demand
2. **Capacity gate**: required time or cash exceeds what the user declared in Step 1
3. **Floor gate**: expected first payment is below the user's stated fast-cash or ticket target

Rank the survivors by LGS. Take the top 10. Apply one diversification rule: no more than 4 of the 10 may come from the same bucket. If a bucket is over-represented, drop the lowest scorers in it and promote the next best from another bucket, and say in one line that you did it.

## Step 5. Output

Post this in chat, in the user's language.

### 5a. Headline table

```
| Rank | Offer | Buyer | Price | Time to first payment | Total cost (money/time/energy) | Expected 90-day return | LGS |
```

### 5b. One card per shortlisted offer

```
## [Rank]. [Offer name] — LGS [score]

**Buyer**: who pays, and how you reach them
**The promise**: the outcome in the buyer's words
**Deliverable**: exactly what is handed over
**Price**: number, and why the market supports it
**Cost breakdown**: money [x], time [y hours], mental load [note], skill gap [note]
**Return breakdown**: first payment [when], 90-day estimate [range], repeat potential [note]
**Why the gap is wide**: two lines
**Proof from the market**: 2 to 3 listings with links and dates
**First three moves**: three actions, each doable today
**Kill signal**: the evidence that would tell you to drop this
```

### 5c. Closing block

- One line naming the single offer to start this week and why
- One line on the biggest risk across the shortlist
- The file paths written: `outputs/offer-scout/market-evidence.md`, `outputs/offer-scout/100-offers.md`, `outputs/offer-scout/top-10.md`
- This handoff: "Say the rank number and I will run proposal-writer to build the full sales proposal for it."

Write the shortlist and the cards to `outputs/offer-scout/top-10.md`.

## Rules

- Never invent a listing, a budget, a date, a link or a client count. If a number is not visible, write "not stated".
- Never skip the 100 and jump to the 10. The shortlist is only as good as the pool.
- Never score from vibes. Every axis score needs a one-line justification held in the working file.
- Always show the maths trail for the top 10 so the user can challenge a score.
- Always price in the user's stated currency, with the source currency in brackets if converted, plus the rate and date used.
- Always prefer evidence from the last 30 days. Anything older than 90 days does not count towards the evidence gate.
- Never recommend work the user excluded in Step 1.
- Never promise earnings. Use ranges and label them estimates.
- British English. DD/MM/YYYY dates. No em dashes.
