#!/usr/bin/env node
/**
 * Poll Railway until the latest deployment finishes.
 *
 * Usage:
 *   node scripts/railway-deploy-wait.mjs
 *   node scripts/railway-deploy-wait.mjs --deploy --message "My deploy"
 *   node scripts/railway-deploy-wait.mjs --id <deployment-id>
 *
 * Requires: railway CLI linked to the project (railway status).
 */
import { spawnSync, spawn } from 'child_process';

const TERMINAL = new Set(['SUCCESS', 'FAILED', 'CRASHED', 'REMOVED', 'CANCELLED']);
const ACTIVE = new Set(['BUILDING', 'DEPLOYING', 'INITIALIZING', 'QUEUED', 'WAITING']);

function parseArgs(argv) {
  const opts = {
    deploy: false,
    message: '',
    deploymentId: '',
    intervalSec: 15,
    timeoutSec: 20 * 60,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--deploy') opts.deploy = true;
    else if (arg === '--message' || arg === '-m') opts.message = argv[++i] || '';
    else if (arg === '--id') opts.deploymentId = argv[++i] || '';
    else if (arg === '--interval') opts.intervalSec = Math.max(5, parseInt(argv[++i], 10) || 15);
    else if (arg === '--timeout') opts.timeoutSec = Math.max(60, parseInt(argv[++i], 10) || 1200);
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/railway-deploy-wait.mjs [options]

Options:
  --deploy              Run "railway up --detach --ci" before polling
  -m, --message TEXT    Deploy message (with --deploy)
  --id ID               Poll a specific deployment id (default: latest)
  --interval SECONDS    Poll interval (default: 15)
  --timeout SECONDS     Give up after this many seconds (default: 1200)
`);
      process.exit(0);
    }
  }

  return opts;
}

function runRailway(args) {
  const result = spawnSync('railway', args, { encoding: 'utf8' });
  if (result.error) {
    console.error('Failed to run railway CLI:', result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || 'railway command failed');
    process.exit(result.status || 1);
  }
  return (result.stdout || '').trim();
}

function listDeploymentsJson() {
  const out = runRailway(['deployment', 'list', '--json', '--limit', '5']);
  try {
    const data = JSON.parse(out);
    return Array.isArray(data) ? data : [];
  } catch {
    console.error('Could not parse railway deployment list JSON:', out.slice(0, 200));
    process.exit(1);
  }
}

function latestDeployment(deployments, id) {
  if (id) return deployments.find(d => d.id === id) || null;
  return deployments[0] || null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deploy(opts) {
  const args = ['up', '--detach', '--ci'];
  if (opts.message) args.push('-m', opts.message);

  console.log(`> railway ${args.join(' ')}`);
  await new Promise((resolve, reject) => {
    const child = spawn('railway', args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', code => (code === 0 ? resolve() : reject(new Error(`railway up exited ${code}`))));
  });
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.deploy) {
    await deploy(opts);
    // Give Railway a moment to register the new deployment row.
    await sleep(3000);
  }

  const started = Date.now();
  let lastStatus = '';

  while (true) {
    const deployments = listDeploymentsJson();
    const deployment = latestDeployment(deployments, opts.deploymentId);

    if (!deployment) {
      console.error('No deployments found. Link the project with: railway link');
      process.exit(1);
    }

    const { id, status, createdAt } = deployment;
    const ts = new Date().toLocaleTimeString();
    if (status !== lastStatus) {
      console.log(`${ts}  ${id.slice(0, 8)}…  ${status}`);
      lastStatus = status;
    }

    if (status === 'SUCCESS') {
      console.log(`Deployment succeeded: ${id}`);
      process.exit(0);
    }

    if (TERMINAL.has(status) && status !== 'SUCCESS') {
      console.error(`Deployment ended with status: ${status} (${id})`);
      process.exit(1);
    }

    if (!ACTIVE.has(status) && !TERMINAL.has(status)) {
      console.log(`${ts}  unknown status "${status}" — continuing to poll`);
    }

    if (Date.now() - started > opts.timeoutSec * 1000) {
      console.error(`Timed out after ${opts.timeoutSec}s (last status: ${status}, id: ${id}, created: ${createdAt})`);
      process.exit(1);
    }

    await sleep(opts.intervalSec * 1000);
  }
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
