# Codex

Token usage monitor, CLI filter, repo graph, and report aggregator for Codex.

## Installation

```bash
npm install -g codex
# or
npx codex
```

## Usage

### Monitor + Filter + Report
```bash
codex
```
Tracks current Codex session, compresses CLI output (60-90% reduction), builds repo graph, generates daily report.

### View Report Only
```bash
codex report
```
Shows today's token savings breakdown and recommendations.

### Build/Rebuild Graph
```bash
codex graph
```
Manually rebuild code graph for your repo.

### Skip Auto Graph Build
```bash
codex --graph-manual
```
Runs all modules except auto-graph build.

## Config

Config file: `~/.codex/config.json`

```json
{
  "filterRules": {
    "stripPassedTests": true,
    "stripProgressBars": true,
    "stripVerboseLogs": true,
    "maxOutputLines": 50
  },
  "graphOptions": {
    "autoRebuild": true,
    "supportedLanguages": ["javascript", "python", "typescript"]
  },
  "reportOptions": {
    "saveDailyBreakdown": true,
    "trackSessionCosts": true
  }
}
```

## Output

All JSON output to `~/.codex/`:
- `session.json` — current session data
- `graph.json` — code graph (nodes, edges)
- `report-YYYY-MM-DD.json` — daily stats and savings
- `config.json` — settings

## Modules

**Monitor** — reads Codex logs, tracks input/output tokens, counts CLI commands

**Filter** — compresses CLI output before Codex context, removes verbose logs, truncates large output

**Graph** — builds repo map (functions, classes, imports), tracks call dependencies, suggests minimal file sets for reviews

**Report** — aggregates daily savings, calculates percentage reductions, provides recommendations

## Estimated Savings

- CLI filtering: 60-90% on command output
- Code graph: 15% context reduction on large repos
- Combined: 30-45% average token reduction per session
