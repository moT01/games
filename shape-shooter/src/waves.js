export const WAVE_ENEMY_STATS = {
  drifter:  { hp: 1,  maxHp: 1,  speed: 115, scoreValue: 10,  shootCooldown: 0,   size: 14 },
  chaser:   { hp: 2,  maxHp: 2,  speed: 140, scoreValue: 20,  shootCooldown: 0,   size: 13 },
  shooter:  { hp: 2,  maxHp: 2,  speed: 60,  scoreValue: 25,  shootCooldown: 2.0, size: 15 },
  swarmer:  { hp: 1,  maxHp: 1,  speed: 200, scoreValue: 5,   shootCooldown: 0,   size: 7  },
  splitter: { hp: 2,  maxHp: 2,  speed: 100, scoreValue: 30,  shootCooldown: 0,   size: 16 },
  dasher:   { hp: 2,  maxHp: 2,  speed: 85,  scoreValue: 35,  shootCooldown: 0,   size: 14 },
  tank:     { hp: 10, maxHp: 10, speed: 35,  scoreValue: 80,  shootCooldown: 3.5, size: 22 },
};

function weighted(options) {
  const total = options.reduce((s, o) => s + o.w, 0);
  let r = Math.random() * total;
  for (const o of options) {
    r -= o.w;
    if (r <= 0) return o.type;
  }
  return options[options.length - 1].type;
}

export function getWaveComposition(wave) {
  const base = Math.min(30, 5 + Math.floor((wave - 1) * 2));
  const count = base + Math.floor(Math.random() * 4);

  let pool;
  if (wave <= 3) {
    pool = [{ type: 'drifter', w: 1 }];
  } else if (wave <= 6) {
    pool = [{ type: 'drifter', w: 6 }, { type: 'chaser', w: 4 }];
  } else if (wave <= 9) {
    pool = [{ type: 'drifter', w: 4 }, { type: 'chaser', w: 3 }, { type: 'shooter', w: 3 }];
  } else if (wave <= 12) {
    pool = [{ type: 'drifter', w: 3 }, { type: 'chaser', w: 2 }, { type: 'shooter', w: 2 }, { type: 'swarmer', w: 3 }];
  } else if (wave <= 15) {
    pool = [{ type: 'splitter', w: 3 }, { type: 'chaser', w: 2 }, { type: 'shooter', w: 2 }, { type: 'swarmer', w: 2 }, { type: 'drifter', w: 1 }];
  } else if (wave <= 18) {
    pool = [{ type: 'splitter', w: 2 }, { type: 'chaser', w: 2 }, { type: 'shooter', w: 2 }, { type: 'swarmer', w: 2 }, { type: 'dasher', w: 2 }];
  } else if (wave <= 21) {
    pool = [{ type: 'splitter', w: 2 }, { type: 'chaser', w: 2 }, { type: 'shooter', w: 2 }, { type: 'swarmer', w: 1 }, { type: 'dasher', w: 2 }, { type: 'tank', w: 1 }];
  } else {
    pool = [{ type: 'drifter', w: 1 }, { type: 'chaser', w: 2 }, { type: 'shooter', w: 2 }, { type: 'swarmer', w: 2 }, { type: 'splitter', w: 2 }, { type: 'dasher', w: 2 }, { type: 'tank', w: 1 }];
  }

  const types = [];
  let remaining = count;
  // Add 1-2 tanks for waves 19+
  if (wave >= 19) {
    const tankCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < Math.min(tankCount, remaining); i++) {
      types.push('tank');
      remaining--;
    }
  }

  // Swarmer clusters for waves 10+
  if (wave >= 10) {
    const clusterCount = Math.floor(Math.random() * 2) + 1;
    for (let c = 0; c < clusterCount && remaining > 0; c++) {
      const clusterSize = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < clusterSize; i++) types.push('swarmer');
      remaining--;
    }
  }

  for (let i = 0; i < remaining; i++) {
    types.push(weighted(pool));
  }

  // Shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}
