# Development Roadmap - Anti-detect Browser Fingerprinting Platform

**Project Duration:** 45 days
**Estimated Hours:** 360-400 hours
**Team Size:** 1-2 developers
**Deployment Target:** Cloudflare Workers + Pages

---

## Phase 0: Project Setup (Days 1-2)

### Objective
Bootstrap the monorepo infrastructure and provision all Cloudflare services.

### Files to Create

```
/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── tsconfig.base.json
├── .husky/
│   ├── pre-commit
│   └── commit-msg
└── wrangler.toml
```

### Tasks

#### 1. Monorepo Initialization (4 hours)

**Commands:**
```bash
# Initialize root package.json
pnpm init

# Install workspace dependencies
pnpm add -D -w turbo typescript @types/node

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Create turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
EOF
```

#### 2. TypeScript Configuration (2 hours)

**Create `tsconfig.base.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true,
    "noEmit": true,
    "paths": {
      "@repo/core": ["./packages/core/src"],
      "@repo/types": ["./packages/types/src"],
      "@repo/consistency": ["./packages/consistency/src"],
      "@repo/ui": ["./packages/ui/src"]
    }
  }
}
```

#### 3. Linting & Formatting (2 hours)

**Install dependencies:**
```bash
pnpm add -D -w eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D -w prettier eslint-config-prettier eslint-plugin-prettier
```

**Create `.eslintrc.js`:**
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
  }
};
```

**Create `.prettierrc`:**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### 4. Git Hooks Setup (1 hour)

```bash
pnpm add -D -w husky lint-staged
npx husky init

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
pnpm lint-staged
EOF

chmod +x .husky/pre-commit
```

**Add to `package.json`:**
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

#### 5. Cloudflare Account Setup (3 hours)

**Required Services:**
- Workers (API hosting)
- Pages (Frontend hosting)
- D1 (SQLite database)
- KV (Key-value storage)
- R2 (Object storage)

**Commands:**
```bash
# Install Wrangler CLI
pnpm add -D -w wrangler

# Login to Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create fingerprint-db

# Create KV namespaces
npx wrangler kv:namespace create "FINGERPRINTS"
npx wrangler kv:namespace create "REPORTS"
npx wrangler kv:namespace create "RATE_LIMIT"

# Create R2 bucket
npx wrangler r2 bucket create fingerprint-reports
```

**Create `wrangler.toml`:**
```toml
name = "antidetect-api"
main = "apps/api/src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "fingerprint-db"
database_id = "YOUR_D1_ID"

[[kv_namespaces]]
binding = "FINGERPRINTS"
id = "YOUR_KV_ID_1"

[[kv_namespaces]]
binding = "REPORTS"
id = "YOUR_KV_ID_2"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "YOUR_KV_ID_3"

[[r2_buckets]]
binding = "REPORTS_BUCKET"
bucket_name = "fingerprint-reports"
```

### Acceptance Criteria

- ✅ `pnpm install` runs without errors
- ✅ `pnpm turbo build` executes (even if no packages yet)
- ✅ Git hooks prevent commits with linting errors
- ✅ All Cloudflare services are provisioned
- ✅ Wrangler can authenticate successfully

### Potential Blockers

| Blocker | Solution |
|---------|----------|
| Cloudflare account limits | Use free tier initially, upgrade if needed |
| pnpm workspace resolution issues | Check Node.js version >= 18.0.0 |
| Husky not executing | Run `chmod +x .husky/*` manually |

---

## Phase 1: Core Packages (Days 3-5)

### Objective
Build the foundational packages that all other layers depend on.

### Package Structure

```
packages/
├── types/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── fingerprint.ts
│       ├── scanner.ts
│       └── api.ts
├── core/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts
│       ├── collectors/
│       │   ├── index.ts
│       │   ├── hardware.ts
│       │   ├── browser.ts
│       │   ├── network.ts
│       │   ├── webrtc.ts
│       │   ├── canvas.ts
│       │   ├── webgl.ts
│       │   ├── audio.ts
│       │   ├── fonts.ts
│       │   ├── media.ts
│       │   └── behavioral.ts
│       ├── hasher.ts
│       └── utils.ts
├── consistency/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── validators/
│       │   ├── hardware-os.ts
│       │   ├── browser-features.ts
│       │   ├── timezone-language.ts
│       │   └── screen-resolution.ts
│       └── scorer.ts
└── ui/
    ├── package.json
    ├── tsconfig.json
    ├── postcss.config.js
    ├── tailwind.config.ts
    └── src/
        ├── index.ts
        ├── button.tsx
        ├── card.tsx
        ├── badge.tsx
        ├── progress.tsx
        └── spinner.tsx
```

### 1.1 packages/types (Day 3 - 4 hours)

**Create `packages/types/package.json`:**
```json
{
  "name": "@repo/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

**Key Type Definitions:**

**`src/fingerprint.ts`:**
```typescript
export interface HardwareFingerprint {
  cpuCores: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  platform: string;
  vendor: string;
  oscpu?: string;
}

export interface BrowserFingerprint {
  userAgent: string;
  vendor: string;
  language: string;
  languages: string[];
  cookieEnabled: boolean;
  doNotTrack: string | null;
  plugins: Array<{ name: string; description: string; filename: string }>;
  mimeTypes: Array<{ type: string; suffixes: string; description: string }>;
}

export interface NetworkFingerprint {
  ip: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface CanvasFingerprint {
  hash: string;
  text: string;
  emoji: string;
}

export interface WebGLFingerprint {
  vendor: string;
  renderer: string;
  version: string;
  shadingLanguageVersion: string;
  extensions: string[];
  parameters: Record<string, any>;
}

export interface CompleteFingerprint {
  hardware: HardwareFingerprint;
  browser: BrowserFingerprint;
  network: NetworkFingerprint;
  canvas: CanvasFingerprint;
  webgl: WebGLFingerprint;
  webrtc: WebRTCFingerprint;
  audio: AudioFingerprint;
  fonts: FontFingerprint;
  media: MediaFingerprint;
  behavioral: BehavioralFingerprint;
  timestamp: number;
  sessionId: string;
}

export interface TrustScore {
  overall: number; // 0-100
  layers: {
    hardware: number;
    browser: number;
    network: number;
    webrtc: number;
    canvas: number;
    webgl: number;
    audio: number;
  };
  inconsistencies: Inconsistency[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface Inconsistency {
  type: 'hardware-os' | 'browser-features' | 'timezone-language' | 'screen-resolution';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details: Record<string, any>;
}
```

**Testing:**
```bash
cd packages/types
pnpm tsc --noEmit
```

### 1.2 packages/core (Day 3-4 - 12 hours)

**Create `packages/core/package.json`:**
```json
{
  "name": "@repo/core",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@repo/types": "workspace:*"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**Collector Implementation Priority:**

1. **`collectors/hardware.ts`** (1 hour)
```typescript
import type { HardwareFingerprint } from '@repo/types';

export function collectHardware(): HardwareFingerprint {
  return {
    cpuCores: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory || 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    platform: navigator.platform,
    vendor: navigator.vendor,
    oscpu: (navigator as any).oscpu,
  };
}
```

2. **`collectors/browser.ts`** (1.5 hours)
```typescript
export function collectBrowser(): BrowserFingerprint {
  const plugins = Array.from(navigator.plugins).map(p => ({
    name: p.name,
    description: p.description,
    filename: p.filename,
  }));

  const mimeTypes = Array.from(navigator.mimeTypes).map(m => ({
    type: m.type,
    suffixes: m.suffixes,
    description: m.description,
  }));

  return {
    userAgent: navigator.userAgent,
    vendor: navigator.vendor,
    language: navigator.language,
    languages: [...navigator.languages],
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    plugins,
    mimeTypes,
  };
}
```

3. **`collectors/canvas.ts`** (2 hours)
```typescript
import { hash } from '../hasher';

export function collectCanvas(): CanvasFingerprint {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas not supported');

  // Text rendering
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  const text = 'Cwm fjordbank glyphs vext quiz, 😃';
  ctx.fillText(text, 2, 15);

  // Emoji rendering
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('🎨🌈', 4, 17);

  const dataUrl = canvas.toDataURL();

  return {
    hash: hash(dataUrl),
    text: dataUrl.slice(0, 100),
    emoji: ctx.measureText('🎨').width.toString(),
  };
}
```

4. **`collectors/webgl.ts`** (2 hours)
```typescript
export function collectWebGL(): WebGLFingerprint {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  if (!gl) throw new Error('WebGL not supported');

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

  return {
    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '',
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '',
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    extensions: gl.getSupportedExtensions() || [],
    parameters: {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    },
  };
}
```

5. **`collectors/webrtc.ts`** (2 hours)
```typescript
export async function collectWebRTC(): Promise<WebRTCFingerprint> {
  const localIPs: string[] = [];

  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.createDataChannel('');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pc.close();
        resolve({
          localIPs,
          publicIP: null,
          leaked: localIPs.length > 0,
        });
      }, 2000);

      pc.onicecandidate = (event) => {
        if (!event.candidate) return;

        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const match = ipRegex.exec(event.candidate.candidate);

        if (match && !localIPs.includes(match[1])) {
          localIPs.push(match[1]);
        }
      };
    });
  } catch (error) {
    return {
      localIPs: [],
      publicIP: null,
      leaked: false,
      error: error.message,
    };
  }
}
```

6. **`collectors/audio.ts`** (1.5 hours)
7. **`collectors/fonts.ts`** (1.5 hours)
8. **`collectors/media.ts`** (1 hour)
9. **`collectors/behavioral.ts`** (1.5 hours)

**`src/hasher.ts`:**
```typescript
export function hash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
```

**`src/index.ts`:**
```typescript
export * from './collectors';
export * from './hasher';
export * from './utils';

export async function collectAllFingerprints(): Promise<CompleteFingerprint> {
  const sessionId = crypto.randomUUID();

  const [
    hardware,
    browser,
    canvas,
    webgl,
    webrtc,
    audio,
    fonts,
  ] = await Promise.all([
    collectHardware(),
    collectBrowser(),
    collectCanvas(),
    collectWebGL(),
    collectWebRTC(),
    collectAudio(),
    collectFonts(),
  ]);

  return {
    hardware,
    browser,
    canvas,
    webgl,
    webrtc,
    audio,
    fonts,
    timestamp: Date.now(),
    sessionId,
  };
}
```

**Testing Setup:**

**`vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

**Create tests:**
```bash
mkdir -p packages/core/src/__tests__
```

**`src/__tests__/hardware.test.ts`:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { collectHardware } from '../collectors/hardware';

describe('Hardware Collector', () => {
  it('should collect hardware info', () => {
    const result = collectHardware();
    expect(result).toHaveProperty('cpuCores');
    expect(result).toHaveProperty('platform');
    expect(typeof result.cpuCores).toBe('number');
  });

  it('should handle missing properties gracefully', () => {
    const original = navigator.hardwareConcurrency;
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: undefined,
      configurable: true,
    });

    const result = collectHardware();
    expect(result.cpuCores).toBe(0);

    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: original,
      configurable: true,
    });
  });
});
```

**Run tests:**
```bash
cd packages/core
pnpm test
```

### 1.3 packages/consistency (Day 5 - 6 hours)

**Create `packages/consistency/package.json`:**
```json
{
  "name": "@repo/consistency",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "dependencies": {
    "@repo/types": "workspace:*"
  }
}
```

**Key Validators:**

**`src/validators/hardware-os.ts`:**
```typescript
import type { Inconsistency, CompleteFingerprint } from '@repo/types';

export function validateHardwareOS(fp: CompleteFingerprint): Inconsistency[] {
  const issues: Inconsistency[] = [];

  // Check if platform matches user agent
  const ua = fp.browser.userAgent.toLowerCase();
  const platform = fp.hardware.platform.toLowerCase();

  if (ua.includes('windows') && !platform.includes('win')) {
    issues.push({
      type: 'hardware-os',
      severity: 'high',
      message: 'User Agent indicates Windows but platform does not match',
      details: { ua, platform },
    });
  }

  if (ua.includes('mac') && !platform.includes('mac')) {
    issues.push({
      type: 'hardware-os',
      severity: 'high',
      message: 'User Agent indicates macOS but platform does not match',
      details: { ua, platform },
    });
  }

  return issues;
}
```

**`src/validators/browser-features.ts`:**
```typescript
export function validateBrowserFeatures(fp: CompleteFingerprint): Inconsistency[] {
  const issues: Inconsistency[] = [];

  // Check if WebGL is available but canvas is not
  if (fp.webgl && !fp.canvas) {
    issues.push({
      type: 'browser-features',
      severity: 'medium',
      message: 'WebGL available but Canvas fingerprint missing',
      details: {},
    });
  }

  // Check plugin count anomalies
  if (fp.browser.plugins.length === 0 && !fp.browser.userAgent.includes('Chrome')) {
    issues.push({
      type: 'browser-features',
      severity: 'low',
      message: 'No plugins detected (unusual for non-Chrome browsers)',
      details: { pluginCount: 0 },
    });
  }

  return issues;
}
```

**`src/scorer.ts`:**
```typescript
import type { CompleteFingerprint, TrustScore, Inconsistency } from '@repo/types';
import { validateHardwareOS } from './validators/hardware-os';
import { validateBrowserFeatures } from './validators/browser-features';
import { validateTimezoneLanguage } from './validators/timezone-language';

export function calculateTrustScore(fp: CompleteFingerprint): TrustScore {
  const inconsistencies: Inconsistency[] = [
    ...validateHardwareOS(fp),
    ...validateBrowserFeatures(fp),
    ...validateTimezoneLanguage(fp),
  ];

  // Calculate severity penalty
  let penalty = 0;
  inconsistencies.forEach(issue => {
    if (issue.severity === 'low') penalty += 5;
    if (issue.severity === 'medium') penalty += 15;
    if (issue.severity === 'high') penalty += 30;
  });

  const overall = Math.max(0, 100 - penalty);

  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overall >= 80) riskLevel = 'low';
  else if (overall >= 60) riskLevel = 'medium';
  else if (overall >= 40) riskLevel = 'high';
  else riskLevel = 'critical';

  return {
    overall,
    layers: {
      hardware: 100,
      browser: 100,
      network: 100,
      webrtc: 100,
      canvas: 100,
      webgl: 100,
      audio: 100,
    },
    inconsistencies,
    riskLevel,
  };
}
```

### 1.4 packages/ui (Day 5 - 4 hours)

**Create `packages/ui/package.json`:**
```json
{
  "name": "@repo/ui",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "react": "^18.3.1",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0"
  }
}
```

**Create basic components:**

**`src/button.tsx`:**
```typescript
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-semibold transition-all';

  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Additional components to create:**
- `src/card.tsx` - Card container
- `src/badge.tsx` - Status badges
- `src/progress.tsx` - Progress bars
- `src/spinner.tsx` - Loading spinners

### Acceptance Criteria

- ✅ All packages build successfully with `pnpm turbo build`
- ✅ Core package tests pass with >80% coverage
- ✅ Type checking passes across all packages
- ✅ Can import types from `@repo/types` in other packages
- ✅ Collectors return proper data in browser environment

### Potential Blockers

| Blocker | Solution |
|---------|----------|
| Browser APIs not available in tests | Use jsdom or happy-dom |
| Circular dependencies | Ensure proper package separation |
| Canvas/WebGL not working in tests | Mock the APIs or use integration tests |

---

## Phase 2: API Development (Days 6-10)

### Objective
Build the Cloudflare Workers API with Hono framework.

### Directory Structure

```
apps/api/
├── package.json
├── tsconfig.json
├── wrangler.toml
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── scan.ts
│   │   ├── ip.ts
│   │   ├── generate.ts
│   │   ├── challenge.ts
│   │   └── report.ts
│   ├── middleware/
│   │   ├── cors.ts
│   │   ├── rate-limit.ts
│   │   ├── auth.ts
│   │   └── error.ts
│   ├── db/
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── queries.ts
│   └── utils/
│       ├── ip-lookup.ts
│       └── tls-check.ts
└── scripts/
    └── migrate.ts
```

### 2.1 App Setup (Day 6 - 2 hours)

**Create `apps/api/package.json`:**
```json
{
  "name": "@repo/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "db:migrate": "wrangler d1 execute fingerprint-db --file=./src/db/schema.sql",
    "db:seed": "wrangler d1 execute fingerprint-db --file=./src/db/seed.sql"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@repo/types": "workspace:*",
    "@repo/consistency": "workspace:*"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240000.0",
    "wrangler": "^3.0.0"
  }
}
```

### 2.2 Database Schema (Day 6 - 3 hours)

**`src/db/schema.sql`:**
```sql
-- Fingerprint scans table
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  fingerprint JSON NOT NULL,
  trust_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  inconsistencies JSON NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  INDEX idx_session (session_id),
  INDEX idx_created (created_at)
);

-- IP lookup cache
CREATE TABLE IF NOT EXISTS ip_cache (
  ip TEXT PRIMARY KEY,
  country TEXT,
  city TEXT,
  isp TEXT,
  is_vpn INTEGER DEFAULT 0,
  is_proxy INTEGER DEFAULT 0,
  is_tor INTEGER DEFAULT 0,
  cached_at INTEGER NOT NULL
);

-- Generated fingerprints
CREATE TABLE IF NOT EXISTS generated_fingerprints (
  id TEXT PRIMARY KEY,
  browser_type TEXT NOT NULL,
  os_type TEXT NOT NULL,
  fingerprint JSON NOT NULL,
  created_at INTEGER NOT NULL
);

-- Challenge arena scores
CREATE TABLE IF NOT EXISTS challenge_scores (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  passed INTEGER DEFAULT 0,
  score INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  INDEX idx_level (level),
  INDEX idx_score (score DESC)
);

-- Shared reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL,
  fingerprint JSON NOT NULL,
  trust_score INTEGER NOT NULL,
  views INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  INDEX idx_created (created_at),
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);
```

**Run migration:**
```bash
cd apps/api
pnpm db:migrate
```

### 2.3 Core Routes (Days 7-9)

#### 2.3.1 Scan Routes (Day 7 - 4 hours)

**`src/routes/scan.ts`:**
```typescript
import { Hono } from 'hono';
import { calculateTrustScore } from '@repo/consistency';
import type { CompleteFingerprint } from '@repo/types';

const scan = new Hono<{ Bindings: Env }>();

// POST /api/scan/start - Initialize scan session
scan.post('/start', async (c) => {
  const sessionId = crypto.randomUUID();

  // Store in KV with 30 min TTL
  await c.env.FINGERPRINTS.put(
    `session:${sessionId}`,
    JSON.stringify({ status: 'started', timestamp: Date.now() }),
    { expirationTtl: 1800 }
  );

  return c.json({
    sessionId,
    status: 'started',
  });
});

// POST /api/scan/collect - Submit fingerprint data
scan.post('/collect', async (c) => {
  const body = await c.req.json<{
    sessionId: string;
    fingerprint: CompleteFingerprint;
  }>();

  // Validate session
  const session = await c.env.FINGERPRINTS.get(`session:${body.sessionId}`);
  if (!session) {
    return c.json({ error: 'Invalid session' }, 400);
  }

  // Calculate trust score
  const trustScore = calculateTrustScore(body.fingerprint);

  // Store in D1
  const scanId = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO scans (id, session_id, fingerprint, trust_score, risk_level, inconsistencies, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      scanId,
      body.sessionId,
      JSON.stringify(body.fingerprint),
      trustScore.overall,
      trustScore.riskLevel,
      JSON.stringify(trustScore.inconsistencies),
      Date.now()
    )
    .run();

  return c.json({
    scanId,
    trustScore,
    fingerprint: body.fingerprint,
  });
});

// GET /api/scan/:id - Get scan results
scan.get('/:id', async (c) => {
  const scanId = c.req.param('id');

  const result = await c.env.DB.prepare(`
    SELECT * FROM scans WHERE id = ?
  `)
    .bind(scanId)
    .first();

  if (!result) {
    return c.json({ error: 'Scan not found' }, 404);
  }

  return c.json({
    id: result.id,
    fingerprint: JSON.parse(result.fingerprint as string),
    trustScore: {
      overall: result.trust_score,
      riskLevel: result.risk_level,
      inconsistencies: JSON.parse(result.inconsistencies as string),
    },
    createdAt: result.created_at,
  });
});

export default scan;
```

#### 2.3.2 IP Routes (Day 7 - 3 hours)

**`src/routes/ip.ts`:**
```typescript
import { Hono } from 'hono';

const ip = new Hono<{ Bindings: Env }>();

// GET /api/ip/check - Get current IP info
ip.get('/check', async (c) => {
  const clientIP = c.req.header('CF-Connecting-IP') || '';

  // Check cache first
  const cached = await c.env.DB.prepare(`
    SELECT * FROM ip_cache WHERE ip = ? AND cached_at > ?
  `)
    .bind(clientIP, Date.now() - 86400000) // 24h cache
    .first();

  if (cached) {
    return c.json({
      ip: cached.ip,
      country: cached.country,
      city: cached.city,
      isp: cached.isp,
      flags: {
        vpn: cached.is_vpn === 1,
        proxy: cached.is_proxy === 1,
        tor: cached.is_tor === 1,
      },
    });
  }

  // Fetch from Cloudflare or external service
  const ipInfo = await fetchIPInfo(clientIP);

  // Cache result
  await c.env.DB.prepare(`
    INSERT OR REPLACE INTO ip_cache (ip, country, city, isp, is_vpn, is_proxy, is_tor, cached_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      clientIP,
      ipInfo.country,
      ipInfo.city,
      ipInfo.isp,
      ipInfo.vpn ? 1 : 0,
      ipInfo.proxy ? 1 : 0,
      ipInfo.tor ? 1 : 0,
      Date.now()
    )
    .run();

  return c.json(ipInfo);
});

// POST /api/ip/dns-leak - Check for DNS leaks
ip.post('/dns-leak', async (c) => {
  const { dnsServers } = await c.req.json<{ dnsServers: string[] }>();

  const leaks = dnsServers.filter(dns => {
    // Check if DNS server is different from expected VPN DNS
    return !dns.startsWith('10.') && !dns.startsWith('172.') && !dns.startsWith('192.168.');
  });

  return c.json({
    leaked: leaks.length > 0,
    leakedServers: leaks,
    severity: leaks.length > 0 ? 'high' : 'none',
  });
});

async function fetchIPInfo(ip: string) {
  // Use Cloudflare's IP geolocation or external API
  // For now, return mock data
  return {
    ip,
    country: 'US',
    city: 'San Francisco',
    isp: 'Example ISP',
    vpn: false,
    proxy: false,
    tor: false,
  };
}

export default ip;
```

#### 2.3.3 Generate Routes (Day 8 - 4 hours)

**`src/routes/generate.ts`:**
```typescript
import { Hono } from 'hono';
import type { CompleteFingerprint } from '@repo/types';

const generate = new Hono<{ Bindings: Env }>();

// POST /api/generate - Generate realistic fingerprint
generate.post('/', async (c) => {
  const { browserType, osType, options } = await c.req.json<{
    browserType: 'chrome' | 'firefox' | 'safari' | 'edge';
    osType: 'windows' | 'macos' | 'linux';
    options?: {
      canvas?: boolean;
      webgl?: boolean;
      audio?: boolean;
    };
  }>();

  // Generate based on real fingerprint distributions
  const fingerprint: CompleteFingerprint = generateFingerprint(browserType, osType, options);

  // Store in D1
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO generated_fingerprints (id, browser_type, os_type, fingerprint, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)
    .bind(id, browserType, osType, JSON.stringify(fingerprint), Date.now())
    .run();

  return c.json({
    id,
    fingerprint,
    exportFormats: {
      puppeteer: generatePuppeteerCode(fingerprint),
      playwright: generatePlaywrightCode(fingerprint),
      selenium: generateSeleniumCode(fingerprint),
    },
  });
});

function generateFingerprint(
  browserType: string,
  osType: string,
  options?: any
): CompleteFingerprint {
  // Implementation based on real browser fingerprints
  // This would use statistical distributions from collected data
  return {
    hardware: {
      cpuCores: osType === 'windows' ? 8 : 4,
      deviceMemory: 8,
      hardwareConcurrency: 8,
      maxTouchPoints: 0,
      platform: osType === 'windows' ? 'Win32' : 'MacIntel',
      vendor: 'Google Inc.',
    },
    browser: {
      userAgent: getUserAgent(browserType, osType),
      vendor: 'Google Inc.',
      language: 'en-US',
      languages: ['en-US', 'en'],
      cookieEnabled: true,
      doNotTrack: null,
      plugins: [],
      mimeTypes: [],
    },
    // ... other layers
    timestamp: Date.now(),
    sessionId: crypto.randomUUID(),
  };
}

function generatePuppeteerCode(fp: CompleteFingerprint): string {
  return `
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
  args: [
    '--user-agent=${fp.browser.userAgent}',
    '--window-size=1920,1080',
  ]
});

const page = await browser.newPage();

// Override navigator properties
await page.evaluateOnNewDocument(() => {
  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: () => ${fp.hardware.hardwareConcurrency}
  });

  Object.defineProperty(navigator, 'deviceMemory', {
    get: () => ${fp.hardware.deviceMemory}
  });
});
  `.trim();
}

function generatePlaywrightCode(fp: CompleteFingerprint): string {
  return `
const { chromium } = require('playwright');

const browser = await chromium.launch({
  args: ['--window-size=1920,1080']
});

const context = await browser.newContext({
  userAgent: '${fp.browser.userAgent}',
  viewport: { width: 1920, height: 1080 },
  locale: '${fp.browser.language}',
});
  `.trim();
}

function generateSeleniumCode(fp: CompleteFingerprint): string {
  return `
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--user-agent=${fp.browser.userAgent}')
options.add_argument('--window-size=1920,1080')

driver = webdriver.Chrome(options=options)
  `.trim();
}

export default generate;
```

#### 2.3.4 Challenge Routes (Day 8 - 3 hours)

**`src/routes/challenge.ts`:**
```typescript
import { Hono } from 'hono';

const challenge = new Hono<{ Bindings: Env }>();

// POST /api/challenge/submit - Submit challenge attempt
challenge.post('/submit', async (c) => {
  const { sessionId, level, fingerprint } = await c.req.json();

  let passed = false;
  let score = 0;

  switch (level) {
    case 1: // Basic check
      passed = await checkLevel1(fingerprint);
      score = passed ? 100 : 0;
      break;
    case 2: // Canvas check
      passed = await checkLevel2(fingerprint);
      score = passed ? 250 : 0;
      break;
    case 3: // TLS check
      passed = await checkLevel3(c, fingerprint);
      score = passed ? 500 : 0;
      break;
    case 4: // Turnstile
      passed = await checkLevel4(c);
      score = passed ? 1000 : 0;
      break;
  }

  // Store result
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO challenge_scores (id, session_id, level, passed, score, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
    .bind(id, sessionId, level, passed ? 1 : 0, score, Date.now())
    .run();

  return c.json({
    passed,
    score,
    level,
  });
});

// GET /api/challenge/leaderboard - Get top scores
challenge.get('/leaderboard', async (c) => {
  const results = await c.env.DB.prepare(`
    SELECT session_id, SUM(score) as total_score, MAX(level) as max_level
    FROM challenge_scores
    WHERE passed = 1
    GROUP BY session_id
    ORDER BY total_score DESC
    LIMIT 100
  `).all();

  return c.json(results.results || []);
});

async function checkLevel1(fp: any): Promise<boolean> {
  // Check for obvious automation markers
  return !fp.browser.userAgent.includes('HeadlessChrome');
}

async function checkLevel2(fp: any): Promise<boolean> {
  // Check canvas uniqueness
  return fp.canvas && fp.canvas.hash.length > 0;
}

async function checkLevel3(c: any, fp: any): Promise<boolean> {
  // TLS fingerprint validation
  const tlsFingerprint = c.req.header('CF-TLS-Fingerprint');
  return tlsFingerprint !== undefined;
}

async function checkLevel4(c: any): Promise<boolean> {
  // Verify Turnstile token
  const token = c.req.header('CF-Turnstile-Token');
  // Implement Turnstile verification
  return token !== undefined;
}

export default challenge;
```

#### 2.3.5 Report Routes (Day 9 - 3 hours)

**`src/routes/report.ts`:**
```typescript
import { Hono } from 'hono';

const report = new Hono<{ Bindings: Env }>();

// POST /api/report/create - Create shareable report
report.post('/create', async (c) => {
  const { scanId, expiresIn } = await c.req.json<{
    scanId: string;
    expiresIn?: number; // milliseconds
  }>();

  // Fetch scan data
  const scan = await c.env.DB.prepare(`
    SELECT * FROM scans WHERE id = ?
  `)
    .bind(scanId)
    .first();

  if (!scan) {
    return c.json({ error: 'Scan not found' }, 404);
  }

  const reportId = crypto.randomUUID();
  const expiresAt = expiresIn ? Date.now() + expiresIn : null;

  await c.env.DB.prepare(`
    INSERT INTO reports (id, scan_id, fingerprint, trust_score, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
    .bind(
      reportId,
      scanId,
      scan.fingerprint,
      scan.trust_score,
      Date.now(),
      expiresAt
    )
    .run();

  return c.json({
    reportId,
    url: `https://yourdomain.com/report/${reportId}`,
    expiresAt,
  });
});

// GET /api/report/:id - Get report data
report.get('/:id', async (c) => {
  const reportId = c.req.param('id');

  const report = await c.env.DB.prepare(`
    SELECT * FROM reports WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)
  `)
    .bind(reportId, Date.now())
    .first();

  if (!report) {
    return c.json({ error: 'Report not found or expired' }, 404);
  }

  // Increment view count
  await c.env.DB.prepare(`
    UPDATE reports SET views = views + 1 WHERE id = ?
  `)
    .bind(reportId)
    .run();

  return c.json({
    id: report.id,
    fingerprint: JSON.parse(report.fingerprint as string),
    trustScore: report.trust_score,
    views: (report.views as number) + 1,
    createdAt: report.created_at,
  });
});

// GET /api/report/:id/pdf - Generate PDF report
report.get('/:id/pdf', async (c) => {
  const reportId = c.req.param('id');

  // Generate PDF and store in R2
  const pdf = await generatePDFReport(reportId, c.env.DB);

  const key = `reports/${reportId}.pdf`;
  await c.env.REPORTS_BUCKET.put(key, pdf);

  return c.json({
    url: `https://your-r2-domain.com/${key}`,
  });
});

async function generatePDFReport(reportId: string, db: any): Promise<ArrayBuffer> {
  // Use a PDF generation library or service
  // For now, return empty buffer
  return new ArrayBuffer(0);
}

export default report;
```

### 2.4 Middleware (Day 9 - 3 hours)

**`src/middleware/cors.ts`:**
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export function setupCORS(app: Hono) {
  app.use('/*', cors({
    origin: ['https://yourdomain.com', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }));
}
```

**`src/middleware/rate-limit.ts`:**
```typescript
import type { Context, Next } from 'hono';

export async function rateLimit(c: Context<{ Bindings: Env }>, next: Next) {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const key = `ratelimit:${ip}`;

  const current = await c.env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current) : 0;

  if (count >= 100) { // 100 requests per minute
    return c.json({ error: 'Rate limit exceeded' }, 429);
  }

  await c.env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 60 });
  await next();
}
```

**`src/middleware/error.ts`:**
```typescript
import type { Context } from 'hono';

export function errorHandler(error: Error, c: Context) {
  console.error('API Error:', error);

  return c.json({
    error: error.message || 'Internal server error',
    timestamp: Date.now(),
  }, 500);
}
```

### 2.5 Main App (Day 10 - 2 hours)

**`src/index.ts`:**
```typescript
import { Hono } from 'hono';
import { setupCORS } from './middleware/cors';
import { rateLimit } from './middleware/rate-limit';
import { errorHandler } from './middleware/error';

import scan from './routes/scan';
import ip from './routes/ip';
import generate from './routes/generate';
import challenge from './routes/challenge';
import report from './routes/report';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
setupCORS(app);
app.use('*', rateLimit);
app.onError(errorHandler);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Routes
app.route('/api/scan', scan);
app.route('/api/ip', ip);
app.route('/api/generate', generate);
app.route('/api/challenge', challenge);
app.route('/api/report', report);

export default app;
```

### Testing API (Day 10 - 2 hours)

**Create test script:**

**`scripts/test-api.sh`:**
```bash
#!/bin/bash

API_URL="http://localhost:8787"

echo "Testing /api/scan/start..."
SESSION=$(curl -s -X POST "$API_URL/api/scan/start" | jq -r '.sessionId')
echo "Session ID: $SESSION"

echo "Testing /api/ip/check..."
curl -s "$API_URL/api/ip/check" | jq

echo "Testing /api/generate..."
curl -s -X POST "$API_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{"browserType":"chrome","osType":"windows"}' | jq '.id'

echo "Testing /api/challenge/leaderboard..."
curl -s "$API_URL/api/challenge/leaderboard" | jq
```

**Run tests:**
```bash
chmod +x scripts/test-api.sh
pnpm dev # In one terminal
./scripts/test-api.sh # In another
```

### Acceptance Criteria

- ✅ All API endpoints return 200/201 for valid requests
- ✅ Rate limiting works (429 after threshold)
- ✅ CORS headers are correct
- ✅ Database queries execute without errors
- ✅ KV storage works for sessions
- ✅ Error handling returns proper JSON responses

### Potential Blockers

| Blocker | Solution |
|---------|----------|
| D1 query syntax errors | Test queries in Wrangler console first |
| KV TTL not working | Check expirationTtl parameter format |
| CORS issues | Add all necessary origins and headers |
| Rate limiting too aggressive | Adjust limits per endpoint |

---

## Phase 3: Frontend - Scanner (Days 11-15)

### Objective
Build the homepage scanner with real-time fingerprint collection and trust score visualization.

### Directory Structure

```
apps/web/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       └── og/
│           └── route.tsx
├── components/
│   ├── scanner/
│   │   ├── TrustScoreGauge.tsx
│   │   ├── DetectionCard.tsx
│   │   ├── ScanButton.tsx
│   │   └── ResultsPanel.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   └── ui/
│       └── (shadcn components)
├── lib/
│   ├── scanner.ts
│   ├── api-client.ts
│   └── utils.ts
└── hooks/
    ├── useScan.ts
    └── useFingerprint.ts
```

### 3.1 Next.js Setup (Day 11 - 2 hours)

**Create `apps/web/package.json`:**
```json
{
  "name": "@repo/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@repo/core": "workspace:*",
    "@repo/types": "workspace:*",
    "@repo/ui": "workspace:*",
    "framer-motion": "^11.0.0",
    "recharts": "^2.12.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

**`next.config.js`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/core', '@repo/types', '@repo/ui'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
```

### 3.2 TrustScoreGauge Component (Day 11 - 4 hours)

**`components/scanner/TrustScoreGauge.tsx`:**
```typescript
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrustScoreGaugeProps {
  score: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  animate?: boolean;
}

export function TrustScoreGauge({ score, riskLevel, animate = true }: TrustScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const duration = 2000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animate]);

  const circumference = 2 * Math.PI * 90; // radius = 90
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  const colors = {
    low: '#10b981', // green
    medium: '#f59e0b', // yellow
    high: '#ef4444', // red
    critical: '#7c3aed', // purple
  };

  return (
    <div className="relative w-64 h-64">
      <svg className="transform -rotate-90 w-full h-full">
        {/* Background circle */}
        <circle
          cx="128"
          cy="128"
          r="90"
          stroke="#e5e7eb"
          strokeWidth="20"
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx="128"
          cy="128"
          r="90"
          stroke={colors[riskLevel]}
          strokeWidth="20"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-6xl font-bold"
          style={{ color: colors[riskLevel] }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.5, type: 'spring' }}
        >
          {displayScore}
        </motion.div>
        <div className="text-gray-500 text-sm mt-2">Trust Score</div>
        <div
          className="text-xs font-semibold mt-1 px-3 py-1 rounded-full"
          style={{
            backgroundColor: `${colors[riskLevel]}20`,
            color: colors[riskLevel],
          }}
        >
          {riskLevel.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
```

### 3.3 DetectionCard Components (Day 12 - 6 hours)

**`components/scanner/DetectionCard.tsx`:**
```typescript
'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DetectionCardProps {
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  details?: Record<string, any>;
  index?: number;
}

export function DetectionCard({
  title,
  description,
  status,
  details,
  index = 0
}: DetectionCardProps) {
  const icons = {
    pass: <CheckCircle className="w-6 h-6 text-green-500" />,
    fail: <XCircle className="w-6 h-6 text-red-500" />,
    warning: <AlertCircle className="w-6 h-6 text-yellow-500" />,
  };

  const borders = {
    pass: 'border-green-200',
    fail: 'border-red-200',
    warning: 'border-yellow-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`border-2 ${borders[status]} rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">{icons[status]}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>

          {details && (
            <div className="mt-4 space-y-2">
              {Object.entries(details).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-500">{key}:</span>
                  <span className="font-mono text-gray-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
```

**Create cards for all 7 layers:**
1. Hardware Detection Card
2. Browser Detection Card
3. Network Detection Card
4. WebRTC Detection Card
5. Canvas Detection Card
6. WebGL Detection Card
7. Audio Detection Card

### 3.4 Scan Orchestration (Day 13 - 6 hours)

**`lib/scanner.ts`:**
```typescript
import { collectAllFingerprints } from '@repo/core';
import type { CompleteFingerprint, TrustScore } from '@repo/types';

export class Scanner {
  private apiUrl: string;
  private sessionId: string | null = null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async startSession(): Promise<string> {
    const response = await fetch(`${this.apiUrl}/api/scan/start`, {
      method: 'POST',
    });

    const data = await response.json();
    this.sessionId = data.sessionId;
    return this.sessionId;
  }

  async collectFingerprint(): Promise<CompleteFingerprint> {
    return await collectAllFingerprints();
  }

  async submitFingerprint(fingerprint: CompleteFingerprint): Promise<{
    scanId: string;
    trustScore: TrustScore;
  }> {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    const response = await fetch(`${this.apiUrl}/api/scan/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        fingerprint,
      }),
    });

    return await response.json();
  }

  async runFullScan(): Promise<{
    fingerprint: CompleteFingerprint;
    trustScore: TrustScore;
    scanId: string;
  }> {
    // Start session
    await this.startSession();

    // Collect fingerprint
    const fingerprint = await this.collectFingerprint();

    // Submit for analysis
    const { scanId, trustScore } = await this.submitFingerprint(fingerprint);

    return {
      fingerprint,
      trustScore,
      scanId,
    };
  }
}
```

**`hooks/useScan.ts`:**
```typescript
'use client';

import { useState } from 'react';
import { Scanner } from '@/lib/scanner';
import type { CompleteFingerprint, TrustScore } from '@repo/types';

interface ScanState {
  isScanning: boolean;
  progress: number;
  fingerprint: CompleteFingerprint | null;
  trustScore: TrustScore | null;
  scanId: string | null;
  error: string | null;
}

export function useScan() {
  const [state, setState] = useState<ScanState>({
    isScanning: false,
    progress: 0,
    fingerprint: null,
    trustScore: null,
    scanId: null,
    error: null,
  });

  const runScan = async () => {
    setState(prev => ({ ...prev, isScanning: true, progress: 0, error: null }));

    try {
      const scanner = new Scanner(process.env.NEXT_PUBLIC_API_URL || '');

      // Progress updates
      setState(prev => ({ ...prev, progress: 20 }));

      const result = await scanner.runFullScan();

      setState(prev => ({ ...prev, progress: 100 }));

      setTimeout(() => {
        setState({
          isScanning: false,
          progress: 100,
          fingerprint: result.fingerprint,
          trustScore: result.trustScore,
          scanId: result.scanId,
          error: null,
        });
      }, 500);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isScanning: false,
        error: error instanceof Error ? error.message : 'Scan failed',
      }));
    }
  };

  const reset = () => {
    setState({
      isScanning: false,
      progress: 0,
      fingerprint: null,
      trustScore: null,
      scanId: null,
      error: null,
    });
  };

  return {
    ...state,
    runScan,
    reset,
  };
}
```

### 3.5 Homepage Implementation (Days 14-15 - 8 hours)

**`app/page.tsx`:**
```typescript
'use client';

import { TrustScoreGauge } from '@/components/scanner/TrustScoreGauge';
import { DetectionCard } from '@/components/scanner/DetectionCard';
import { Button } from '@repo/ui';
import { useScan } from '@/hooks/useScan';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { isScanning, progress, fingerprint, trustScore, scanId, error, runScan, reset } = useScan();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Browser Fingerprint Scanner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover how websites track you. Test your browser's anti-detection capabilities.
          </p>
        </div>

        {/* Scanner Section */}
        <div className="max-w-4xl mx-auto">
          {!fingerprint && !isScanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Button
                onClick={runScan}
                size="lg"
                className="px-12 py-6 text-xl"
              >
                Start Fingerprint Scan
              </Button>
            </motion.div>
          )}

          {isScanning && (
            <div className="text-center">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600" />
              </div>
              <p className="mt-4 text-gray-600">Scanning... {progress}%</p>
            </div>
          )}

          {trustScore && (
            <div className="space-y-8">
              {/* Trust Score */}
              <div className="flex justify-center">
                <TrustScoreGauge
                  score={trustScore.overall}
                  riskLevel={trustScore.riskLevel}
                />
              </div>

              {/* Detection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetectionCard
                  title="Hardware Detection"
                  description="CPU, memory, and device characteristics"
                  status={trustScore.layers.hardware > 80 ? 'pass' : 'warning'}
                  details={fingerprint?.hardware}
                  index={0}
                />
                <DetectionCard
                  title="Browser Detection"
                  description="User agent, plugins, and browser features"
                  status={trustScore.layers.browser > 80 ? 'pass' : 'warning'}
                  details={{
                    userAgent: fingerprint?.browser.userAgent.slice(0, 50) + '...',
                    language: fingerprint?.browser.language,
                  }}
                  index={1}
                />
                <DetectionCard
                  title="Canvas Fingerprint"
                  description="Unique rendering patterns"
                  status={trustScore.layers.canvas > 80 ? 'pass' : 'fail'}
                  details={{ hash: fingerprint?.canvas.hash }}
                  index={2}
                />
                <DetectionCard
                  title="WebGL Fingerprint"
                  description="GPU and graphics capabilities"
                  status={trustScore.layers.webgl > 80 ? 'pass' : 'fail'}
                  details={{
                    vendor: fingerprint?.webgl.vendor,
                    renderer: fingerprint?.webgl.renderer,
                  }}
                  index={3}
                />
                {/* Add remaining cards */}
              </div>

              {/* Inconsistencies */}
              {trustScore.inconsistencies.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">
                    Detected Inconsistencies
                  </h3>
                  <ul className="space-y-2">
                    {trustScore.inconsistencies.map((issue, i) => (
                      <li key={i} className="text-sm text-red-700">
                        <span className="font-semibold">{issue.type}:</span> {issue.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <Button onClick={() => window.location.href = `/report/${scanId}`}>
                  View Full Report
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Scan Again
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700">{error}</p>
              <Button onClick={reset} className="mt-4">Try Again</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Acceptance Criteria

- ✅ Scanner collects all fingerprint data
- ✅ Trust score animates smoothly
- ✅ All 7 detection cards render correctly
- ✅ Mobile responsive design works
- ✅ Error states are handled gracefully
- ✅ Loading states show proper feedback

### Potential Blockers

| Blocker | Solution |
|---------|----------|
| Framer Motion animation lag | Use `useReducedMotion` hook for accessibility |
| Fingerprint collection fails | Add try-catch blocks per collector |
| API CORS errors | Verify CORS middleware configuration |

---

## Phase 4-10 Summary

Due to length constraints, here's a condensed overview of remaining phases:

### **Phase 4: Frontend - Generator (Days 16-18)**
- FingerprintSelector component with dropdowns
- Generated fingerprint display with syntax highlighting
- Export format tabs (Puppeteer/Playwright/Selenium)
- Copy-to-clipboard functionality

### **Phase 5: Challenge Arena (Days 19-22)**
- Level progression UI
- Client-side detection bypass tests
- Server-side TLS fingerprint validation
- Turnstile integration
- Leaderboard with real-time updates

### **Phase 6: Additional Tools (Days 23-26)**
- WebRTC leak test with STUN server detection
- Canvas fingerprint analyzer with visual comparison
- Font enumeration checker
- TLS fingerprint display
- Timezone/language consistency checker

### **Phase 7: Reports & Sharing (Days 27-29)**
- Report creation flow with expiration options
- Shareable report page with unique URLs
- PDF generation using @cloudflare/workers-pdf
- OG image generation for social sharing
- View count tracking

### **Phase 8: SEO Content (Days 30-35)**
- MDX setup with next-mdx-remote
- 3 pillar pages (1000+ words each):
  - "What is Browser Fingerprinting?"
  - "How to Protect Against Fingerprinting"
  - "Anti-Detect Browser Comparison"
- Schema.org markup for articles
- Sitemap and robots.txt

### **Phase 9: Polish & Testing (Days 36-40)**
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Performance optimization (Lighthouse score >90)
- WCAG AA accessibility compliance
- Security headers and CSP
- Load testing with 1000+ concurrent users

### **Phase 10: Launch (Days 41-45)**
- Production deployment to Cloudflare
- Monitoring with Sentry
- Analytics with Plausible/Fathom
- Launch on Product Hunt
- SEO submission to Google

---

## Daily Checklist Template

```markdown
## Day X: [Phase Name]

### Morning (4 hours)
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Afternoon (4 hours)
- [ ] Task 4
- [ ] Task 5
- [ ] Testing

### Blockers
- None / [List any]

### Commits
- `feat: [description]`
- `fix: [description]`
```

---

## Key Commands Reference

```bash
# Install dependencies
pnpm install

# Development
pnpm turbo dev

# Build all
pnpm turbo build

# Test all
pnpm turbo test

# Deploy API
cd apps/api && pnpm deploy

# Deploy Web
cd apps/web && pnpm build && npx wrangler pages deploy .next

# Database
pnpm db:migrate
pnpm db:seed

# Type check
pnpm turbo type-check

# Lint
pnpm turbo lint
```

---

## Success Metrics

### Technical Metrics
- Build time < 2 minutes
- Test coverage > 80%
- Lighthouse score > 90
- API response time < 200ms
- Zero critical security issues

### User Metrics
- 10,000 scans in first month
- 5,000 unique visitors
- 100+ generated fingerprints
- 50+ challenge completions

---

This roadmap provides a practical, day-by-day guide for building the entire Anti-detect platform. Each phase builds on the previous one, with clear acceptance criteria and blocker mitigation strategies.
