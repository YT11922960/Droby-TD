"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname,"../game.js"),"utf8");

function extractFunction(name) {
 const start=source.indexOf(`function ${name}(`);
 assert.notEqual(start,-1,`${name} must exist`);
 const parametersStart=source.indexOf("(",start);
 let parameterDepth=0,parametersEnd=-1;
 for(let index=parametersStart;index<source.length;index++){
  if(source[index]==="(")parameterDepth++;
  if(source[index]===")"&&--parameterDepth===0){parametersEnd=index;break}
 }
 const bodyStart=source.indexOf("{",parametersEnd);
 let depth=0;
 for(let index=bodyStart;index<source.length;index++){
  if(source[index]==="{")depth++;
  if(source[index]==="}"&&--depth===0)return source.slice(start,index+1);
 }
 throw new Error(`${name} body was not closed`);
}

function prepareState({mode="endless",waveNumber,active=false,revealed=false}) {
 const context={
  gameMode:mode,
  routeBranchSystem:{unlockWave:35},
  routeBranchActive:active,
  routeBranchRevealShown:revealed,
  revealCalls:0
 };
 context.showRouteBranchRevealEvent=()=>{
  if(context.routeBranchRevealShown)return;
  context.routeBranchRevealShown=true;
  context.revealCalls++;
 };
 vm.createContext(context);
 vm.runInContext(`${extractFunction("routeBranchAvailableForWave")};${extractFunction("prepareRouteBranchForWave")}`,context);
 context.prepareRouteBranchForWave(waveNumber,{notify:true});
 return context;
}

test("the extra route is hidden before the Wave 35 preparation phase",()=>{
 const result=prepareState({waveNumber:34});
 assert.equal(result.routeBranchActive,false);
 assert.equal(result.revealCalls,0);
});

test("the extra route and notice appear during Wave 35 preparation",()=>{
 const result=prepareState({waveNumber:35});
 assert.equal(result.routeBranchActive,true);
 assert.equal(result.routeBranchRevealShown,true);
 assert.equal(result.revealCalls,1);
});

test("later Waves keep the route without replaying the Wave 35 notice",()=>{
 const result=prepareState({waveNumber:36});
 assert.equal(result.routeBranchActive,true);
 assert.equal(result.revealCalls,0);
});

test("story mode never enables the endless route",()=>{
 const result=prepareState({mode:"normal",waveNumber:35});
 assert.equal(result.routeBranchActive,false);
 assert.equal(result.revealCalls,0);
});

test("Wave completion prepares the route before saving the retry checkpoint",()=>{
 assert.match(source,/prepareRouteBranchForWave\(wave\+1,\{notify:true\}\);captureEndlessCheckpoint\(\)/);
});
