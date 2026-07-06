import fs from 'fs';
import path from 'path';

export class Monitor {
  constructor(config) {
    this.config = config;
  }

  async track() {
    const codexLogsPath = path.join(process.env.HOME || process.env.USERPROFILE, '.codex', 'logs');
    let cliOutput = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      if (fs.existsSync(codexLogsPath)) {
        const files = fs.readdirSync(codexLogsPath).slice(-5); // last 5 log files
        for (const file of files) {
          const content = fs.readFileSync(path.join(codexLogsPath, file), 'utf8');
          cliOutput += content + '\n';
        }
      }
    } catch (err) {
      cliOutput = '[log read failed]';
    }

    const session = {
      timestamp: Date.now(),
      duration: Math.floor(Math.random() * 3600000), // placeholder
      inputTokens,
      outputTokens,
      cliOutput: cliOutput.substring(0, 5000), // first 5k chars
      commandCount: (cliOutput.match(/\$/g) || []).length,
    };

    fs.writeFileSync(this.config.sessionFile, JSON.stringify(session, null, 2));
    return session;
  }

  getLastSession() {
    try {
      return JSON.parse(fs.readFileSync(this.config.sessionFile, 'utf8'));
    } catch {
      return null;
    }
  }
}
