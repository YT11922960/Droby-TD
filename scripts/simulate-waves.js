"use strict";

const path = require("node:path");
const {loadGameData,simulateWave} = require("../tools/wave-simulator");

const rootDir = path.resolve(__dirname,"..");
const data = loadGameData(rootDir);
const scenarios = [
 ...[3,6,10,14,18,24].map(waveNumber=>({mode:"story",waveNumber})),
 ...[5,11,18,20,30,35,40,60,80,100].map(waveNumber=>({mode:"endless",waveNumber}))
];
const results = scenarios.map(scenario=>simulateWave({data,...scenario}));

console.table(results.map(result=>({
 mode:result.mode,
 wave:result.wave,
 enemies:result.enemies,
 hp:result.totalHp,
 shield:result.totalShield,
  defeated:result.defeated,
  escaped:result.escaped,
  seconds:result.seconds,
 completed:result.completed
})));

const failures = results.filter(result=>!result.completed);
if(failures.length){
 console.error("Wave simulation failed:", failures);
 process.exitCode=1;
}else{
 console.log(`Wave simulation passed: ${results.length} representative waves.`);
}
