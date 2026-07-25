"use strict";

const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const {loadGameData,simulateWave} = require("../tools/wave-simulator");

const data = loadGameData(path.resolve(__dirname,".."));

const majorWaves = [
 {mode:"story",waves:[3,6,10,14,18,24]},
 {mode:"endless",waves:[5,11,18,20,30,35,40,60,80,100]}
];
const expectedDefenseResults = {
 "story:3":[6,0],"story:6":[10,0],"story:10":[19,0],"story:14":[25,0],"story:18":[30,0],"story:24":[39,0],
 "endless:5":[19,0],"endless:11":[29,0],"endless:18":[43,0],"endless:20":[49,0],"endless:30":[69,6],
 "endless:35":[62,25],"endless:40":[94,1],"endless:60":[88,10],"endless:80":[31,1],"endless:100":[34,1]
};

for(const group of majorWaves){
 for(const waveNumber of group.waves){
  test(`${group.mode} Wave ${waveNumber} completes its enemy lifecycle`,()=>{
   const first = simulateWave({data,mode:group.mode,waveNumber});
   const second = simulateWave({data,mode:group.mode,waveNumber});
   assert.deepEqual(second,first,"fixed seed must reproduce the same result");
   assert.equal(first.completed,true);
   assert.equal(first.defeated+first.escaped,first.enemies);
   assert.ok(first.enemies>0);
   assert.ok(first.frames<=18000,"the wave must finish within five simulated minutes");
   assert.ok(Number.isFinite(first.totalHp)&&first.totalHp>0);
   assert.ok(Number.isFinite(first.totalShield)&&first.totalShield>=0);
   assert.deepEqual([first.defeated,first.escaped],expectedDefenseResults[`${group.mode}:${waveNumber}`],"reference defense result changed");
  });
 }
}

test("story finale includes the Mouse King",()=>{
 const result = simulateWave({data,mode:"story",waveNumber:24});
 assert.equal(result.kinds.mainBoss,1);
});

test("endless teaching and boss waves keep their signature enemies",()=>{
 assert.equal(simulateWave({data,mode:"endless",waveNumber:18}).kinds.giantShield,1);
 assert.equal(simulateWave({data,mode:"endless",waveNumber:20}).kinds.armorBoss,1);
 assert.equal(simulateWave({data,mode:"endless",waveNumber:40}).kinds.armorBoss,1);
 assert.equal(simulateWave({data,mode:"endless",waveNumber:80}).kinds.mainBoss,1);
 assert.equal(simulateWave({data,mode:"endless",waveNumber:100}).kinds.mainBoss,1);
});
