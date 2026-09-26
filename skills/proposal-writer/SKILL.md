---
name: proposal-writer
description: >
  Turn a chosen offer into a sales proposal that closes. Grounds every claim in live market evidence, prices against real observed budgets, and writes the full document: buyer pain, outcome, scope with exclusions, timeline, price options, risk reversal, proof, and next step. Also produces the short platform bid version and the follow-up sequence. Use this skill whenever the user says "write a proposal", "write a sales proposal", "send a quote", "pitch this client", "bid on this job", "write the Upwork proposal", or picks a ranked offer from offer-scout. Runs after offer-scout, or standalone when the user already knows what they are selling.
---

# Proposal Writer

## CRITICAL: Auto-start on load

When this skill triggers, go straight to Step 1. Do not summarise the method. Never write a proposal from assumption. If a fact is missing, either research it or ask, then write.

## Language rule

Write the proposal in the language the buyer reads, not the language of the chat. Ask if it is unclear. Persian proposals use Persian numerals only where the rest of the document does, and keep currencies and tool names in their original form.

## Step 1. Load the offer

Check for `outputs/offer-scout/top-10.md`. If it exists, ask which rank to build. If the user names a rank, load that card and skip straight to Step 2.

If there is no offer-scout output, call AskUserQuestion:

```json
[
  {
    "question": "What are you proposing, and to whom?",
    "header": "Offer",
    "multiSelect": false,
    "options": [
      {"label": "I will paste the brief", "description": "Paste the client brief, job advert or listing URL"},
      {"label": "I will describe it", "description": "Type the service, buyer and rough price"},
      {"label": "Run offer-scout first", "description": "I do not know yet. Research the market and shortlist for me"}
    ]
  },
  {
    "question": "How will this be sent?",
    "header": "Channel",
    "multiSelect": false,
    "options": [
      {"label": "Marketplace bid", "description": "Upwork, Ponisha, Freelancer. Short, under 250 words, no attachments"},
      {"label": "Email or PDF", "description": "Full document to a named decision maker"},
      {"label": "Direct message", "description": "LinkedIn or Telegram. Very short, conversational"},
      {"label": "Formal tender", "description": "Structured response against stated requirements"}
    ]
  },
  {
    "question": "How should it be priced?",
    "header": "Pricing",
    "multiSelect": false,
    "options": [
      {"label": "Three options", "description": "Good, better, best. Anchors high and lets the buyer choose"},
      {"label": "Single fixed price", "description": "One number, one scope"},
      {"label": "Retainer", "description": "Monthly fee for ongoing work"},
      {"label": "Paid diagnostic first", "description": "Small paid first step that leads to the main project"}
    ]
  }
]
```

If the user picks "Run offer-scout first", hand over to the offer-scout skill and stop.

## Step 2. Research before writing

Never skip this, even when the user is in a hurry. Spend the time on four things:

1. **The buyer**. Website, recent posts, funding, team size, the product they sell, and the person who will read this. Find the name.
2. **Their current state**. Look at what they already have in the area you are pitching. Screenshots, page speed, missing tracking, broken flow, thin content, whatever is visible. One specific observed flaw beats a page of generic pitch.
3. **The price anchor**. Pull 3 to 5 comparable live listings or public prices from `../offer-scout/references/sources.md` and record budget, date and link.
4. **The competition**. On a marketplace, read the top competing profiles for the same job. Note what every one of them says so you can say something else.

Record findings at `outputs/proposals/[buyer-slug]/research.md`. If anything cannot be verified, list it as an assumption in the proposal rather than stating it as fact.

## Step 3. Choose the price

Use `references/pricing-playbook.md`. Decide:

- The anchor: the highest comparable price you found, with its link
- The value gap: what the outcome is worth to the buyer per month, in their numbers where possible
- The floor: your cost in hours multiplied by your minimum acceptable rate
- The number: never a round guess, always tied to the anchor and the value gap
- The payment terms: deposit percentage, milestones, and what triggers the final payment

If the value of the outcome cannot be estimated from anything real, say so in the proposal and price on scope instead. Never invent an ROI figure.

## Step 4. Write the proposal

Full document structure, in this order. Templates in `references/templates.md`.

1. **Title and one-line outcome**. Their words, their metric.
2. **What I saw**. Two to four lines of specific observed evidence about their situation. Proves the proposal is not a template.
3. **The cost of leaving it**. What the problem costs them, monthly, with the basis shown.
4. **The plan**. Three to five named phases, each with what is done, what is handed over, and when.
5. **What is included and what is not**. Exclusions are a selling tool. They kill scope creep and signal experience.
6. **Timeline**. Dates, not durations. Start date tied to signature and deposit.
7. **Price**. Options table with the recommended one marked. Payment terms underneath.
8. **Risk reversal**. Pick one that you can honour: fixed price, first milestone refundable, unlimited revisions inside the defined scope, or a named performance condition.
9. **Proof**. Relevant work only. If there is no case study, offer a paid pilot or a free specific teardown instead of vague claims.
10. **Why me**. Four lines maximum, all of it about their problem.
11. **The next step**. One action, a date, and a link. Never "let me know your thoughts".

Hard limits: full document 700 to 1,100 words. Marketplace bid 150 to 250 words. Direct message under 120 words.

## Step 5. Score the draft before sending

Score out of 10 on each and show the table:

| Check | Pass condition |
|---|---|
| Specificity | At least 3 facts that could only apply to this buyer |
| Outcome-led | The first 50 words are about them, not you |
| Scope clarity | Deliverables and exclusions both listed |
| Price logic | Anchor and basis shown, terms stated |
| Risk | One concrete reversal the user can honour |
| Proof | Relevant, verifiable, no invented metrics |
| CTA | One action, one date, one link |
| Length | Inside the limit for the channel |

Anything under 8 gets rewritten before output, not flagged for later.

## Step 6. Output

Deliver in one message:

1. The full proposal, ready to send
2. The short version for the channel chosen in Step 1
3. A subject line, plus two alternatives
4. A three-touch follow-up sequence: day 3, day 7, day 14, each under 80 words and each adding something new
5. Answers to the three most likely objections, from `references/objections.md`
6. The score table from Step 5
7. File paths written: `outputs/proposals/[buyer-slug]/proposal.md`, `short.md`, `followups.md`, `research.md`

## Rules

- Never invent a client name, metric, testimonial, certificate or past result.
- Never send a price without a basis the user can defend out loud.
- Never open with "I hope this finds you well", "I am excited", or the user's own biography.
- Always name one thing you observed about the buyer in the first three lines.
- Always list exclusions. A proposal with no exclusions is an unpriced project.
- Always give a deadline on the price and on the next step.
- Always separate assumptions from facts under a visible heading.
- Never over-promise to win the job. The proposal is the delivery contract.
- British English for English output. DD/MM/YYYY dates. No em dashes.
