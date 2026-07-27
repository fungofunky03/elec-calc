import chalk from 'chalk';
import inquirer from 'inquirer';
import { getWireList } from '../data/wireData.js';
import { calculateVoltageDrop } from '../lib/calculators.js';
import { validateNumericInput } from '../lib/validation.js';
import { displayResult, showError, showWarning } from '../ui/display.js';

function normalizeInput(args) {
  if (!args.length) {
    return null;
  }

  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    return args[0];
  }

  if (args.length < 4) {
    throw new Error('Voltage drop direct mode requires current, distance, voltage, and wire size');
  }

  const [current, distance, voltage, wireSize, phase] = args;
  return { current, distance, voltage, wireSize, phase };
}

export async function voltageDrop(...args) {
  console.log(chalk.bold.cyan('\n🔋 VOLTAGE DROP CALCULATION\n'));

  try {
    const directInput = normalizeInput(args);
    let inputs;

    if (!directInput?.current || !directInput?.distance || !directInput?.voltage || !directInput?.wireSize) {
      inputs = await inquirer.prompt([
        {
          type: 'input',
          name: 'current',
          message: 'Load current (amperes):',
          validate: (value) => validateNumericInput(value, { name: 'Current', min: 0.000001 })
        },
        {
          type: 'input',
          name: 'distance',
          message: 'One-way distance (feet):',
          validate: (value) => validateNumericInput(value, { name: 'Distance', min: 0.000001 })
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
          type: 'list',
          name: 'phase',
          message: 'Circuit phase:',
          choices: [
            { name: 'Single phase', value: 'single' },
            { name: 'Three phase', value: 'three' }
          ],
          default: 'single'
        },
        {
          type: 'input',
          name: 'customVoltage',
          message: 'Enter custom voltage:',
          when: (answers) => answers.voltage === 'custom',
          validate: (value) => validateNumericInput(value, { name: 'Voltage', min: 0.000001 })
        },
        {
          type: 'list',
          name: 'wireSize',
          message: 'Wire size (AWG/kcmil):',
          choices: getWireList().map(size => ({ name: `${size} AWG`, value: size }))
        }
      ]);
    } else {
      inputs = directInput;
    }

    const result = calculateVoltageDrop({
      current: inputs.current,
      distance: inputs.distance,
      voltage: inputs.voltage === 'custom' ? inputs.customVoltage : inputs.voltage,
      wireSize: inputs.wireSize,
      phase: inputs.phase || 'single'
    });

    const results = {
      'Wire Size': `${result.wireSize} AWG`,
      'System Voltage': `${result.systemVoltage}V`,
      'Circuit Phase': result.phase === 'three' ? 'Three phase' : 'Single phase',
      'Load Current': `${result.loadCurrent}A`,
      'Distance': `${result.distance}ft`,
      'Wire Resistance': `${result.resistance}Ω/1000ft`,
      'Voltage Drop': `${result.voltageDrop.toFixed(2)}V`,
      'Voltage Drop %': `${result.voltageDropPercent.toFixed(2)}%`,
      'Voltage at Load': `${result.voltageAtLoad.toFixed(2)}V`,
      'Power Loss': `${(result.powerLossWatts / 1000).toFixed(3)}kW`
    };

    displayResult('VOLTAGE DROP RESULTS', results);

    result.warnings.forEach(showWarning);

    return result;
  } catch (error) {
    showError(error.message);
    return null;
  }
}