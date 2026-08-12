// Assemble the full static site into apps/hub/dist — the single folder a host (Vercel,
// GitHub Pages, any static host) serves. Mirrors .github/workflows/deploy.yml: build the
// hub, then each generator, and copy every app's dist into the hub under the subpaths the
// hub's generators.json links to (e.g. /Clicker-Generator/). Node fs is used for the
// copies so this runs the same on Linux (CI/Vercel), macOS, and Windows.
import { execSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const copy = (src, dest) => {
  rmSync(dest, { recursive: true, force: true }); // avoid nesting on a re-run
  cpSync(src, dest, { recursive: true });
  console.log(`  copied ${src} → ${dest}`);
};

// Hub first — it owns the output directory (apps/hub/dist).
run('pnpm build:hub');

run('pnpm build:keychain');
copy('apps/name-keychain/dist', 'apps/hub/dist/name-keychain');

run('pnpm build:clicker');
copy('apps/clicker-generator/dist', 'apps/hub/dist/Clicker-Generator');
copy('apps/clicker-generator/dist', 'apps/hub/dist/clicker');

run('pnpm build:keycap');
copy('apps/keycap-generator/dist', 'apps/hub/dist/SVG-keycap-generator');
copy('apps/keycap-generator/dist', 'apps/hub/dist/keycap');

run('pnpm build:magnet');
copy('apps/magnet-generator/dist', 'apps/hub/dist/magnet');

console.log('\n✓ Assembled site → apps/hub/dist');
