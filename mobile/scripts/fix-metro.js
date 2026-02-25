#!/usr/bin/env node
/**
 * Patches @react-native/community-cli-plugin to filter out undefined
 * middleware entries (indexPageMiddleware is not exported from cli-server-api
 * in some versions, causing Metro to crash on startup).
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'community-cli-plugin',
  'dist',
  'commands',
  'start',
  'runServer.js'
);

if (!fs.existsSync(filePath)) {
  console.log('[fix-metro] runServer.js not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

const target = 'unstable_extraMiddleware: [';
const replacement = 'unstable_extraMiddleware: [].concat([';

if (content.includes(replacement)) {
  console.log('[fix-metro] Already patched.');
  process.exit(0);
}

// Replace the array with a filtered version that removes undefined entries
const oldBlock = `unstable_extraMiddleware: [
      communityMiddleware,
      _cliServerApi.indexPageMiddleware,
      middleware,
    ],`;

const newBlock = `unstable_extraMiddleware: [
      communityMiddleware,
      _cliServerApi.indexPageMiddleware,
      middleware,
    ].filter(Boolean),`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[fix-metro] Patched: added .filter(Boolean) to unstable_extraMiddleware');
} else {
  console.log('[fix-metro] Target block not found, manual patch may be needed.');
}
