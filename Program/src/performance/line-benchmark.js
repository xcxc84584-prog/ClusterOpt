// v0.0.50 PR-01: deterministic newline-edit workload, without DOM or user files.
// Timing is diagnostic only: CI environments do not guarantee latency targets.
import {performance} from 'node:perf_hooks';
import {EditPath} from '../fmc/edit-path.js';
import {PieceTree} from '../fmc/piece-tree.js';

export function runLineBenchmark({
  lineCount = 10000, operations = 100, lineWidth = 48
} = {}) {
  if (![lineCount, operations, lineWidth].every(
    value => Number.isSafeInteger(value) && value > 0
  )) throw new RangeError('Positive integer benchmark sizes required');
  const original = Array.from({length: lineCount}, (_, i) =>
    String(i).padStart(lineWidth, 'x')).join('\n');
  const tree = new PieceTree(original);
  const edit = new EditPath('benchmark:0', original);
  const fast = new EditPath('benchmark:fast', original);
  let reference = original;
  const treeTimes = [];
  const reconcileTimes = [];
  const fastPathTimes = [];
  const scanTimes = [];
  for (let i = 0; i < operations; i++) {
    const offset = Math.floor(reference.length / 2);
    const beforeTree = performance.now();
    tree.insert(offset, '\n');
    treeTimes.push(performance.now() - beforeTree);
    reference = reference.slice(0, offset) + '\n' + reference.slice(offset);
    const beforeFast = performance.now();
    if (!fast.applyKnownPatch({start:offset, end:offset, text:'\\n',
      previousLength:reference.length-1}, reference)) {
      throw new Error('Known newline patch unexpectedly rejected');
    }
    fastPathTimes.push(performance.now() - beforeFast);
    const beforeReconcile = performance.now();
    edit.reconcile(reference);
    reconcileTimes.push(performance.now() - beforeReconcile);
    const beforeScan = performance.now();
    const scanned = 1 + (reference.match(/\n/g)?.length ?? 0);
    scanTimes.push(performance.now() - beforeScan);
    if (tree.lineCount !== scanned || edit.lineCount !== scanned ||
        fast.lineCount !== scanned ||
        tree.length !== reference.length) {
      throw new Error('Line benchmark reference mismatch');
    }
  }
  const summarize = values => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      p50Ms: sorted[Math.floor((sorted.length - 1) * 0.5)],
      p95Ms: sorted[Math.floor((sorted.length - 1) * 0.95)],
      p99Ms: sorted[Math.floor((sorted.length - 1) * 0.99)]
    };
  };
  return {
    bytesUtf16: original.length * 2,
    initialLines: lineCount,
    operations,
    finalLines: tree.lineCount,
    pieceTreeInsert: summarize(treeTimes),
    editPathReconcile: summarize(reconcileTimes),
    editPathKnownPatch: summarize(fastPathTimes),
    fullNewlineScan: summarize(scanTimes),
    environment: 'node:perf_hooks; excludes textarea DOM, paint, IndexedDB'
  };
}
