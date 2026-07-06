#!/usr/bin/env node

import { Monitor } from './src/monitor.js';
import { Filter } from './src/filter.js';
import { Graph } from './src/graph.js';
import { Report } from './src/report.js';
import { Config } from './src/config.js';

const args = process.argv.slice(2);
const config = new Config();
const graphManual = args.includes('--graph-manual');

async function main() {
  const command = args[0] || 'run';

  if (command === 'run') {
    console.log(JSON.stringify({ status: 'starting', timestamp: Date.now() }));
    
    const monitor = new Monitor(config);
    const filter = new Filter(config);
    const graph = new Graph(config, graphManual);
    const report = new Report(config);

    if (!graphManual) {
      await graph.build();
    }

    const session = await monitor.track();
    const filtered = await filter.compress(session.cliOutput);
    const stats = await report.generate();

    console.log(JSON.stringify({
      session,
      filtered,
      stats,
      timestamp: Date.now()
    }, null, 2));

    process.exit(0);
  }

  if (command === 'report') {
    const report = new Report(config);
    const stats = await report.generate();
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  }

  if (command === 'graph') {
    const graph = new Graph(config, false);
    await graph.build();
    console.log(JSON.stringify({ graph: 'built', timestamp: Date.now() }));
    process.exit(0);
  }

  console.log(JSON.stringify({ error: 'Unknown command', command }));
  process.exit(1);
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
