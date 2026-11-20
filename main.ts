// Leonida Trophy Guide — a GTA VI trophy guide and tracker (Node 22, stdlib only).
// The guide itself is plain static files under app/: index.html opens it, app.js
// renders the checklist from app/data/trophies.json, and style.css styles it.
// Nothing is fetched from the network at run time, and there is no build step.
// This program hands the entry in: it copies app/ and screenshots/ from beside
// this file into /output and writes /output/dossier.json with the vendored
// make.fun library, so the judge can read the screenshots and the source.
// vendor/makefun-frontend.ts is the kit's copy, unchanged: the scorer rebuilds
// the dossier with its own copy and the two must match byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the rest refuse
// an entry the scorer would refuse (more than 4 screenshots or one over 256 KiB;
// more than 993 files and directories in app/ or 48 MiB of app files, counted
// beside /output's own 1000-entry cap with screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
