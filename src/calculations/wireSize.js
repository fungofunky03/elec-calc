import chalk from 'chalk';
import inquirer from 'inquirer';
import { wireAmpacity, getWireList } from '../data/wireData.js';
import { displayResult, showWarning } from '../ui/display.js';

export async function wireSize() {
  console.log(chalk.bold.cyan('\n📏 WIRE SIZING CALCULATOR\n'));
  
  const inputs = await inquirer.prompt([
    {
      type: 'input',
      name: 'loadCurrent',
      message: 'Load current (amperes):',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 || 'Please enter a valid current value';
      }
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
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 && num <= 1 || 'Please enter a value between 0.1 and 1.0';
      }
    },
    {
      type: 'input',
      name: 'continuous',
      message: 'Continuous load multiplier (1.25 for continuous, 1.0 for non-continuous):',
      default: '1.0',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 1.0 || 'Please enter a value >= 1.0';
      }
    }
  ]);
  
  const loadCurrent = parseFloat(inputs.loadCurrent);
  const deratingFactor = parseFloat(inputs.derate);
  const continuousMultiplier = parseFloat(inputs.continuous);
  
  // Calculate required ampacity
  const adjustedCurrent = loadCurrent * continuousMultiplier;
  const requiredAmpacity = adjustedCurrent / deratingFactor;
  
  // Find minimum wire size
  let recommendedWire = null;
  let selectedAmpacity = null;
  
  for (const wireSize of getWireList()) {
    const ampacity = wireAmpacity[wireSize];
    if (ampacity && ampacity >= requiredAmpacity) {
      recommendedWire = wireSize;
      selectedAmpacity = ampacity;
      break;
    }
  }
  
  const results = {
    'Load Current': `${loadCurrent}A`,
    'Continuous Multiplier': `${continuousMultiplier}x`,
    'Adjusted Current': `${adjustedCurrent.toFixed(1)}A`,
    'Derating Factor': `${deratingFactor}x`,
    'Required Ampacity': `${requiredAmpacity.toFixed(1)}A`,
    'Minimum Wire Size': recommendedWire ? `${recommendedWire} AWG` : 'Exceeds standard sizes',
    'Wire Ampacity': selectedAmpacity ? `${selectedAmpacity}A` : 'N/A',
    'Temperature Rating': `${inputs.tempRating}°C`
  };
  
  displayResult('WIRE SIZING RESULTS', results);
  
  if (!recommendedWire) {
    showWarning('Load current exceeds standard wire ampacities! Consider parallel conductors.');
  } else if (selectedAmpacity < requiredAmpacity * 1.1) {
    showWarning('Wire size is close to minimum - consider next size up for safety margin.');
  }
  
  // Show next size up for comparison
  if (recommendedWire) {
    const currentIndex = getWireList().indexOf(recommendedWire);
    const nextWire = getWireList()[currentIndex + 1];
    if (nextWire) {
      console.log(chalk.gray(`\n💡 Next size up: ${nextWire} AWG (${wireAmpacity[nextWire]}A)`));
    }
  }
  
  return results;
}