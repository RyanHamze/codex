import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.codex');

export class Config {
  constructor() {
    this.configDir = configDir;
    this.sessionFile = path.join(configDir, 'session.json');
    this.graphFile = path.join(configDir, 'graph.json');
    this.reportFile = path.join(configDir, 'daily.json');
    this.configFile = path.join(configDir, 'config.json');

    this.ensure();
    this.load();
  }

  ensure() {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  load() {
    const defaults = {
      filterRules: {
        stripPassedTests: true,
        stripProgressBars: true,
        stripVerboseLogs: true,
        maxOutputLines: 50,
      },
      graphOptions: {
        autoRebuild: true,
        supportedLanguages: ['javascript', 'python', 'typescript'],
      },
      reportOptions: {
        saveDailyBreakdown: true,
        trackSessionCosts: true,
      },
    };

    if (fs.existsSync(this.configFile)) {
      const custom = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      this.settings = { ...defaults, ...custom };
    } else {
      this.settings = defaults;
      fs.writeFileSync(this.configFile, JSON.stringify(defaults, null, 2));
    }
  }

  get(key) {
    return this.settings[key];
  }

  save() {
    fs.writeFileSync(this.configFile, JSON.stringify(this.settings, null, 2));
  }
}
