import chalk from 'chalk';
import inquirer from 'inquirer';
import { displayResult, showWarning } from '../ui/display.js';

export async function serviceCalc() {
  console.log(chalk.bold.cyan('\n🏠 SERVICE ENTRANCE CALCULATION\n'));
  
  const { calcType } = await inquirer.prompt([{
    type: 'list',
    name: 'calcType',
    message: 'What type of service calculation?',
    choices: [
      { name: 'Residential Load Calculation (NEC 220)', value: 'residential' },
      { name: 'Commercial Demand Calculation', value: 'commercial' },
      { name: 'Service Wire Size', value: 'wire' }
    ]
  }]);
  
  if (calcType === 'residential') {
    await residentialCalc();
  } else if (calcType === 'commercial') {
    await commercialCalc();
  } else {
    await serviceWireCalc();
  }
}

async function residentialCalc() {
  console.log(chalk.yellow('\nResidential Load Calculation per NEC 220.82\n'));
  
  const inputs = await inquirer.prompt([
    {
      type: 'input',
      name: 'sqft',
      message: 'House square footage:',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 || 'Please enter valid square footage';
      }
    },
    {
      type: 'input',
      name: 'smallAppliances',
      message: 'Small appliance circuits (usually 2):',
      default: '2',
      validate: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 0 || 'Please enter a valid number';
      }
    },
    {
      type: 'input',
      name: 'laundry',
      message: 'Laundry circuits (usually 1):',
      default: '1',
      validate: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 0 || 'Please enter a valid number';
      }
    },
    {
      type: 'input',
      name: 'waterHeater',
      message: 'Water heater load (kW):',
      default: '4.5',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 || 'Please enter a valid kW value';
      }
    },
    {
      type: 'input',
      name: 'hvac',
      message: 'HVAC load (kW):',
      default: '3.5',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 || 'Please enter a valid kW value';
      }
    },
    {
      type: 'input',
      name: 'range',
      message: 'Electric range load (kW, 0 if gas):',
      default: '0',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 || 'Please enter a valid kW value';
      }
    },
    {
      type: 'input',
      name: 'dryer',
      message: 'Electric dryer load (kW, 0 if gas):',
      default: '0',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0 || 'Please enter a valid kW value';
      }
    }
  ]);
  
  const sqft = parseFloat(inputs.sqft);
  const smallAppl = parseInt(inputs.smallAppliances);
  const laundry = parseInt(inputs.laundry);
  const waterHeater = parseFloat(inputs.waterHeater);
  const hvac = parseFloat(inputs.hvac);
  const range = parseFloat(inputs.range);
  const dryer = parseFloat(inputs.dryer);
  
  // Standard Method Calculation
  let generalLighting = sqft * 3; // 3 VA per sq ft
  let smallApplianceLoad = smallAppl * 1500; // 1500 VA per circuit
  let laundryLoad = laundry * 1500; // 1500 VA per circuit
  
  // First 10 kVA at 100%, remainder at 40%
  let totalVA = generalLighting + smallApplianceLoad + laundryLoad;
  let demandVA = totalVA > 10000 ? 10000 + (totalVA - 10000) * 0.4 : totalVA;
  
  // Add fixed appliances
  demandVA += waterHeater * 1000; // Convert kW to VA
  demandVA += hvac * 1000;
  
  // Range demand (use demand table - simplified)
  if (range > 0) {
    let rangeDemand;
    if (range <= 12) rangeDemand = 8000;
    else if (range <= 27) rangeDemand = range * 1000 * 0.8;
    else rangeDemand = range * 1000 * 0.8;
    demandVA += rangeDemand;
  }
  
  // Dryer (5000 VA minimum or nameplate, whichever is larger)
  if (dryer > 0) {
    demandVA += Math.max(5000, dryer * 1000);
  }
  
  // Calculate service size
  const demandAmps = demandVA / 240; // Assuming 240V service
  let serviceSize;
  
  if (demandAmps <= 100) serviceSize = '100A';
  else if (demandAmps <= 150) serviceSize = '150A';
  else if (demandAmps <= 200) serviceSize = '200A';
  else serviceSize = '400A';
  
  const results = {
    'General Lighting': `${generalLighting.toFixed(0)} VA`,
    'Small Appliance Circuits': `${smallApplianceLoad} VA`,
    'Laundry Circuit': `${laundryLoad} VA`,
    'After Demand Factor': `${demandVA.toFixed(0)} VA`,
    'Water Heater': `${(waterHeater * 1000).toFixed(0)} VA`,
    'HVAC': `${(hvac * 1000).toFixed(0)} VA`,
    'Range Demand': range > 0 ? `${(Math.min(8000, range * 800)).toFixed(0)} VA` : '0 VA',
    'Dryer Demand': dryer > 0 ? `${Math.max(5000, dryer * 1000).toFixed(0)} VA` : '0 VA',
    '': '', // Separator
    'Total Demand': `${demandVA.toFixed(0)} VA`,
    'Demand Current': `${demandAmps.toFixed(1)} A`,
    'Recommended Service': serviceSize
  };
  
  displayResult('RESIDENTIAL SERVICE CALCULATION', results);
  
  if (demandAmps > 200) {
    showWarning('Large electrical load - verify with utility for service availability');
  }
}

async function commercialCalc() {
  console.log(chalk.yellow('\nBasic Commercial Demand Calculation\n'));
  
  const inputs = await inquirer.prompt([
    {
      type: 'input',
      name: 'connectedLoad',
      message: 'Total connected load (kW):',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 || 'Please enter valid connected load';
      }
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
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 && num <= 1 || 'Enter value between 0 and 1';
      }
    }
  ]);
  
  const connectedLoad = parseFloat(inputs.connectedLoad);
  const demandFactor = inputs.demandFactor === 'custom' ? parseFloat(inputs.customDF) : inputs.demandFactor;
  
  const demandLoad = connectedLoad * demandFactor;
  const demandAmps = (demandLoad * 1000) / (480 * Math.sqrt(3)); // 480V 3-phase
  
  const results = {
    'Connected Load': `${connectedLoad.toFixed(1)} kW`,
    'Demand Factor': `${(demandFactor * 100).toFixed(0)}%`,
    'Demand Load': `${demandLoad.toFixed(1)} kW`,
    'Demand Current (480V 3φ)': `${demandAmps.toFixed(1)} A`
  };
  
  displayResult('COMMERCIAL DEMAND CALCULATION', results);
}

async function serviceWireCalc() {
  console.log(chalk.yellow('\nService Entrance Wire Sizing\n'));
  
  const inputs = await inquirer.prompt([
    {
      type: 'input',
      name: 'serviceAmps',
      message: 'Service amperage rating:',
      validate: (value) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0 || 'Please enter valid amperage';
      }
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
  
  const amps = parseFloat(inputs.serviceAmps);
  
  // Simplified wire sizing based on 75°C rating
  let wireSize;
  if (amps <= 100) wireSize = '2 AWG';
  else if (amps <= 125) wireSize = '1 AWG';
  else if (amps <= 150) wireSize = '1/0 AWG';
  else if (amps <= 175) wireSize = '2/0 AWG';
  else if (amps <= 200) wireSize = '3/0 AWG';
  else if (amps <= 225) wireSize = '4/0 AWG';
  else if (amps <= 250) wireSize = '250 kcmil';
  else if (amps <= 300) wireSize = '350 kcmil';
  else wireSize = 'Requires parallel conductors';
  
  const results = {
    'Service Rating': `${amps} A`,
    'Service Type': inputs.serviceType,
    'Minimum Wire Size': wireSize,
    'Note': '75°C rating, verify with local codes'
  };
  
  displayResult('SERVICE WIRE SIZING', results);
}