# Leverage Gap Score (LGS)

The gap between what an offer gives back and what it takes out of you. Return is weighted heavier than cost on purpose.

## Return axes, 1 to 10, higher is better

| Axis | Weight | 1 to 3 | 4 to 7 | 8 to 10 |
|---|---|---|---|---|
| Cash size | 0.30 | Below the market floor for the topic | Around the observed median budget | Top quartile of observed budgets |
| Speed to first payment | 0.20 | Over 60 days | 14 to 60 days | Under 14 days, or deposit up front |
| Repeatability | 0.20 | One-off, must re-sell every time | Occasional repeat | Monthly retainer or subscription |
| Asset compounding | 0.15 | Nothing left behind | Reusable templates or process | Sellable product, case study and portfolio in one |
| Strategic leverage | 0.15 | Dead end client | Decent reference | Opens a sector, referrals, or a name worth citing |

## Cost axes, 1 to 10, higher means more expensive

| Axis | Weight | 1 to 3 | 4 to 7 | 8 to 10 |
|---|---|---|---|---|
| Money out | 0.25 | Free tools already owned | Modest subscriptions or ads | Heavy spend or subcontractors before payment |
| Time in | 0.30 | Under 5 hours to deliver | 5 to 30 hours | Over 30 hours, or an open-ended scope |
| Mental and emotional load | 0.25 | Calm, solo, defined | Some client management and revisions | Volatile clients, constant availability, high judgement fatigue |
| Skill gap | 0.10 | Can do it today | A weekend of ramp-up | Needs weeks of learning or a certificate |
| Delivery and maintenance risk | 0.10 | Hand over and done | Some support tail | Ongoing liability, refunds, uptime or legal exposure |

## Formula

```
R = 0.30*cash + 0.20*speed + 0.20*repeat + 0.15*asset + 0.15*leverage
C = 0.25*money + 0.30*time + 0.25*mental + 0.10*skillgap + 0.10*risk
Gap = (1.6 * R) - C
LGS = round(((Gap + 8.4) / 23.4) * 100)
```

LGS runs 0 to 100. Read it like this:

- 80 and above: start this week
- 65 to 79: strong, queue it behind the leader
- 50 to 64: viable but the cost side needs redesign before selling
- Below 50: drop, or strip it down until the cost axes fall

## Gates, applied before ranking

1. Evidence gate: fewer than 3 supporting listings from the last 30 days, out.
2. Capacity gate: time or money required exceeds the user's declared capacity, out.
3. Floor gate: expected first payment below the user's stated target, out.

## Worked example

Offer: "48-hour Google Ads waste audit for local clinics, fixed 8,000,000 IRR."

Return: cash 6, speed 9, repeat 7, asset 8, leverage 7
R = 1.8 + 1.8 + 1.4 + 1.2 + 1.05 = 7.25

Cost: money 2, time 3, mental 3, skillgap 2, risk 2
C = 0.5 + 0.9 + 0.75 + 0.2 + 0.2 = 2.55

Gap = 11.6 - 2.55 = 9.05
LGS = round(((9.05 + 8.4) / 23.4) * 100) = 75

## Cost-reduction moves to test before dropping an idea

- Cap the scope to a fixed deliverable with a named cut-off
- Take a deposit so money-out risk sits with the client
- Template the repeated 70 percent of the work
- Replace live calls with async video to cut mental load
- Sell a paid diagnostic first, so the big project is pre-qualified
