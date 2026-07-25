"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const MAIN_PATH = [
 [953,100],[952,130],[944,160],[926,186],[895,204],[855,214],
 [813,217],[766,220],[719,229],[680,245],[655,267],[648,293],
 [658,319],[672,345],[677,367],[664,382],[637,390],[602,390],
 [563,380],[523,371],[480,371],[438,379],[398,392],[367,410],
 [352,434],[355,456],[375,476],[406,490],[438,503],[465,523],
 [484,548],[494,576],[491,603],[477,625],[452,641],[422,652],
 [391,658],[355,661],[320,665],[285,674],[254,687],[223,701],
 [199,713]
];

const BRANCH_PATH = [
 [1190,560],[1130,570],[1060,592],[990,618],[925,642],[850,663],
 [770,681],[690,695],[610,700],[530,695],[445,686],[360,676],
 [285,674],[254,687],[223,701],[199,713]
];

const TOWER_SPOTS = [
 [805,315],[745,275],[820,170],[890,275],[875,355],[805,395],
 [585,500],[520,455],[565,430],[655,455],[655,535],[585,575],
 [475,235],[430,310],[500,320],[575,315],[610,245],[540,200],
 [1025,190],[1000,300],[330,350],[285,470],[410,560],[530,660],[350,620],[310,715],
 [1060,250],[1070,340],[1015,385],[230,405],[220,500],[285,550],
 [610,650],[590,720],[480,720],[675,600]
];
const REFERENCE_SPOT_ORDER = [0,6,12,18,26,27,28,32,33,34,35,20,21,22,23,24,25,29,30,31,1,7,13,19,2,8,14,3,9,15,4,10,16,5,11,17];

function loadGameData(rootDir) {
 const source = fs.readFileSync(path.join(rootDir, "game-data.js"), "utf8");
 const context = {window:{}};
 vm.runInNewContext(source, context, {filename:"game-data.js"});
 if(!context.window.GAME_DATA)throw new Error("game-data.js did not define GAME_DATA.");
 return context.window.GAME_DATA;
}

function seededRandom(seed) {
 let state = seed >>> 0;
 return () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 0x100000000;
 };
}

function storyWaveConfig(data, index) {
 const n = index + 1;
 const chapter = data.waves.chapters.find(item=>n>=item.start&&n<=item.end) || data.waves.chapters.at(-1);
 const chapterBalance = data.waves.storyChapterBalance[chapter.number];
 const balance = data.waves.storyLateWaveBalance[n] || {...chapterBalance, attack:1};
 const baseCount = n<=3 ? 5+n : n<=6 ? 7+Math.floor(n*.8) : n<=10 ? 9+Math.floor(n*.9) : 10+Math.floor(n*1.05);
 return {
  count:Math.max(4, baseCount+balance.count),
  hp:(38+index*23)*balance.hp,
  speed:.98+index*.028,
  reward:8+Math.floor(index*1.5),
  lifeDamage:balance.attack
 };
}

function endlessHpFactor(waveNumber) {
 const n = Math.max(1, waveNumber);
 const throughThirty = 1+Math.min(n,30)*.095+(n>=20?(Math.min(n,30)-20)*.012:0);
 return n<=30 ? throughThirty : throughThirty+(n-30)*.092;
}

function endlessPressure(waveNumber) {
 const n = Math.max(1, waveNumber);
 if(n<=45)return 1;
 if(n<=50)return 1+(n-45)*.03;
 if(n<=55)return 1.15+(n-50)*.05;
 if(n<=60)return 1.4+(n-55)*.07;
 return Math.min(2.5, 1.75+(n-60)*.03);
}

function endlessWaveConfig(index) {
 const n = index+1;
 const density = 10+Math.floor(n*1.65)+(n>=10?Math.floor((n-9)*.55):0)+(n>=20?Math.floor((n-19)*.35):0);
 return {
  count:Math.min(92, density),
  hp:52*endlessHpFactor(n)*endlessPressure(n),
  speed:Math.min(2.75, 1.05*(1+n*.011)),
  reward:Math.max(3, Math.round(3+n*.015))
 };
}

function placeLearningEnemy(roster, kind, position) {
 const target = Math.max(0, Math.min(roster.length-1, Math.floor((roster.length-1)*position)));
 const available = new Set(["forest","swift","guard"]);
 for(let distance=0;distance<roster.length;distance++){
  for(const index of [target+distance,target-distance]){
   if(index>=0&&index<roster.length&&available.has(roster[index])){
    roster[index]=kind;
    return index;
   }
  }
 }
 return -1;
}

function addSpecialEnemies(roster, waveNumber) {
 if(waveNumber>=5){
  const count = waveNumber===5 ? Math.max(2,Math.floor(roster.length*.16)) : Math.max(1,Math.floor(roster.length*Math.min(.2,.06+waveNumber*.002)));
  for(let i=0;i<count;i++)roster[Math.min(roster.length-1,Math.floor((i+.5)*roster.length/count))]="shield";
 }
 if(waveNumber>=18){
  const count = waveNumber<30 ? 1 : Math.min(3,2+Math.floor((waveNumber-30)/25));
  for(let i=0;i<count;i++){
   const index = Math.min(roster.length-2,Math.floor((i+1)*roster.length/(count+1)));
   roster[index]="giantShield";
   if(waveNumber>40)roster[Math.min(roster.length-1,index+1)]="piper";
  }
  if(waveNumber<=40){
   const index = Math.min(roster.length-1,Math.floor(roster.length*.78));
   if(roster[index]!=="giantShield")roster[index]="piper";
  }
 }else if(waveNumber>=11){
  roster[Math.min(roster.length-1,Math.floor(roster.length*.58))]="piper";
 }
 if(waveNumber>=30){
  const rate = Math.min(.18,.06+(waveNumber-30)*.0025);
  const count = Math.max(1,Math.floor(roster.length*rate));
  for(let i=0;i<count;i++){
   const index = Math.min(roster.length-1,Math.floor((i+.35)*roster.length/count));
   if(roster[index]==="forest"||roster[index]==="swift")roster[index]="endlessSwift";
  }
 }
}

function mouseKingMarchRoster(baseRoster, waveNumber) {
 const support = ["giantShield","giantShield","trumpet","violin","drum","mainBoss"];
 const tier = Math.max(0,Math.floor((waveNumber-80)/20));
 const extraGuards = Math.min(8,tier+2);
 const tail = baseRoster.slice(0,Math.min(baseRoster.length,20+extraGuards*2));
 for(let i=0;i<extraGuards;i++)tail.splice(Math.min(tail.length,4+i*3),0,i%2?"shield":"guard");
 if(tier>=2)tail.splice(3,0,"piper");
 if(tier>=3)tail.splice(7,0,"giantShield");
 return [...support,...tail];
}

function endlessRoster(data, waveNumber) {
 const config = endlessWaveConfig(waveNumber-1);
 const roster = Array(config.count).fill("forest");
 if(waveNumber>=3)for(let i=0;i<Math.floor(config.count*.18);i++)roster[(i*5)%roster.length]="swift";
 if(waveNumber>=5)for(let i=0;i<Math.floor(config.count*.12);i++)roster[(i*7+2)%roster.length]="guard";
 if(waveNumber>=18&&waveNumber<=21){
  const counts = {18:2,19:4,20:3,21:4};
  const shieldCount = counts[waveNumber]||0;
  for(let i=0;i<shieldCount;i++)placeLearningEnemy(roster,"shield",(i+1)/(shieldCount+1));
  if(waveNumber===18||waveNumber===19)placeLearningEnemy(roster,"giantShield",.46);
  if(waveNumber===20)placeLearningEnemy(roster,"armorBoss",.5);
  if(waveNumber===21){
   placeLearningEnemy(roster,"giantShield",.36);
   placeLearningEnemy(roster,"armorBoss",.64);
  }
  return roster;
 }
 if(waveNumber>=20&&waveNumber%20===0){
  if(waveNumber>=80)return mouseKingMarchRoster(roster,waveNumber);
  addSpecialEnemies(roster,waveNumber);
  const guardPack = waveNumber<40
   ? ["giantShield","armorBoss","piper"]
   : waveNumber===40
    ? ["giantShield","armorBoss","endlessSwift"]
    : waveNumber<60
     ? ["giantShield","giantShield","armorBoss","piper","endlessSwift"]
     : ["giantShield","giantShield","piper","armorBoss","endlessSwift","endlessSwift"];
  const result = [...roster];
  const start = Math.max(1,Math.floor(result.length*.18));
  guardPack.forEach((kind,index)=>result.splice(Math.min(result.length,start+index*2),0,kind));
  return result;
 }
 addSpecialEnemies(roster,waveNumber);
 if(waveNumber===30){
  roster.splice(Math.floor(roster.length*.52),0,"mainBoss");
  roster.splice(Math.floor(roster.length*.08),0,"midBoss");
 }else{
  if(waveNumber%10===0)roster.unshift("mainBoss");
  if(waveNumber%5===0)roster.unshift("midBoss");
 }
 return roster;
}

function storyRoster(data, waveNumber) {
 const config = storyWaveConfig(data,waveNumber-1);
 const roster = Array(config.count).fill("forest");
 if(waveNumber>=7)for(let i=0;i<Math.floor(config.count*.12);i++)roster[(i*5)%roster.length]="swift";
 if(waveNumber>=16)for(let i=0;i<Math.floor(config.count*.1);i++)roster[(i*7+2)%roster.length]="guard";
 if([10,15].includes(waveNumber))roster.unshift("midBoss");
 if(waveNumber===24)roster.unshift("mainBoss");
 return roster;
}

function spawnInterval(data, mode, waveNumber, kind, spawned, total) {
 if(mode==="story"){
  const base = Math.max(15,49-waveNumber);
  const spread = waveNumber>=14&&waveNumber<=24&&kind==="forest";
  return spread ? data.waves.storyLateSpawnIntervals[waveNumber] : base;
 }
 const base = waveNumber<10?42-waveNumber*.45:waveNumber<20?38-waveNumber*.65:waveNumber<40?33-waveNumber*.58:24-waveNumber*.28;
 const durable = ["guard","shield","giantShield","armorBoss","midBoss","mainBoss"].includes(kind);
 if(waveNumber===30)return durable?22:20;
 if(waveNumber>=31&&waveNumber<=34)return Math.max(durable?17:15,Math.floor(base*(durable?1.2:1.12)));
 if(waveNumber>=35&&waveNumber<=39)return Math.max(durable?14:12,Math.floor(base*(durable?1.28:1.18)));
 if(waveNumber!==29)return Math.max(waveNumber>=20&&waveNumber%20===0?12:10,Math.floor(base));
 const lateRush = spawned>=Math.ceil(total*.55);
 return Math.max(10,Math.floor(base*(lateRush||durable?1.3:1.24)));
}

function pathLength(points) {
 let total = 0;
 for(let i=1;i<points.length;i++)total += Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
 return total;
}

function pointAtDistance(points, distance) {
 let remaining = Math.max(0,distance);
 for(let i=1;i<points.length;i++){
  const [ax,ay]=points[i-1],[bx,by]=points[i];
  const length=Math.hypot(bx-ax,by-ay);
  if(remaining<=length){
   const ratio=length?remaining/length:0;
   return [ax+(bx-ax)*ratio,ay+(by-ay)*ratio];
  }
  remaining-=length;
 }
 return points.at(-1);
}

function referenceTowers(data, mode, waveNumber) {
 const available = mode==="story"
  ? ["doro","hima","witch"]
  : waveNumber>=80
   ? ["star","king","doro","witch","hima"]
   : waveNumber>=40
    ? ["king","doro","witch","hima"]
    : ["doro","witch","hima"];
 const count = Math.min(TOWER_SPOTS.length,mode==="story"?6+Math.ceil(waveNumber*.75):10+Math.ceil(waveNumber*.24));
 const level = Math.min(10,mode==="story"?3+Math.floor(waveNumber/3):5+Math.floor(waveNumber/12));
 return REFERENCE_SPOT_ORDER.slice(0,count).map((spotIndex,index)=>{
  const [x,y]=TOWER_SPOTS[spotIndex];
  const kind=available[index%available.length],type=data.towers[kind],upgrades=level-1;
  return {
   kind,x,y,cool:0,
   range:type.range+upgrades*10,
   rate:type.rate*Math.pow(.985,upgrades),
   damage:type.damage*Math.pow(1.15,upgrades),
   type
  };
 });
}

function dealDamage(enemy, tower, amount) {
 const type=enemy.type,star=tower.kind==="star";
 const mitigation=enemy.damageTaken;
 if(enemy.shield>0){
  enemy.shield=Math.max(0,enemy.shield-amount*mitigation*(star?tower.type.shieldDamageMultiplier:1));
  enemy.hp-=amount*mitigation*(type.shieldBodyDamage??.1);
  return;
 }
 enemy.hp-=amount*mitigation*(star&&type.armor?tower.type.armorDamageMultiplier:1);
}

function simulateWave({data,mode,waveNumber,seed=20260725,maxFrames=18000}) {
 const rng = seededRandom(seed+waveNumber+(mode==="endless"?1000:0));
 const config = mode==="story" ? storyWaveConfig(data,waveNumber-1) : endlessWaveConfig(waveNumber-1);
 const roster = mode==="story" ? storyRoster(data,waveNumber) : endlessRoster(data,waveNumber);
 const assignments = roster.map(()=>mode==="endless"&&waveNumber>=35&&rng()<.5?"branch":"main");
 const routeLengths = {main:pathLength(MAIN_PATH),branch:pathLength(BRANCH_PATH)};
 const towers = referenceTowers(data,mode,waveNumber);
 const active = [];
 let frame = 0;
 let nextSpawnFrame = mode==="endless"&&waveNumber>=20&&waveNumber%20===0 ? 150 : 0;
 let spawned = 0;
 let escaped = 0;
 let defeated = 0;
 let totalHp = 0;
 let totalShield = 0;
 const kinds = {};
 while(frame<=maxFrames&&(spawned<roster.length||active.length)){
  if(spawned<roster.length&&frame>=nextSpawnFrame){
   const kind = roster[spawned];
   const enemy = data.enemies[kind];
   if(!enemy)throw new Error(`${mode} Wave ${waveNumber}: unknown enemy ${kind}`);
   const routeId = assignments[spawned];
   const giantScale = kind==="giantShield"&&mode==="endless"&&waveNumber>=18&&waveNumber<=22?.7:kind==="giantShield"&&mode==="endless"&&waveNumber<=30?.8:kind==="giantShield"&&mode==="endless"&&waveNumber<=40?.9:1;
   const bossWaveScale = mode==="endless"&&waveNumber>=100 ? 1+Math.floor((waveNumber-80)/20)*.08 : 1;
   const midBossScale = mode==="endless"&&enemy.boss&&waveNumber>=30&&waveNumber<=40 ? waveNumber<35?.92:waveNumber<40?.9:.92 : 1;
   const marchScale = mode==="endless"&&waveNumber>=80&&waveNumber%20===0&&kind==="mainBoss" ? 1.28 : 1;
   const storyNormalScale = mode==="story"&&waveNumber>=14&&kind==="forest" ? .9 : 1;
   const storyFinalNormalScale = mode==="story"&&waveNumber===24&&kind==="forest" ? .92 : 1;
   const storyFinalBossScale = mode==="story"&&waveNumber===24&&enemy.boss ? .9 : 1;
   const endlessKingScale = mode==="endless"&&kind==="mainBoss" ? 1+(waveNumber-1)*.12 : 1;
   const hp = config.hp*enemy.hp*storyNormalScale*storyFinalNormalScale*storyFinalBossScale*midBossScale*endlessKingScale*marchScale*bossWaveScale;
   const earlyShieldScale = mode==="endless"&&waveNumber>=5&&waveNumber<=14&&kind==="shield" ? .9 : 1;
   const shield = enemy.shieldHp ? config.hp*enemy.shieldHp*earlyShieldScale*giantScale*(mode==="endless"&&waveNumber>=20&&waveNumber%20===0?bossWaveScale:1) : 0;
   const speedScale = kind==="giantShield"&&mode==="endless"&&waveNumber>=18&&waveNumber<=22?.85:kind==="giantShield"&&mode==="endless"&&waveNumber<=30?.9:kind==="giantShield"&&mode==="endless"&&waveNumber<=40?.95:1;
   const speed = config.speed*enemy.speed*speedScale;
   if(!Number.isFinite(hp)||!Number.isFinite(shield)||!Number.isFinite(speed)||speed<=0)throw new Error(`${mode} Wave ${waveNumber}: invalid stats for ${kind}`);
   active.push({kind,type:enemy,routeId,distance:0,remaining:routeLengths[routeId],speed,hp,shield,damageTaken:enemy.damageTaken??1,boss:!!enemy.boss});
   totalHp += hp;
   totalShield += shield;
   kinds[kind]=(kinds[kind]||0)+1;
   spawned++;
   nextSpawnFrame = frame+spawnInterval(data,mode,waveNumber,kind,spawned,roster.length);
  }
  for(const enemy of active){
   enemy.distance+=enemy.speed;
   enemy.remaining-=enemy.speed;
   [enemy.x,enemy.y]=pointAtDistance(enemy.routeId==="branch"?BRANCH_PATH:MAIN_PATH,enemy.distance);
  }
  for(const tower of towers){
   tower.cool--;
   if(tower.cool>0||tower.damage<=0)continue;
   const targets=active.filter(enemy=>enemy.hp>0&&Math.hypot(enemy.x-tower.x,enemy.y-tower.y)<=tower.range);
   targets.sort((a,b)=>{
    if(tower.kind==="doro"&&a.boss!==b.boss)return a.boss?-1:1;
    if(tower.kind==="star"&&(a.shield>0)!==(b.shield>0))return a.shield>0?-1:1;
    return a.remaining-b.remaining;
   });
   const target=targets[0];
   if(!target)continue;
   const damage=tower.damage*(tower.kind==="doro"&&target.boss?tower.type.bossDamageMultiplier:1);
   if(tower.kind==="witch")targets.slice(0,3).forEach(enemy=>dealDamage(enemy,tower,damage));
   else dealDamage(target,tower,damage);
   tower.cool=Math.max(1,Math.round(tower.rate));
  }
  for(let i=active.length-1;i>=0;i--){
   if(active[i].hp<=0){active.splice(i,1);defeated++}
   else if(active[i].remaining<=0){active.splice(i,1);escaped++}
  }
  frame++;
 }
 return {
  mode,wave:waveNumber,completed:spawned===roster.length&&defeated+escaped===roster.length,
  cleared:spawned===roster.length&&defeated===roster.length,
  frames:frame,seconds:Number((frame/60).toFixed(1)),enemies:roster.length,
  defeated,escaped,livesLost:escaped*Number(config.lifeDamage||1),
  totalHp:Math.round(totalHp),totalShield:Math.round(totalShield),
  kinds
 };
}

module.exports = {loadGameData,seededRandom,storyWaveConfig,endlessWaveConfig,storyRoster,endlessRoster,simulateWave};
