import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { conduitFill as conduitData, conduitTypes, conduitSizes, getConduitFill } from '../data/conduitData.js';
import { wireArea, getWireList } from '../data/wireData.js';
import { displayResult, showWarning } from '../ui/display.js';

export async function conduitFill() {
  console.log(chalk.bold.cyan('\n🔧 CONDUIT FILL CALCULATION\n'));
  
  const { mode } = await inquirer.prompt([{
    type: 'list',
    name: 'mode',
    message: 'What do you want to calculate?',
    choices: [
      { name: 'Check fill for specific conduit and wires', value: 'check' },
      { name: 'Size conduit for given wires', value: 'size' },
      { name: 'View conduit fill table', value: 'table' }
    ]
  }]);
  
  if (mode === 'table') {
    await showConduitTable();
    return;
  }
  
  if (mode === 'check') {
    await checkConduitFill();
  } else {
    await sizeConduit();
  }
}

async function checkConduitFill() {
  const inputs = await inquirer.prompt([
    {
      type: 'list',
      name: 'conduitType',
      message: 'Conduit type:',
      choices: conduitTypes
    },
    {
      type: 'list',
      name: 'conduitSize',
      message: 'Conduit size:',
      choices: conduitSizes
    },
    {
      type: 'list',
      name: 'wireSize',
      message: 'Wire size:',
      choices: getWireList().map(size => ({ name: `${size} AWG`, value: size }))
    },
    {
      type: 'input',
      name: 'wireCount',
      message: 'Number of conductors:',
      validate: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0 || 'Please enter a valid number';
      }
    }
  ]);
  
  const maxFill = getConduitFill(inputs.conduitType, inputs.conduitSize, inputs.wireSize);
  const wireCount = parseInt(inputs.wireCount);
  const fillPercent = maxFill > 0 ? (wireCount / maxFill * 100) : 999;
  
  const results = {
    'Conduit': `${inputs.conduitSize}" ${inputs.conduitType}`,
    'Wire Size': `${inputs.wireSize} AWG`,
    'Conductors': wireCount.toString(),
    'Maximum Fill': maxFill.toString(),
    'Fill Percentage': `${fillPercent.toFixed(1)}%`,
    'Status': fillPercent <= 100 ? '✅ ACCEPTABLE' : '❌ OVERFILLED'
  };
  
  displayResult('CONDUIT FILL CHECK', results);
  
  if (fillPercent > 100) {
    showWarning(`Exceeds NEC fill limits! Maximum ${maxFill} conductors allowed.`);
  }
}

async function sizeConduit() {
  const inputs = await inquirer.prompt([
    {
      type: 'list',
      name: 'conduitType',
      message: 'Conduit type:',
      choices: conduitTypes
    },
    {
      type: 'list',
      name: 'wireSize',
      message: 'Wire size:',
      choices: getWireList().map(size => ({ name: `${size} AWG`, value: size }))
    },
    {
      type: 'input',
      name: 'wireCount',
      message: 'Number of conductors:',
      validate: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num > 0 || 'Please enter a valid number';
      }
    }
  ]);
  
  const wireCount = parseInt(inputs.wireCount);
  let recommendedSize = null;
  
  for (const size of conduitSizes) {
    const maxFill = getConduitFill(inputs.conduitType, size, inputs.wireSize);
    if (maxFill >= wireCount) {
      recommendedSize = size;
      break;
    }
  }
  
  const results = {
    'Wire Size': `${inputs.wireSize} AWG`,
    'Conductors': wireCount.toString(),
    'Conduit Type': inputs.conduitType,
    'Minimum Size': recommendedSize ? `${recommendedSize}"` : 'Not possible with standard sizes'
  };
  
  displayResult('CONDUIT SIZING', results);
  
  if (!recommendedSize) {
    showWarning('Wire count exceeds largest standard conduit size!');
  }
}

async function showConduitTable() {
  const { conduitType, wireSize } = await inquirer.prompt([
    {
      type: 'list',
      name: 'conduitType',
      message: 'Conduit type:',
      choices: conduitTypes
    },
    {
      type: 'list',
      name: 'wireSize',
      message: 'Wire size:',
      choices: getWireList().map(size => ({ name: `${size} AWG`, value: size }))
    }
  ]);
  
  const table = new Table({
    head: [
      chalk.bold.cyan('Size'),
      chalk.bold.cyan('Max Conductors'),
      chalk.bold.cyan('Area (sq in)')
    ],
    style: {
      head: [],
      border: ['cyan']
    }
  });
  
  conduitSizes.forEach(size => {
    const maxFill = getConduitFill(conduitType, size, wireSize);
    const area = conduitData[conduitType]?.[size]?.area || 0;
    
    if (maxFill > 0) {
      table.push([
        `${size}"`,
        maxFill.toString(),
        area.toFixed(3)
      ]);
    }
  });
  
  console.log(`\n${chalk.bold.yellow(`${wireSize} AWG in ${conduitType} Conduit`)}`);
  console.log(table.toString());
}