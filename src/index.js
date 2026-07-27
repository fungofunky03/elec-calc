#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import boxen from 'boxen';
import { voltageDrop } from './calculations/voltageDrop.js';
import { conduitFill } from './calculations/conduitFill.js';
import { serviceCalc } from './calculations/serviceCalc.js';
import { ohmsLaw } from './calculations/ohmsLaw.js';
import { wireSize } from './calculations/wireSize.js';
import { showBanner, showMenu } from './ui/display.js';

const program = new Command();

program
  .name('elec')
  .description('🔌 Professional Electrical Calculations CLI')
  .version('1.0.0');

// Interactive mode (default)
program
  .action(async () => {
    await runInteractiveMode();
  });

// Direct calculation commands
program
  .command('voltage-drop')
  .description('Calculate voltage drop')
  .option('-c, --current <amps>', 'Current in amperes')
  .option('-d, --distance <feet>', 'Distance in feet')
  .option('-v, --voltage <volts>', 'System voltage')
  .option('-w, --wire <awg>', 'Wire size (AWG)')
  .option('-p, --phase <phase>', 'Circuit phase: single or three', 'single')
  .action(async (options) => {
    if (options.current && options.distance && options.voltage && options.wire) {
      await voltageDrop({
        current: options.current,
        distance: options.distance,
        voltage: options.voltage,
        wireSize: options.wire,
        phase: options.phase
      });
    } else {
      await voltageDrop();
    }
  });

program
  .command('conduit-fill')
  .description('Calculate conduit fill and sizing')
  .option('-m, --mode <mode>', 'Mode: check, size, or table')
  .option('-t, --conduit-type <type>', 'Conduit type')
  .option('-s, --conduit-size <size>', 'Conduit size for check/table mode')
  .option('-w, --wire <awg>', 'Wire size (AWG)')
  .option('-n, --count <conductors>', 'Number of conductors')
  .action(async (options) => {
    if (options.mode) {
      await conduitFill({
        mode: options.mode,
        conduitType: options.conduitType,
        conduitSize: options.conduitSize,
        wireSize: options.wire,
        wireCount: options.count
      });
      return;
    }

    await conduitFill();
  });

program
  .command('service')
  .description('Service entrance calculations and estimates')
  .option('-m, --mode <mode>', 'Mode: residential, commercial, or wire')
  .option('--sqft <squareFeet>', 'Residential square footage')
  .option('--small-appliances <count>', 'Residential small appliance circuits')
  .option('--laundry <count>', 'Residential laundry circuits')
  .option('--water-heater <kw>', 'Residential water heater load in kW')
  .option('--hvac <kw>', 'Residential HVAC load in kW')
  .option('--range <kw>', 'Residential electric range load in kW')
  .option('--dryer <kw>', 'Residential dryer load in kW')
  .option('--connected-load <kw>', 'Commercial connected load in kW')
  .option('--demand-factor <factor>', 'Commercial demand factor between 0 and 1')
  .option('--service-amps <amps>', 'Service amperage rating for wire sizing')
  .option('--service-type <type>', 'Wire sizing service type: single, 208, or 480')
  .action(async (options) => {
    if (options.mode) {
      await serviceCalc({
        mode: options.mode,
        sqft: options.sqft,
        smallAppliances: options.smallAppliances,
        laundry: options.laundry,
        waterHeater: options.waterHeater,
        hvac: options.hvac,
        range: options.range,
        dryer: options.dryer,
        connectedLoad: options.connectedLoad,
        demandFactor: options.demandFactor,
        serviceAmps: options.serviceAmps,
        serviceType: options.serviceType
      });
      return;
    }

    await serviceCalc();
  });

program
  .command('ohms-law')
  .description('Ohm\'s Law calculations (V=IR, P=VI)')
  .option('--voltage <volts>', 'Voltage in volts')
  .option('--current <amps>', 'Current in amps')
  .option('--resistance <ohms>', 'Resistance in ohms')
  .option('--power <watts>', 'Power in watts')
  .action(async (options) => {
    const knownValues = ['voltage', 'current', 'resistance', 'power']
      .filter((key) => options[key] !== undefined);

    if (knownValues.length >= 2) {
      await ohmsLaw({
        voltage: options.voltage,
        current: options.current,
        resistance: options.resistance,
        power: options.power
      });
      return;
    }

    await ohmsLaw();
  });

program
  .command('wire-size')
  .description('Wire sizing calculations')
  .option('-c, --current <amps>', 'Load current in amperes')
  .option('-t, --temp-rating <degreesC>', 'Wire temperature rating: 60, 75, or 90')
  .option('-d, --derate <factor>', 'Derating factor between 0.1 and 1.0', '1.0')
  .option('--continuous <factor>', 'Continuous load multiplier', '1.0')
  .action(async (options) => {
    if (options.current) {
      await wireSize({
        loadCurrent: options.current,
        tempRating: options.tempRating || 75,
        derate: options.derate,
        continuous: options.continuous
      });
      return;
    }

    await wireSize();
  });

async function runInteractiveMode() {
  console.clear();
  showBanner();
  
  while (true) {
    const choice = await showMenu();
    
    switch (choice.action) {
      case 'voltage-drop':
        await voltageDrop();
        break;
      case 'conduit-fill':
        await conduitFill();
        break;
      case 'service':
        await serviceCalc();
        break;
      case 'ohms-law':
        await ohmsLaw();
        break;
      case 'wire-size':
        await wireSize();
        break;
      case 'exit':
        console.log(chalk.yellow('\n⚡ Stay safe out there! ⚡'));
        process.exit(0);
    }
    
    const { continue: shouldContinue } = await inquirer.prompt([{
      type: 'confirm',
      name: 'continue',
      message: 'Run another calculation?',
      default: true
    }]);
    
    if (!shouldContinue) {
      console.log(chalk.yellow('\n⚡ Stay safe out there! ⚡'));
      break;
    }
    
    console.clear();
    showBanner();
  }
}

program.parse();