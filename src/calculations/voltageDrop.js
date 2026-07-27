import chalk from 'chalk';
import inquirer from 'inquirer';
import { wireResistance, getWireList } from '../data/wireData.js';
import { displayResult, showWarning } from '../ui/display.js';

export async function voltageDrop(current, distance, voltage, wireSize) {
  console.log(chalk.bold.cyan('\n🔋 VOLTAGE DROP CALCULATION\n'));
  
  let inputs;
  
  if (!current || !distance || !voltage || !wireSize) {
    inputs = await inquirer.prompt([
      {
        type: 'input',
        name: 'current',
        message: 'Load current (amperes):',
        validate: (value) => {
          const num = parseFloat(value);
          return !isNaN(num) && num > 0 || 'Please enter a valid current value';
        }
      },
      {
        type: 'input',
        name: 'distance',
        message: 'One-way distance (feet):',
        validate: (value) => {
          const num = parseFloat(value);
          return !isNaN(num) && num > 0 || 'Please enter a valid distance value';
        }
      },
      {
        type: 'list',
        name: 'voltage',
        message: 'System voltage:',
        choices: [
          { name: '120V Single Phase', value: 120 },
          { name: '208V Single Phase', value: 208 },
          { name: '240V Single Phase', value: 240 },
          { name: '277V Single Phase', value: 277 },
          { name: '480V Three Phase', value: 480 },
          { name: 'Custom', value: 'custom' }
        ]
      },
      {
        type: 'input',
        name: 'customVoltage',
        message: 'Enter custom voltage:',
        when: (answers) => answers.voltage === 'custom',
        validate: (value) => {
          const num = parseFloat(value);
          return !isNaN(num) && num > 0 || 'Please enter a valid voltage value';
        }
      },
      {
        type: 'list',
        name: 'wireSize',
        message: 'Wire size (AWG/kcmil):',
        choices: getWireList().map(size => ({ name: `${size} AWG`, value: size }))
      },
      {
        type: 'list',
        name: 'powerFactor',
        message: 'Power factor (for AC calculations):',
        choices: [
          { name: '1.0 (Resistive load)', value: 1.0 },
          { name: '0.9 (Good inductive)', value: 0.9 },
          { name: '0.8 (Average inductive)', value: 0.8 },
          { name: '0.7 (Poor inductive)', value: 0.7 }
        ]
      }
    ]);
  } else {
    inputs = { current, distance, voltage, wireSize, powerFactor: 1.0 };
  }
  
  const systemVoltage = inputs.voltage === 'custom' ? parseFloat(inputs.customVoltage) : inputs.voltage;
  const loadCurrent = parseFloat(inputs.current);
  const dist = parseFloat(inputs.distance);
  const resistance = wireResistance[inputs.wireSize];
  const pf = inputs.powerFactor || 1.0;
  
  if (!resistance) {
    showWarning(`Wire size ${inputs.wireSize} not found in database`);
    return;
  }
  
  // Calculate voltage drop
  // VD = 2 * K * I * L * R / 1000
  // Where: K = 1 for single phase, √3 for 3-phase
  // For simplicity, using K=1 (single phase formula)
  const voltageDrop = (2 * loadCurrent * dist * resistance * pf) / 1000;
  const voltageDropPercent = (voltageDrop / systemVoltage) * 100;
  const voltageAtLoad = systemVoltage - voltageDrop;
  
  // Calculate power loss
  const powerLoss = (loadCurrent * voltageDrop * pf) / 1000; // kW
  const powerLossPercent = (voltageDrop / systemVoltage) * 100;
  
  const results = {
    'Wire Size': `${inputs.wireSize} AWG`,
    'System Voltage': `${systemVoltage}V`,
    'Load Current': `${loadCurrent}A`,
    'Distance': `${dist}ft`,
    'Wire Resistance': `${resistance}Ω/1000ft`,
    'Voltage Drop': `${voltageDrop.toFixed(2)}V`,
    'Voltage Drop %': `${voltageDropPercent.toFixed(2)}%`,
    'Voltage at Load': `${voltageAtLoad.toFixed(2)}V`,
    'Power Loss': `${powerLoss.toFixed(3)}kW`,
    'Power Factor': pf.toString()
  };
  
  displayResult('VOLTAGE DROP RESULTS', results);
  
  // Show warnings for high voltage drop
  if (voltageDropPercent > 5) {
    showWarning('Voltage drop exceeds 5% - consider larger wire size');
  } else if (voltageDropPercent > 3) {
    showWarning('Voltage drop exceeds 3% - verify if acceptable for application');
  }
  
  return results;
}