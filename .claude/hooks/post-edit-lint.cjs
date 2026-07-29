#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');

let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  let filePath;
  try {
    const payload = JSON.parse(input);
    filePath = payload.tool_input && payload.tool_input.file_path;
  } catch {
    return;
  }
  if (!filePath || !/\.(js|mjs|cjs)$/.test(filePath)) return;

  for (const args of [
    ['eslint', '--fix', filePath],
    ['prettier', '--write', filePath],
  ]) {
    try {
      execFileSync('npx', args, { stdio: 'ignore' });
    } catch {
      // not installed/configured yet, or unresolved lint errors - ignore
    }
  }
});
