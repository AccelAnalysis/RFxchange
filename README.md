# The RFxchange

Production repository for **The RFxchange™**, a map-based local business growth network connecting organizations, opportunities, referrals, partners, resources, and measurable activity.

## Build strategy

Development follows the build waves in the RFxchange Master Feature Build Tracker. Changes should be delivered through reviewed branches and pull requests rather than pushed directly to `main`.

### Wave 0 — Product System

Wave 0 establishes the product language before transactional surfaces proliferate:

- public positioning and conversion paths;
- black-and-gold brand primitives and app mark;
- semantic color and typography tokens;
- map-first visual contracts and golden connection-path language;
- human-scale journey and measured-intelligence patterns;
- shared presentation system and audience emphasis;
- claims discipline and trademark rules;
- automated validation and CI gates.

See [`docs/product-system/WAVE_0.md`](docs/product-system/WAVE_0.md) for tracker-to-code evidence.

## Local development

Requires Node.js 24.18.x LTS.

```bash
npm install
npm run dev
```

Before opening a PR:

```bash
npm run check
```

> A lockfile should be generated and committed from the first trusted dependency install before deployment. It is intentionally not fabricated in this bootstrap.
