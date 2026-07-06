export class Filter {
  constructor(config) {
    this.config = config;
    this.rules = config.get('filterRules');
  }

  async compress(output) {
    if (!output) return { original: 0, compressed: 0, reduction: 0 };

    let compressed = output;
    const originalLength = output.length;

    // Strip passed tests
    if (this.rules.stripPassedTests) {
      compressed = compressed.replace(/^\s*✓.*PASSED.*$/gm, '[tests passed]');
      compressed = compressed.replace(/^\s*tests passed.*$/gm, '[tests passed]');
    }

    // Strip progress bars
    if (this.rules.stripProgressBars) {
      compressed = compressed.replace(/\[\s*[#=]*\s*\]\s*\d+%/g, '[progress]');
    }

    // Strip verbose logs
    if (this.rules.stripVerboseLogs) {
      compressed = compressed
        .split('\n')
        .filter(line => !this.isVerboseLog(line))
        .join('\n');
    }

    // Limit output lines
    const lines = compressed.split('\n');
    if (lines.length > this.rules.maxOutputLines) {
      compressed = [
        ...lines.slice(0, Math.floor(this.rules.maxOutputLines / 2)),
        `[... ${lines.length - this.rules.maxOutputLines} lines omitted ...]`,
        ...lines.slice(-Math.floor(this.rules.maxOutputLines / 2)),
      ].join('\n');
    }

    const compressedLength = compressed.length;
    const reduction = originalLength > 0 ? ((originalLength - compressedLength) / originalLength * 100).toFixed(1) : 0;

    return {
      original: originalLength,
      compressed: compressedLength,
      reduction: `${reduction}%`,
      estimatedTokensSaved: Math.floor(originalLength / 4 - compressedLength / 4),
    };
  }

  isVerboseLog(line) {
    const verbosePatterns = [
      /^debug:/i,
      /^trace:/i,
      /^\[verbose\]/i,
      /npm warn/i,
      /npm notice/i,
    ];
    return verbosePatterns.some(pattern => pattern.test(line));
  }
}
