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
  .action(async (options) => {
    if (options.current && options.distance && options.voltage && options.wire) {
      const result = voltageDrop(
        parseFloat(options.current),
        parseFloat(options.distance),
        parseFloat(options.voltage),
        options.wire
      );
      console.log(result);
    } else {
      await voltageDrop();
    }
  });

program
  .command('conduit-fill')
  .description('Calculate conduit fill and sizing')
  .action(async () => {
    await conduitFill();
  });

program
  .command('service')
  .description('Service entrance calculations')
  .action(async () => {
    await serviceCalc();
  });

program
  .command('ohms-law')
  .description('Ohm\'s Law calculations (V=IR, P=VI)')
  .action(async () => {
    await ohmsLaw();
  });

program
  .command('wire-size')
  .description('Wire sizing calculations')
  .action(async () => {
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