import fs from 'fs';
import path from 'path';

export class Report {
  constructor(config) {
    this.config = config;
  }

  async generate() {
    const today = new Date().toISOString().split('T')[0];
    const dailyFile = path.join(this.config.configDir, `report-${today}.json`);

    let session = null;
    try {
      session = JSON.parse(fs.readFileSync(this.config.sessionFile, 'utf8'));
    } catch {
      session = { inputTokens: 0, outputTokens: 0 };
    }

    const report = {
      date: today,
      session,
      savings: this.calculateSavings(session),
      breakdown: this.getBreakdown(),
      recommendations: this.getRecommendations(),
    };

    fs.writeFileSync(dailyFile, JSON.stringify(report, null, 2));
    return report;
  }

  calculateSavings(session) {
    const cliFilterSavings = session.commandCount ? Math.floor(session.commandCount * 500) : 0; // ~500 tokens per cmd on average
    const graphSavings = Math.floor((session.inputTokens || 0) * 0.15); // ~15% from code graph
    const compressSavings = Math.floor((session.inputTokens || 0) * 0.25); // ~25% from filtering

    const totalTokens = (session.inputTokens || 0) + (session.outputTokens || 0);
    const totalSavings = cliFilterSavings + graphSavings + compressSavings;

    return {
      cliFilterSavings,
      graphSavings,
      compressSavings,
      totalTokensSaved: totalSavings,
      totalTokensUsed: totalTokens,
      percentageReduction: totalTokens > 0 ? ((totalSavings / totalTokens) * 100).toFixed(1) : '0',
    };
  }

  getBreakdown() {
    const reports = this.getAllReports();
    const totalSaved = reports.reduce((sum, r) => sum + (r.savings?.totalTokensSaved || 0), 0);

    return {
      reportsCount: reports.length,
      totalTokensSavedThisWeek: totalSaved,
      averageReductionPercent: reports.length > 0
        ? (reports.reduce((sum, r) => sum + parseFloat(r.savings?.percentageReduction || 0), 0) / reports.length).toFixed(1)
        : '0',
    };
  }

  getRecommendations() {
    const recommendations = [];

    const session = this.getLastSession();
    if (session && session.commandCount > 20) {
      recommendations.push({
        priority: 'high',
        message: 'High CLI command volume detected. Enable rtk output compression.',
      });
    }

    recommendations.push({
      priority: 'medium',
      message: 'Rebuild code graph weekly to keep call dependencies current.',
    });

    recommendations.push({
      priority: 'low',
      message: 'Consider caveman style prompt for verbose reasoning tasks.',
    });

    return recommendations;
  }

  getAllReports() {
    const files = fs.readdirSync(this.config.configDir)
      .filter(f => f.startsWith('report-'))
      .sort()
      .slice(-7); // last 7 days

    return files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(this.config.configDir, f), 'utf8'));
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  getLastSession() {
    try {
      return JSON.parse(fs.readFileSync(this.config.sessionFile, 'utf8'));
    } catch {
      return null;
    }
  }
}
