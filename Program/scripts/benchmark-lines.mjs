import {runLineBenchmark} from '../src/performance/line-benchmark.js';
const [lines,operations,width]=process.argv.slice(2).map(Number);
const result=runLineBenchmark({
  lineCount:lines||10000,
  operations:operations||100,
  lineWidth:width||48
});
console.log(JSON.stringify(result,null,2));
