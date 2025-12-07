# Risk Model Profiles

**Last Updated:** December 4, 2025

Anti-detect.com now supports configurable trust-score weighting so each vertical can emphasize the detection layers that matter most. Profiles are stored in Cloudflare D1 (`scoring_profiles` table) and exposed through `/score/profiles`.

## Built-in Presets

| Slug | Name | Description |
| --- | --- | --- |
| `balanced` | Balanced Baseline | Mirrors the historical DEFAULT_WEIGHTS for general browsing | 
| `ad-fraud` | Ad-Fraud Hunter | Heavily penalizes network/IP anomalies and automation indicators |
| `finance` | Banking & KYC | Pushes navigator + locale accuracy for compliance workloads |

## Layer Weights Reference

| Layer | Typical Signals | When to increase weight |
| --- | --- | --- |
| `network` | WebRTC leaks, IP risk, TLS | Traffic integrity / anti-fraud |
| `navigator` | UA, platform, device metrics | KYC, anti-account sharing |
| `graphics` | Canvas / WebGL | Automation or anti-cheat |
| `audio` | AudioContext fingerprint | Media DRM, anti-spoof |
| `fonts` | Installed fonts | Anti-bot fingerprinting |
| `locale` | Timezone vs. language consistency | Geo/regional compliance |
| `automation` | webdriver, CDP traces | Bot, RPA, scrapers |

## API

```
GET    /score/profiles
GET    /score/profiles/:id
POST   /score/profiles      (name, slug?, weights, description?, useCase?, isDefault?)
PUT    /score/profiles/:id
DELETE /score/profiles/:id
```

JSON body example:

```json
{
  "name": "High-Risk Ad Campaign",
  "slug": "ads-q1",
  "description": "Strict network hygiene for Q1 performance marketing",
  "useCase": "Advertising",
  "weights": {
    "network": 0.35,
    "navigator": 0.1,
    "graphics": 0.15,
    "audio": 0.05,
    "fonts": 0.1,
    "locale": 0.1,
    "automation": 0.15
  },
  "isDefault": false
}
```

## Frontend Usage

- Scanner home page fetches `/api/score/profiles` (via Next.js rewrite) and persists the selected slug in `localStorage` as `risk-profile`.
- Selected weights are passed directly into `calculateTrustScore(fingerprint, undefined, weights)` so the offline preview matches API scoring.
- Reports now include `historyKey` and `metadata.profileId` so historical diffs capture which model generated each session.
- `/settings/models` offers CRUD UI for ops teams (no auth yet—deploy behind Access before production launch).
