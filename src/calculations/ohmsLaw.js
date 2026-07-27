import chalk from 'chalk';
import inquirer from 'inquirer';
import { calculateOhmsLaw } from '../lib/calculators.js';
import { validateNumericInput } from '../lib/validation.js';
import { displayResult, showError } from '../ui/display.js';

export async function ohmsLaw(prefilledInputs = null) {
  console.log(chalk.bold.cyan('\n⚙️ OHM\'S LAW CALCULATOR\n'));
  console.log(chalk.gray('V = I × R    P = V × I    P = I² × R    P = V² / R\n'));

  let inputs = prefilledInputs;

  if (!inputs) {
    const { knowns } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'knowns',
      message: 'Check the values you know:',
      choices: [
        { name: 'Voltage (V)', value: 'voltage' },
        { name: 'Current (I)', value: 'current' },
        { name: 'Resistance (R)', value: 'resistance' },
        { name: 'Power (P)', value: 'power' }
      ],
      validate: (choices) => choices.length >= 2 || 'Please select at least 2 known values'
    }]);

    inputs = {};

    for (const known of knowns) {
      const answer = await inquirer.prompt([{
        type: 'input',
        name: 'value',
        message: `Enter ${known}:`,
        validate: (value) => validateNumericInput(value, { name: known, min: 0.000001 })
      }]);

      inputs[known] = answer.value;
    }
  }

  try {
    const results = calculateOhmsLaw(inputs);
    const displayData = {};

    if (results.voltage) displayData['Voltage (V)'] = `${results.voltage.toFixed(2)}V`;
    if (results.current) displayData['Current (I)'] = `${results.current.toFixed(2)}A`;
    if (results.resistance) displayData['Resistance (R)'] = `${results.resistance.toFixed(2)}Ω`;
    if (results.power) displayData['Power (P)'] = `${results.power.toFixed(2)}W`;
    displayData['Formulas Used'] = 'V=IR, P=VI, P=I²R, P=V²/R';

    displayResult('OHM\'S LAW RESULTS', displayData);
    return results;
  } catch (error) {
    showError(error.message);
    return null;
  }
}