import { conduitFill, getConduitArea, getConduitFill, getConduitSizes, getConduitTypes } from '../data/conduitData.js';
import { dwellingServiceReference, voltageDropReference, wireSizingReference } from '../data/reference.js';
import { getWireList, wireAmpacity, wireResistance } from '../data/wireData.js';
import { ValidationError, parseChoice, parseNumber } from './validation.js';

const PHASE_MULTIPLIER = {
  single: 2,
  three: Math.sqrt(3)
};

export function calculateVoltageDrop({
  current,
  distance,
  voltage,
  wireSize,
  phase = voltageDropReference.defaultPhase
}) {
  const loadCurrent = parseNumber(current, { name: 'Current', min: 0.000001 });
  const runDistance = parseNumber(distance, { name: 'Distance', min: 0.000001 });
  const systemVoltage = parseNumber(voltage, { name: 'Voltage', min: 0.000001 });
  const selectedPhase = parseChoice(phase, Object.keys(PHASE_MULTIPLIER), 'Phase');

  if (!getWireList().includes(wireSize)) {
    throw new ValidationError(`Wire size ${wireSize} is not available`);
  }

  const resistance = wireResistance[wireSize];
  const multiplier = PHASE_MULTIPLIER[selectedPhase];
  const dropVolts = (multiplier * loadCurrent * runDistance * resistance) / 1000;
  const dropPercent = (dropVolts / systemVoltage) * 100;
  const voltageAtLoad = systemVoltage - dropVolts;
  const powerLossWatts = selectedPhase === 'three'
    ? (3 * loadCurrent * loadCurrent * runDistance * resistance) / 1000
    : (2 * loadCurrent * loadCurrent * runDistance * resistance) / 1000;

  return {
    wireSize,
    systemVoltage,
    loadCurrent,
    distance: runDistance,
    phase: selectedPhase,
    resistance,
    voltageDrop: dropVolts,
    voltageDropPercent: dropPercent,
    voltageAtLoad,
    powerLossWatts,
    warnings: [
      ...(dropPercent > voltageDropReference.maximumBranchCircuitPercent
        ? ['Voltage drop exceeds 5% - consider larger wire size']
        : []),
      ...(dropPercent > voltageDropReference.recommendedMaxPercent &&
      dropPercent <= voltageDropReference.maximumBranchCircuitPercent
        ? ['Voltage drop exceeds 3% - verify if acceptable for application']
        : [])
    ]
  };
}

export function calculateConduitFillCheck({ conduitType, conduitSize, wireSize, wireCount }) {
  const supportedTypes = getConduitTypes();
  const selectedType = parseChoice(conduitType, supportedTypes, 'Conduit type');
  const selectedSize = parseChoice(conduitSize, getConduitSizes(selectedType), 'Conduit size');
  const conductors = parseNumber(wireCount, { name: 'Number of conductors', min: 1, integer: true });
  const maxFill = getConduitFill(selectedType, selectedSize, wireSize);

  if (!maxFill) {
    throw new ValidationError(
      `${wireSize} AWG is not supported for ${selectedSize}" ${selectedType} in the bundled conduit table`
    );
  }

  const fillPercent = (conductors / maxFill) * 100;

  return {
    conduitType: selectedType,
    conduitSize: selectedSize,
    wireSize,
    conductors,
    maxFill,
    fillPercent,
    acceptable: fillPercent <= 100
  };
}

export function calculateConduitSize({ conduitType, wireSize, wireCount }) {
  const supportedTypes = getConduitTypes();
  const selectedType = parseChoice(conduitType, supportedTypes, 'Conduit type');
  const conductors = parseNumber(wireCount, { name: 'Number of conductors', min: 1, integer: true });
  const supportedSizes = getConduitSizes(selectedType);

  const recommendedSize = supportedSizes.find((size) => getConduitFill(selectedType, size, wireSize) >= conductors);

  if (!recommendedSize) {
    throw new ValidationError(
      `No bundled ${selectedType} conduit size supports ${conductors} conductors of ${wireSize} AWG`
    );
  }

  return {
    conduitType: selectedType,
    wireSize,
    conductors,
    minimumSize: recommendedSize
  };
}

export function getConduitFillTable({ conduitType, wireSize }) {
  const supportedTypes = getConduitTypes();
  const selectedType = parseChoice(conduitType, supportedTypes, 'Conduit type');

  const rows = getConduitSizes(selectedType)
    .map((size) => ({
      size,
      maxConductors: getConduitFill(selectedType, size, wireSize),
      area: getConduitArea(selectedType, size)
    }))
    .filter((row) => row.maxConductors > 0);

  if (!rows.length) {
    throw new ValidationError(`${wireSize} AWG is not supported for ${selectedType} in the bundled conduit table`);
  }

  return rows;
}

export function calculateResidentialService({
  sqft,
  smallAppliances = 2,
  laundry = 1,
  waterHeater = 4.5,
  hvac = 3.5,
  range = 0,
  dryer = 0
}) {
  const squareFeet = parseNumber(sqft, { name: 'House square footage', min: 1 });
  const applianceCircuits = parseNumber(smallAppliances, { name: 'Small appliance circuits', min: 0, integer: true });
  const laundryCircuits = parseNumber(laundry, { name: 'Laundry circuits', min: 0, integer: true });
  const waterHeaterKw = parseNumber(waterHeater, { name: 'Water heater load', min: 0 });
  const hvacKw = parseNumber(hvac, { name: 'HVAC load', min: 0 });
  const rangeKw = parseNumber(range, { name: 'Electric range load', min: 0 });
  const dryerKw = parseNumber(dryer, { name: 'Electric dryer load', min: 0 });

  const generalLighting = squareFeet * dwellingServiceReference.lightingVaPerSqFt;
  const smallApplianceLoad = applianceCircuits * dwellingServiceReference.smallApplianceVaPerCircuit;
  const laundryLoad = laundryCircuits * dwellingServiceReference.laundryVaPerCircuit;

  const dwellingBaseLoad = generalLighting + smallApplianceLoad + laundryLoad;
  const dwellingDemandLoad = dwellingBaseLoad > dwellingServiceReference.firstDemandVaAtFullLoad
    ? dwellingServiceReference.firstDemandVaAtFullLoad +
      (dwellingBaseLoad - dwellingServiceReference.firstDemandVaAtFullLoad) *
        dwellingServiceReference.remainderDemandFactor
    : dwellingBaseLoad;

  const waterHeaterVa = waterHeaterKw * 1000;
  const hvacVa = hvacKw * 1000;
  const rangeDemandVa = rangeKw > 0
    ? (rangeKw <= 12 ? 8000 : rangeKw * 1000 * 0.8)
    : 0;
  const dryerDemandVa = dryerKw > 0
    ? Math.max(dwellingServiceReference.minimumDryerVa, dryerKw * 1000)
    : 0;

  const totalDemandVa = dwellingDemandLoad + waterHeaterVa + hvacVa + rangeDemandVa + dryerDemandVa;
  const demandAmps = totalDemandVa / dwellingServiceReference.systemVoltage;

  let serviceSize;
  if (demandAmps <= 100) serviceSize = '100A';
  else if (demandAmps <= 150) serviceSize = '150A';
  else if (demandAmps <= 200) serviceSize = '200A';
  else serviceSize = '400A';

  return {
    generalLighting,
    smallApplianceLoad,
    laundryLoad,
    dwellingBaseLoad,
    dwellingDemandLoad,
    waterHeaterVa,
    hvacVa,
    rangeDemandVa,
    dryerDemandVa,
    totalDemandVa,
    demandAmps,
    serviceSize,
    warnings: demandAmps > 200
      ? ['Large electrical load - verify with utility for service availability']
      : []
  };
}

export function calculateCommercialDemand({ connectedLoad, demandFactor }) {
  const connectedLoadKw = parseNumber(connectedLoad, { name: 'Connected load', min: 0.000001 });
  const selectedDemandFactor = parseNumber(demandFactor, { name: 'Demand factor', min: 0.000001, max: 1 });
  const demandLoad = connectedLoadKw * selectedDemandFactor;
  const demandAmps = (demandLoad * 1000) / (480 * Math.sqrt(3));

  return {
    connectedLoadKw,
    demandFactor: selectedDemandFactor,
    demandLoadKw: demandLoad,
    demandAmps
  };
}

export function calculateServiceWireSize({ serviceAmps, serviceType }) {
  const amps = parseNumber(serviceAmps, { name: 'Service amperage rating', min: 0.000001 });
  const selectedServiceType = parseChoice(serviceType, ['single', '208', '480'], 'Service type');

  let wireSize;
  if (amps <= 100) wireSize = '2 AWG';
  else if (amps <= 125) wireSize = '1 AWG';
  else if (amps <= 150) wireSize = '1/0 AWG';
  else if (amps <= 175) wireSize = '2/0 AWG';
  else if (amps <= 200) wireSize = '3/0 AWG';
  else if (amps <= 225) wireSize = '4/0 AWG';
  else if (amps <= 250) wireSize = '250 kcmil';
  else if (amps <= 300) wireSize = '350 kcmil';
  else wireSize = 'Requires parallel conductors';

  return {
    serviceAmps: amps,
    serviceType: selectedServiceType,
    minimumWireSize: wireSize
  };
}

export function calculateOhmsLaw(values) {
  const providedEntries = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== '');

  if (providedEntries.length < 2) {
    throw new ValidationError('Provide at least two known values');
  }

  const inputs = Object.fromEntries(
    providedEntries.map(([key, value]) => [key, parseNumber(value, { name: key, min: 0.000001 })])
  );

  const results = { ...inputs };

  if (inputs.voltage && inputs.current) {
    if (!inputs.resistance) results.resistance = inputs.voltage / inputs.current;
    if (!inputs.power) results.power = inputs.voltage * inputs.current;
  } else if (inputs.voltage && inputs.resistance) {
    if (!inputs.current) results.current = inputs.voltage / inputs.resistance;
    if (!inputs.power) results.power = (inputs.voltage * inputs.voltage) / inputs.resistance;
  } else if (inputs.current && inputs.resistance) {
    if (!inputs.voltage) results.voltage = inputs.current * inputs.resistance;
    if (!inputs.power) results.power = inputs.current * inputs.current * inputs.resistance;
  } else if (inputs.voltage && inputs.power) {
    if (!inputs.current) results.current = inputs.power / inputs.voltage;
    if (!inputs.resistance) results.resistance = (inputs.voltage * inputs.voltage) / inputs.power;
  } else if (inputs.current && inputs.power) {
    if (!inputs.voltage) results.voltage = inputs.power / inputs.current;
    if (!inputs.resistance) results.resistance = inputs.power / (inputs.current * inputs.current);
  } else if (inputs.resistance && inputs.power) {
    if (!inputs.voltage) results.voltage = Math.sqrt(inputs.power * inputs.resistance);
    if (!inputs.current) results.current = Math.sqrt(inputs.power / inputs.resistance);
  } else {
    throw new ValidationError('Could not resolve the requested values from the provided inputs');
  }

  return results;
}

export function calculateWireSize({
  loadCurrent,
  derate = 1,
  continuous = 1,
  tempRating = wireSizingReference.defaultTemperatureRating
}) {
  const current = parseNumber(loadCurrent, { name: 'Load current', min: 0.000001 });
  const deratingFactor = parseNumber(derate, { name: 'Derating factor', min: 0.1, max: 1 });
  const continuousMultiplier = parseNumber(continuous, { name: 'Continuous load multiplier', min: 1 });
  const temperatureRating = parseChoice(Number(tempRating), [60, 75, 90], 'Temperature rating');

  const adjustedCurrent = current * continuousMultiplier;
  const requiredAmpacity = adjustedCurrent / deratingFactor;

  let recommendedWire = null;
  let selectedAmpacity = null;

  for (const wireSize of getWireList()) {
    const ampacity = wireAmpacity[wireSize];
    if (ampacity >= requiredAmpacity) {
      recommendedWire = wireSize;
      selectedAmpacity = ampacity;
      break;
    }
  }

  const currentIndex = recommendedWire ? getWireList().indexOf(recommendedWire) : -1;
  const nextWire = currentIndex >= 0 ? getWireList()[currentIndex + 1] : null;

  return {
    loadCurrent: current,
    deratingFactor,
    continuousMultiplier,
    adjustedCurrent,
    requiredAmpacity,
    recommendedWire,
    selectedAmpacity,
    temperatureRating,
    nextWire,
    warnings: [
      ...(!recommendedWire ? ['Load current exceeds standard wire ampacities! Consider parallel conductors.'] : []),
      ...(recommendedWire && selectedAmpacity < requiredAmpacity * (1 + wireSizingReference.nearMinimumWarningPercent / 100)
        ? ['Wire size is close to minimum - consider next size up for safety margin.']
        : [])
    ]
  };
}

export function getSupportedConduitTypes() {
  return getConduitTypes();
}

export function getSupportedConduitSizes(type) {
  return getConduitSizes(type);
}
