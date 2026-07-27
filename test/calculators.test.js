import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCommercialDemand,
  calculateConduitFillCheck,
  calculateConduitSize,
  calculateOhmsLaw,
  calculateResidentialService,
  calculateServiceWireSize,
  calculateVoltageDrop,
  calculateWireSize,
  getConduitFillTable
} from '../src/lib/calculators.js';

test('calculateVoltageDrop uses single-phase multiplier and warnings', () => {
  const result = calculateVoltageDrop({
    current: 20,
    distance: 100,
    voltage: 120,
    wireSize: '12',
    phase: 'single'
  });

  assert.equal(result.voltageDrop.toFixed(2), '7.72');
  assert.equal(result.voltageDropPercent.toFixed(2), '6.43');
  assert.deepEqual(result.warnings, ['Voltage drop exceeds 5% - consider larger wire size']);
});

test('calculateVoltageDrop supports three-phase calculations', () => {
  const result = calculateVoltageDrop({
    current: 20,
    distance: 100,
    voltage: 480,
    wireSize: '12',
    phase: 'three'
  });

  assert.equal(result.voltageDrop.toFixed(2), '6.69');
  assert.equal(result.phase, 'three');
});

test('conduit calculations expose supported and unsupported cases clearly', () => {
  const checkResult = calculateConduitFillCheck({
    conduitType: 'EMT',
    conduitSize: '1/2',
    wireSize: '12',
    wireCount: 7
  });

  assert.equal(checkResult.acceptable, true);
  assert.equal(checkResult.fillPercent, 100);

  const sizeResult = calculateConduitSize({
    conduitType: 'EMT',
    wireSize: '12',
    wireCount: 20
  });

  assert.equal(sizeResult.minimumSize, '1');

  assert.throws(
    () => getConduitFillTable({ conduitType: 'RMC', wireSize: '1/0' }),
    /not supported/
  );
});

test('service calculations return consistent residential and commercial results', () => {
  const residential = calculateResidentialService({
    sqft: 2000,
    smallAppliances: 2,
    laundry: 1,
    waterHeater: 4.5,
    hvac: 3.5,
    range: 12,
    dryer: 5
  });

  assert.equal(residential.dwellingBaseLoad, 10500);
  assert.equal(residential.dwellingDemandLoad, 10200);
  assert.equal(residential.totalDemandVa, 31200);
  assert.equal(residential.serviceSize, '150A');

  const commercial = calculateCommercialDemand({
    connectedLoad: 100,
    demandFactor: 0.5
  });

  assert.equal(commercial.demandLoadKw, 50);
  assert.equal(commercial.demandAmps.toFixed(1), '60.1');
});

test('ohms law, service wire, and wire sizing core calculations are reusable', () => {
  const ohmsLaw = calculateOhmsLaw({ voltage: 120, current: 2 });
  assert.equal(ohmsLaw.resistance, 60);
  assert.equal(ohmsLaw.power, 240);

  const serviceWire = calculateServiceWireSize({ serviceAmps: 225, serviceType: 'single' });
  assert.equal(serviceWire.minimumWireSize, '4/0 AWG');

  const wireSize = calculateWireSize({
    loadCurrent: 24,
    derate: 1,
    continuous: 1.25,
    tempRating: 75
  });

  assert.equal(wireSize.requiredAmpacity, 30);
  assert.equal(wireSize.recommendedWire, '10');
});
