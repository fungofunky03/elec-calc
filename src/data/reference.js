export const voltageDropReference = {
  recommendedMaxPercent: 3,
  maximumBranchCircuitPercent: 5,
  defaultPhase: 'single'
};

export const dwellingServiceReference = {
  systemVoltage: 240,
  lightingVaPerSqFt: 3,
  smallApplianceVaPerCircuit: 1500,
  laundryVaPerCircuit: 1500,
  firstDemandVaAtFullLoad: 10000,
  remainderDemandFactor: 0.4,
  minimumDryerVa: 5000
};

export const wireSizingReference = {
  defaultTemperatureRating: 75,
  nearMinimumWarningPercent: 10
};
