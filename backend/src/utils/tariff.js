const tariffByState = {
  "Tamil Nadu": {
    fixedCharge: 0,
    dutyPercent: 0,
    slabs: [
      { upto: 100, rate: 0 },
      { upto: 200, rate: 2.5 },
      { upto: 400, rate: 4.5 },
      { upto: 500, rate: 6.0 }
    ],
    above500: {
      startRate: 6.5,
      incrementPerBlock: 0.5,
      blockSize: 100
    }
  },
  Karnataka: {
    fixedCharge: 0,
    dutyPercent: 0,
    slabs: [
      { upto: 100, rate: 2.2 },
      { upto: 200, rate: 3.1 },
      { upto: 500, rate: 4.8 },
      { upto: Infinity, rate: 6.9 }
    ]
  },
  Maharashtra: {
    fixedCharge: 0,
    dutyPercent: 0,
    slabs: [
      { upto: 100, rate: 2.4 },
      { upto: 300, rate: 4.0 },
      { upto: 500, rate: 6.1 },
      { upto: Infinity, rate: 7.9 }
    ]
  }
};

export const getTariffConfig = (state) => tariffByState[state] || tariffByState["Tamil Nadu"];

export const calculateBillByTariff = (units, state) => {
  const { slabs, fixedCharge, dutyPercent, above500 } = getTariffConfig(state);
  let remaining = units;
  let prevLimit = 0;
  let energyCharge = 0;

  for (const slab of slabs) {
    if (remaining <= 0) {
      break;
    }
    const slabCap = slab.upto === Infinity ? remaining : slab.upto - prevLimit;
    const slabUnits = Math.min(remaining, slabCap);
    energyCharge += slabUnits * slab.rate;
    remaining -= slabUnits;
    prevLimit = slab.upto;
  }

  // For Tamil Nadu above 500 units, rate starts at 6.5 and increases per 100-unit block.
  if (remaining > 0 && above500) {
    let rate = above500.startRate;
    while (remaining > 0) {
      const blockUnits = Math.min(remaining, above500.blockSize);
      energyCharge += blockUnits * rate;
      remaining -= blockUnits;
      rate += above500.incrementPerBlock;
    }
  }

  const subtotal = energyCharge + fixedCharge;
  const final = subtotal * (1 + dutyPercent / 100);

  return {
    energyCharge: Number(energyCharge.toFixed(2)),
    fixedCharge,
    dutyPercent,
    total: Number(final.toFixed(2))
  };
};
