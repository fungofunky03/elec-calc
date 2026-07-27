import chalk from 'chalk';
import inquirer from 'inquirer';
import { displayResult } from '../ui/display.js';

export async function ohmsLaw() {
  console.log(chalk.bold.cyan('\n⚙️ OHM\'S LAW CALCULATOR\n'));
  console.log(chalk.gray('V = I × R    P = V × I    P = I² × R    P = V² / R\n'));
  
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
    validate: (choices) => {
      return choices.length >= 2 || 'Please select at least 2 known values';
    }
  }]);
  
  const inputs = {};
  
  // Get the known values
  for (const known of knowns) {
    let message, unit;
    
    switch (known) {
      case 'voltage':
        message = 'Enter voltage (V):';
        unit = 'volts';
        break;
      case 'current':
        message = 'Enter current (A):';
        unit = 'amps';
        break;
      case 'resistance':
        message = 'Enter resistance (Ω):';
        unit = 'ohms';
        break;
      case 'power':
        message = 'Enter power (W):';
        unit = 'watts';
        break;
    }
    
    const answer = await inquirer.prompt([{
      type: 'input',
      name: 'value',
      message: message,
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 || `Please enter a valid ${unit} value`;
      }
    }]);
    
    inputs[known] = parseFloat(answer.value);
  }
  
  // Calculate missing values
  const results = { ...inputs };
  
  // If we have V and I, calculate R and P
  if (inputs.voltage && inputs.current) {
    if (!inputs.resistance) results.resistance = inputs.voltage / inputs.current;
    if (!inputs.power) results.power = inputs.voltage * inputs.current;
  }
  // If we have V and R, calculate I and P
  else if (inputs.voltage && inputs.resistance) {
    if (!inputs.current) results.current = inputs.voltage / inputs.resistance;
    if (!inputs.power) results.power = (inputs.voltage * inputs.voltage) / inputs.resistance;
  }
  // If we have I and R, calculate V and P
  else if (inputs.current && inputs.resistance) {
    if (!inputs.voltage) results.voltage = inputs.current * inputs.resistance;
    if (!inputs.power) results.power = inputs.current * inputs.current * inputs.resistance;
  }
  // If we have V and P, calculate I and R
  else if (inputs.voltage && inputs.power) {
    if (!inputs.current) results.current = inputs.power / inputs.voltage;
    if (!inputs.resistance) results.resistance = (inputs.voltage * inputs.voltage) / inputs.power;
  }
  // If we have I and P, calculate V and R
  else if (inputs.current && inputs.power) {
    if (!inputs.voltage) results.voltage = inputs.power / inputs.current;
    if (!inputs.resistance) results.resistance = inputs.power / (inputs.current * inputs.current);
  }
  // If we have R and P, calculate V and I
  else if (inputs.resistance && inputs.power) {
    if (!inputs.voltage) results.voltage = Math.sqrt(inputs.power * inputs.resistance);
    if (!inputs.current) results.current = Math.sqrt(inputs.power / inputs.resistance);
  }
  
  // Format results for display
  const displayData = {};
  if (results.voltage) displayData['Voltage (V)'] = `${results.voltage.toFixed(2)}V`;
  if (results.current) displayData['Current (I)'] = `${results.current.toFixed(2)}A`;
  if (results.resistance) displayData['Resistance (R)'] = `${results.resistance.toFixed(2)}Ω`;
  if (results.power) displayData['Power (P)'] = `${results.power.toFixed(2)}W`;
  
  // Add formulas used
  displayData[''] = ''; // Separator
  displayData['Formulas Used'] = 'V=IR, P=VI, P=I²R, P=V²/R';
  
  displayResult('OHM\'S LAW RESULTS', displayData);
  
  return results;
}