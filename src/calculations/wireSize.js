import chalk from 'chalk';
import inquirer from 'inquirer';
import { wireAmpacity } from '../data/wireData.js';
import { calculateWireSize } from '../lib/calculators.js';
import { validateNumericInput } from '../lib/validation.js';
import { displayResult, showError, showWarning } from '../ui/display.js';

export async function wireSize(prefilledInputs = null) {
  console.log(chalk.bold.cyan('\n📏 WIRE SIZING CALCULATOR\n'));

  const inputs = prefilledInputs || await inquirer.prompt([
    {
      type: 'input',
      name: 'loadCurrent',
      message: 'Load current (amperes):',
      validate: (value) => validateNumericInput(value, { name: 'Load current', min: 0.000001 })
    },
    {
      type: 'list',
      name: 'tempRating',
      message: 'Wire temperature rating:',
      choices: [
        { name: '60°C (THWN-2, TW)', value: 60 },
        { name: '75°C (THHN, THWN-2)', value: 75 },
        { name: '90°C (THHN, XHHW-2)', value: 90 }
      ],
      default: 75
    },
    {
      type: 'input',
      name: 'derate',
      message: 'Derating factor (0.8 for 4+ conductors, 1.0 for 3 or less):',
      default: '1.0',
      validate: (value) => validateNumericInput(value, { name: 'Derating factor', min: 0.1, max: 1 })
    },
    {
      type: 'input',
      name: 'continuous',
      message: 'Continuous load multiplier (1.25 for continuous, 1.0 for non-continuous):',
      default: '1.0',
      validate: (value) => validateNumericInput(value, { name: 'Continuous load multiplier', min: 1 })
    }
  ]);

  try {
    const result = calculateWireSize(inputs);
    const results = {
      'Load Current': `${result.loadCurrent}A`,
      'Continuous Multiplier': `${result.continuousMultiplier}x`,
      'Adjusted Current': `${result.adjustedCurrent.toFixed(1)}A`,
      'Derating Factor': `${result.deratingFactor}x`,
      'Required Ampacity': `${result.requiredAmpacity.toFixed(1)}A`,
      'Minimum Wire Size': result.recommendedWire ? `${result.recommendedWire} AWG` : 'Exceeds standard sizes',
      'Wire Ampacity': result.selectedAmpacity ? `${result.selectedAmpacity}A` : 'N/A',
      'Temperature Rating': `${result.temperatureRating}°C`
    };

    displayResult('WIRE SIZING RESULTS', results);
    result.warnings.forEach(showWarning);

    if (result.nextWire) {
      console.log(chalk.gray(`\n💡 Next size up: ${result.nextWire} AWG (${wireAmpacity[result.nextWire]}A)`));
    }

    return result;
  } catch (error) {
    showError(error.message);
    return null;
  }
}