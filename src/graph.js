import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class Graph {
  constructor(config, manual = false) {
    this.config = config;
    this.manual = manual;
    this.graph = {
      nodes: [],
      edges: [],
      metadata: {
        builtAt: null,
        repoRoot: process.cwd(),
        supportedLanguages: config.get('graphOptions').supportedLanguages,
      },
    };
  }

  async build() {
    console.log(JSON.stringify({ status: 'building graph', manual: this.manual }));

    const repoRoot = process.cwd();

    // Find all source files
    const files = this.findSourceFiles(repoRoot);

    // Parse files and extract functions/classes
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const nodes = this.extractNodes(file, content);
        this.graph.nodes.push(...nodes);
      } catch (err) {
        // skip unreadable files
      }
    }

    // Find imports/calls (simplified)
    this.graph.edges = this.findEdges(files);

    this.graph.metadata.builtAt = Date.now();
    this.graph.metadata.nodeCount = this.graph.nodes.length;
    this.graph.metadata.edgeCount = this.graph.edges.length;

    fs.writeFileSync(this.config.graphFile, JSON.stringify(this.graph, null, 2));
  }

  findSourceFiles(root) {
    const supportedExts = ['.js', '.ts', '.jsx', '.tsx', '.py'];
    const ignored = ['node_modules', '.git', 'dist', 'build', '__pycache__'];
    const files = [];

    const walk = (dir) => {
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          if (ignored.some(ig => dir.includes(ig))) continue;
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (supportedExts.some(ext => fullPath.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (err) {
        // skip inaccessible dirs
      }
    };

    walk(root);
    return files;
  }

  extractNodes(file, content) {
    const nodes = [];

    // Simple regex-based extraction (not a full AST parser)
    const funcRegex = /(?:function|const|let)\s+(\w+)\s*(?:=|\()/g;
    const classRegex = /class\s+(\w+)/g;

    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      nodes.push({
        id: `${file}::${match[1]}`,
        name: match[1],
        file,
        type: 'function',
      });
    }

    while ((match = classRegex.exec(content)) !== null) {
      nodes.push({
        id: `${file}::${match[1]}`,
        name: match[1],
        file,
        type: 'class',
      });
    }

    return nodes;
  }

  findEdges(files) {
    const edges = [];
    const importRegex = /(?:import|require)\s+(?:{?\s*\w+\s*}?\s*from\s+)?['"]([^'"]+)['"]/g;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          edges.push({
            from: file,
            to: match[1],
            type: 'import',
          });
        }
      } catch (err) {
        // skip
      }
    }

    return edges;
  }

  getRelevantFiles(queryFile, depth = 1) {
    const relevant = new Set([queryFile]);
    const visited = new Set();

    const traverse = (file, currentDepth) => {
      if (visited.has(file) || currentDepth > depth) return;
      visited.add(file);

      // Find edges involving this file
      const connected = this.graph.edges.filter(e => e.from === file || e.to === file);
      for (const edge of connected) {
        const nextFile = edge.from === file ? edge.to : edge.from;
        relevant.add(nextFile);
        traverse(nextFile, currentDepth + 1);
      }
    };

    traverse(queryFile, 0);
    return Array.from(relevant);
  }

  static load(config) {
    try {
      const data = JSON.parse(fs.readFileSync(config.graphFile, 'utf8'));
      const graph = new Graph(config);
      graph.graph = data;
      return graph;
    } catch {
      return null;
    }
  }
}
