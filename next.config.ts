/**
 * @file next.config.ts
 * @description Next.js 16 configuration for the SalaryMan application.
 *
 * Next.js 16 changes that affect this file:
 *
 * 1. **Turbopack is now the default bundler** — `next dev` and `next build`
 *    both use Turbopack by default. The `--turbopack` flag is no longer needed
 *    for dev (it's implicit). Use `--webpack` to opt back to Webpack if needed.
 *    The `turbopack` config key is at the top level (not under `experimental`).
 *
 * 2. **`experimental.dynamicIO` → `cacheComponents`** — not used here, so no
 *    change required. Cache Components are opt-in.
 *
 * 3. **`experimental.ppr` removed** — not used here.
 *
 * 4. **`reactCompiler` is now a stable top-level option** (not in experimental).
 *    Not enabled here yet — enabling it requires `babel-plugin-react-compiler`
 *    and increases build times.
 *
 * 5. **webpack custom split-chunks** — kept for the explicit `--webpack` path
 *    but Turbopack handles code-splitting automatically so this only applies
 *    when running with the `--webpack` flag.
 *
 * 6. **`images.minimumCacheTTL` default** changed to 4 hours in Next.js 16.
 *    No override needed — the new default is fine for this application.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Output Tracing ──────────────────────────────────────────────────────
  // Required for correct module resolution in serverless/edge deployments.
  // Tells Next.js to trace file dependencies from the project root rather
  // than the output directory.
  outputFileTracingRoot: __dirname,

  // ── Experimental Features ───────────────────────────────────────────────
  experimental: {
    /**
     * optimizePackageImports — instructs Next.js (and Turbopack) to only
     * bundle the specific icons/components actually imported from these
     * packages, rather than the entire barrel export. This significantly
     * reduces bundle size and speeds up cold-start compilation for packages
     * like lucide-react (4000+ icons) and recharts.
     */
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-tabs',
      'recharts',
      'date-fns',
    ],
  },

  // ── Compiler Options ────────────────────────────────────────────────────
  compiler: {
    /**
     * removeConsole — strips `console.log` (and other non-error/warn levels)
     * from the production bundle to reduce noise and slightly reduce bundle
     * size. `error` and `warn` are preserved so critical runtime messages
     * remain visible in production.
     */
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // ── Image Optimisation ──────────────────────────────────────────────────
  images: {
    /**
     * remotePatterns — allowlist for external image hostnames.
     * Next.js 16 requires explicit patterns (not `domains`) for security.
     * Only images.unsplash.com is used (landing-page hero/avatars).
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    /**
     * formats — enable modern image formats. Next.js will serve avif (smaller
     * than webp) to browsers that support it, falling back to webp, then the
     * original format. Both are losslessly superior to jpeg/png for photos.
     */
    formats: ['image/avif', 'image/webp'],
  },

  // ── Webpack Configuration (opt-in via --webpack flag) ───────────────────
  /**
   * NOTE: In Next.js 16, Turbopack is the default bundler. This webpack
   * config only applies when the project is explicitly run with:
   *   pnpm dev:webpack   (next dev --webpack)
   *   pnpm build:webpack (next build --webpack)
   *
   * The custom split-chunk strategy groups code into three layers:
   *   - `lib`    — React, React DOM, TanStack Query, Recharts (most stable)
   *   - `vendor` — all other node_modules
   *   - `common` — shared application code used in 2+ routes
   * This reduces the amount of code a user re-downloads when only one layer
   * changes between deployments.
   */
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        // Deterministic module IDs ensure chunk hashes only change when
        // the module's content changes, maximising CDN cache hits.
        moduleIds: 'deterministic',
        // Single runtime chunk avoids duplicated module registry code across
        // multiple entry points.
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // lib: large, rarely-changing framework dependencies
            lib: {
              test: /[\\/]node_modules[\\/](react|react-dom|@tanstack|recharts)[\\/]/,
              name: 'lib',
              chunks: 'all',
              priority: 30,
            },
            // vendor: all other third-party packages
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // common: shared application code (2+ route references)
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // ── React ────────────────────────────────────────────────────────────────
  /**
   * reactStrictMode — enables React's Strict Mode in development, which
   * double-invokes render functions and effects to surface side-effect bugs.
   * Has no effect in production builds.
   */
  reactStrictMode: true,

  // ── Build Output ─────────────────────────────────────────────────────────
  /**
   * productionBrowserSourceMaps — disabled to keep bundle sizes smaller and
   * prevent leaking source code in production. Enable temporarily for
   * production debugging if needed.
   */
  productionBrowserSourceMaps: false,

  // ── Turbopack Configuration ───────────────────────────────────────────────
  /**
   * turbopack — top-level config for Turbopack (default bundler in Next.js 16).
   * Previously in `experimental.turbopack`; promoted to top-level in v15.3+.
   *
   * SVG rule: transforms .svg imports through @svgr/webpack so they can be
   * used as React components (`import Logo from './logo.svg'`).
   */
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
