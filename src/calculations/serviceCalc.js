import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  calculateCommercialDemand,
  calculateResidentialService,
  calculateServiceWireSize
} from '../lib/calculators.js';
import { validateNumericInput } from '../lib/validation.js';
import { displayResult, showError, showWarning } from '../ui/display.js';

export async function serviceCalc(options = {}) {
  console.log(chalk.bold.cyan('\n🏠 SERVICE ENTRANCE CALCULATION\n'));

  if (options.mode === 'residential') {
    return residentialCalc(options);
  }

  if (options.mode === 'commercial') {
    return commercialCalc(options);
  }

  if (options.mode === 'wire') {
    return serviceWireCalc(options);
  }

  const { calcType } = await inquirer.prompt([{
    type: 'list',
    name: 'calcType',
    message: 'What type of service calculation?',
    choices: [
      { name: 'Residential load estimate (simplified NEC-inspired)', value: 'residential' },
      { name: 'Commercial demand estimate', value: 'commercial' },
      { name: 'Service wire size', value: 'wire' }
    ]
  }]);

  if (calcType === 'residential') return residentialCalc();
  if (calcType === 'commercial') return commercialCalc();
  return serviceWireCalc();
}

async function residentialCalc(prefilledInputs = null) {
  console.log(chalk.yellow('\nResidential Load Estimate (simplified NEC-inspired reference)\n'));

  const inputs = prefilledInputs || await inquirer.prompt([
    {
      type: 'input',
      name: 'sqft',
      message: 'House square footage:',
      validate: (value) => validateNumericInput(value, { name: 'House square footage', min: 1 })
    },
    {
      type: 'input',
      name: 'smallAppliances',
      message: 'Small appliance circuits (usually 2):',
      default: '2',
      validate: (value) => validateNumericInput(value, { name: 'Small appliance circuits', min: 0, integer: true })
    },
    {
      type: 'input',
      name: 'laundry',
      message: 'Laundry circuits (usually 1):',
      default: '1',
      validate: (value) => validateNumericInput(value, { name: 'Laundry circuits', min: 0, integer: true })
    },
    {
      type: 'input',
      name: 'waterHeater',
      message: 'Water heater load (kW):',
      default: '4.5',
      validate: (value) => validateNumericInput(value, { name: 'Water heater load', min: 0 })
    },
    {
      type: 'input',
      name: 'hvac',
      message: 'HVAC load (kW):',
      default: '3.5',
      validate: (value) => validateNumericInput(value, { name: 'HVAC load', min: 0 })
    },
    {
      type: 'input',
      name: 'range',
      message: 'Electric range load (kW, 0 if gas):',
      default: '0',
      validate: (value) => validateNumericInput(value, { name: 'Electric range load', min: 0 })
    },
    {
      type: 'input',
      name: 'dryer',
      message: 'Electric dryer load (kW, 0 if gas):',
      default: '0',
      validate: (value) => validateNumericInput(value, { name: 'Electric dryer load', min: 0 })
    }
  ]);

  try {
    const result = calculateResidentialService(inputs);
    const results = {
      'General Lighting': `${result.generalLighting.toFixed(0)} VA`,
      'Small Appliance Circuits': `${result.smallApplianceLoad.toFixed(0)} VA`,
      'Laundry Circuit': `${result.laundryLoad.toFixed(0)} VA`,
      'Dwelling Load Before Demand': `${result.dwellingBaseLoad.toFixed(0)} VA`,
      'Dwelling Load After Demand': `${result.dwellingDemandLoad.toFixed(0)} VA`,
      'Water Heater': `${result.waterHeaterVa.toFixed(0)} VA`,
      'HVAC': `${result.hvacVa.toFixed(0)} VA`,
      'Range Demand': `${result.rangeDemandVa.toFixed(0)} VA`,
      'Dryer Demand': `${result.dryerDemandVa.toFixed(0)} VA`,
      'Total Demand': `${result.totalDemandVa.toFixed(0)} VA`,
      'Demand Current': `${result.demandAmps.toFixed(1)} A`,
      'Recommended Service': result.serviceSize
    };

    displayResult('RESIDENTIAL SERVICE ESTIMATE', results);
    result.warnings.forEach(showWarning);
    return result;
  } catch (error) {
    showError(error.message);
    return null;
  }
}

async function commercialCalc(prefilledInputs = null) {
  console.log(chalk.yellow('\nBasic Commercial Demand Estimate\n'));

  const inputs = prefilledInputs || await inquirer.prompt([
    {
      type: 'input',
      name: 'connectedLoad',
      message: 'Total connected load (kW):',
      validate: (value) => validateNumericInput(value, { name: 'Connected load', min: 0.000001 })
    },
    {
      type: 'list',
      name: 'demandFactor',
      message: 'Demand factor:',
      choices: [
        { name: '50% - Office/retail', value: 0.5 },
        { name: '65% - Restaurant', value: 0.65 },
        { name: '75% - Industrial', value: 0.75 },
        { name: '80% - Hospital', value: 0.8 },
        { name: 'Custom', value: 'custom' }
      ]
    },
    {
      type: 'input',
      name: 'customDF',
      message: 'Enter custom demand factor (0-1):',
      when: (answers) => answers.demandFactor === 'custom',
      validate: (value) => validateNumericInput(value, { name: 'Demand factor', min: 0.000001, max: 1 })
    }
  ]);

  try {
    const result = calculateCommercialDemand({
      connectedLoad: inputs.connectedLoad,
      demandFactor: inputs.demandFactor === 'custom' ? inputs.customDF : inputs.demandFactor
    });

    const results = {
      'Connected Load': `${result.connectedLoadKw.toFixed(1)} kW`,
      'Demand Factor': `${(result.demandFactor * 100).toFixed(0)}%`,
      'Demand Load': `${result.demandLoadKw.toFixed(1)} kW`,
      'Demand Current (480V 3φ)': `${result.demandAmps.toFixed(1)} A`
    };

    displayResult('COMMERCIAL DEMAND ESTIMATE', results);
    return result;
  } catch (error) {
    showError(error.message);
    return null;
  }
}

async function serviceWireCalc(prefilledInputs = null) {
  console.log(chalk.yellow('\nService Entrance Wire Sizing\n'));

  const inputs = prefilledInputs || await inquirer.prompt([
    {
      type: 'input',
      name: 'serviceAmps',
      message: 'Service amperage rating:',
      validate: (value) => validateNumericInput(value, { name: 'Service amperage rating', min: 0.000001 })
    },
    {
      type: 'list',
      name: 'serviceType',
      message: 'Service type:',
      choices: [
        { name: '120/240V Single Phase', value: 'single' },
        { name: '208Y/120V Three Phase', value: '208' },
        { name: '480Y/277V Three Phase', value: '480' }
      ]
    }
  ]);

  try {
    const result = calculateServiceWireSize(inputs);
    const results = {
      'Service Rating': `${result.serviceAmps} A`,
      'Service Type': result.serviceType,
      'Minimum Wire Size': result.minimumWireSize,
      'Note': '75°C reference, verify local code requirements'
    };

    displayResult('SERVICE WIRE SIZING', results);
    return result;
  } catch (error) {
    showError(error.message);
    return null;
  }
}