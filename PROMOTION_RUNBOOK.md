# Benny Bundles × TAGJ — Promotion Runbook

Updated: 2026-10-10  
Current campaign: **Wanted Me Gone**  
Evergreen campaign URL after V15.35 deploy: **/now**

## Operating rule

Every promotional surface should resolve to one of three outcomes:

1. **Watch** the verified current release.
2. **Share** the evergreen `/now` campaign route.
3. **Follow** an official Benny Bundles profile.

Do not scatter campaign traffic across unverified release URLs. The official release dossier remains the factual source; `/now` is the promotional source.

## Activation gate

**Do not publish `/now` externally until V15.35 is deployed.**  
The source branch and QA support it, but the current Vercel Hobby account has hit its 100 API-deployments/day quota. Once the quota resets, deploy the green V15.35 branch once, smoke-test `/now`, then activate these social links.

## Actual Metricool signal — 2026-09-01 through 2026-10-10

Connected brand: Benny Bundles (`@ben_alexander96`)  
Timezone: America/New_York

Recent Instagram Reel signal:

- **Don’t Judge Off Pt. 2** — 261 reach / 320 views. Highest reach in the connected window.
- **Foot on the Gas** — 71 reach / 105 views / 3 interactions / 42.25 engagement. Strongest engagement rate in the connected window.
- **Stamp on It** — 57 reach / 78 views / 1 interaction / 17.54 engagement.
- Recent observed Reels produced effectively **zero saves and shares**, so promotion should explicitly ask for one share/save action instead of only asking for a watch.

Working inference: shorter, direct release copy can travel farther; question/hook language can improve engagement, but the campaign currently needs explicit share behavior.

## Account-specific publishing windows

These windows come from Metricool’s connected-audience timing model, not generic industry averages.

### Instagram
Primary weekday window: **10:00 AM ET**.  
Secondary window: **5:00–6:00 PM ET**, especially Tuesday–Thursday.

Strongest modeled weekday hours:
- Monday 10 AM
- Tuesday 10 AM / 6 PM
- Wednesday 10 AM
- Thursday 10 AM / 6 PM
- Friday 10 AM

Weekend:
- Saturday 10 AM
- Sunday 10 AM or 6–7 PM

### YouTube
Primary window: **4:00 PM ET** Monday–Friday.  
Wednesday and Thursday currently show the strongest modeled audience at that hour.

### Facebook
Primary window: **10:00 AM–12:00 PM ET** Monday–Friday.  
Wednesday noon is currently the strongest modeled hour.

## Seven-day free campaign loop

Do not flood every network with the same asset at the same second. Reuse the same release with different jobs.

| Day | Time ET | Channel | Job |
|---|---:|---|---|
| Sat | 6:00 PM | Instagram | Short Reel/story reminder: “send this to one person” |
| Sun | 10:00 AM | Instagram | Poster/carousel or Reel recut, single CTA |
| Mon | 10:00 AM | Instagram + Facebook | Current-release push with `/now` |
| Mon | 4:00 PM | YouTube | Short/Community support touchpoint |
| Tue | 10:00 AM | Instagram | Lyric/bar hook; one question |
| Tue | 6:00 PM | Instagram | Story/repost support reminder |
| Wed | 12:00 PM | Facebook | Link-forward campaign post |
| Wed | 4:00 PM | YouTube | Short/reaction-friendly clip |
| Thu | 10:00 AM | Instagram | Behind-the-scenes/self-produced angle |
| Thu | 6:00 PM | Instagram | “send it to one person” CTA |
| Fri | 10:00 AM | Instagram + Facebook | Weekly proof / current-run recap |
| Fri | 4:00 PM | YouTube | Weekend discovery push |

## Campaign copy

### Instagram
Benny Bundles — “Wanted Me Gone.” Official cinematic music video out now. Produced, mixed, mastered, shot and edited by Benny Bundles through TAGJ.

Watch it. Send it to one person. Link in bio.

#BennyBundles #WantedMeGone #TAGJ #IndependentArtist #NewMusic

### Facebook
Benny Bundles — “Wanted Me Gone.” Official cinematic music video out now. Produced, mixed, mastered, shot and edited in-house through TAGJ. Watch the full video and share it with one person who listens to independent hip-hop.

### Bluesky
Benny Bundles — “Wanted Me Gone.” Official cinematic music video out now. Produced, mixed, mastered, shot + edited by Benny Bundles through TAGJ. Watch + share: /now

### YouTube Community
“Wanted Me Gone” is the current Benny Bundles release. Watch the official cinematic video, then send it to one person who would actually run it back. /now

## Attribution URLs

Once V15.35 is live:

- Instagram: `/now?utm_source=instagram&utm_medium=social&utm_campaign=wanted_me_gone`
- Facebook: `/now?utm_source=facebook&utm_medium=social&utm_campaign=wanted_me_gone`
- YouTube: `/now?utm_source=youtube&utm_medium=social&utm_campaign=wanted_me_gone`
- Bluesky: `/now?utm_source=bluesky&utm_medium=social&utm_campaign=wanted_me_gone`
- LinkedIn: `/now?utm_source=linkedin&utm_medium=social&utm_campaign=wanted_me_gone`
- Reddit/community: `/now?utm_source=reddit&utm_medium=community&utm_campaign=wanted_me_gone`

## Promotion QA before each release rotation

- Update `tagj-data/current-campaign.v1.json`.
- Update campaign static metadata/artwork for crawler-safe fallback.
- Update home current-release signal.
- Confirm release dossier and VideoObject JSON-LD.
- Confirm `/now` reaches the current campaign.
- Confirm Open Graph image is absolute in public build.
- Confirm campaign share sheet uses `/now`.
- Run protected-preview QA and public-SEO QA.
- Deploy **once** after green QA to preserve Hobby deployment quota.
- Smoke-test iPhone/Safari, campaign share sheet, Beat Vault and EPK.
