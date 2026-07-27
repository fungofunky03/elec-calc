import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { getConduitSizes, getConduitTypes, getConduitWireSizes, getSupportedConduitWireSizes } from '../data/conduitData.js';
import { calculateConduitFillCheck, calculateConduitSize, getConduitFillTable } from '../lib/calculators.js';
import { validateNumericInput } from '../lib/validation.js';
import { displayResult, showError, showWarning } from '../ui/display.js';

export async function conduitFill(options = {}) {
  console.log(chalk.bold.cyan('\n🔧 CONDUIT FILL CALCULATION\n'));

  if (options.mode) {
    if (options.mode === 'table') {
      await showConduitTable(options);
      return;
    }

    if (options.mode === 'check') {
      await checkConduitFill(options);
      return;
    }

    await sizeConduit(options);
    return;
  }

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

  if (mode === 'table') await showConduitTable();
  else if (mode === 'check') await checkConduitFill();
  else await sizeConduit();
}

async function checkConduitFill(prefilledInputs = null) {
  const conduitTypes = getConduitTypes();
  const inputs = prefilledInputs || await inquirer.prompt([
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
      choices: (answers) => getConduitSizes(answers.conduitType)
    },
    {
      type: 'list',
      name: 'wireSize',
      message: 'Wire size:',
      choices: (answers) => getSupportedConduitWireSizes(answers.conduitType)
        .map(size => ({ name: `${size} AWG`, value: size }))
    },
    {
      type: 'input',
      name: 'wireCount',
      message: 'Number of conductors:',
      validate: (value) => validateNumericInput(value, { name: 'Number of conductors', min: 1, integer: true })
    }
  ]);

  try {
    const result = calculateConduitFillCheck(inputs);
    const results = {
      'Conduit': `${result.conduitSize}" ${result.conduitType}`,
      'Wire Size': `${result.wireSize} AWG`,
      'Conductors': result.conductors.toString(),
      'Maximum Fill': result.maxFill.toString(),
      'Fill Percentage': `${result.fillPercent.toFixed(1)}%`,
      'Status': result.acceptable ? '✅ ACCEPTABLE' : '❌ OVERFILLED'
    };

    displayResult('CONDUIT FILL CHECK', results);

    if (!result.acceptable) {
      showWarning(`Exceeds bundled conduit fill limits! Maximum ${result.maxFill} conductors allowed.`);
    }

    return result;
  } catch (error) {
    showError(error.message);
    return null;
  }
}

async function sizeConduit(prefilledInputs = null) {
  const conduitTypes = getConduitTypes();
  const inputs = prefilledInputs || await inquirer.prompt([
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
      choices: (answers) => getSupportedConduitWireSizes(answers.conduitType)
        .map(size => ({ name: `${size} AWG`, value: size }))
    },
    {
      type: 'input',
      name: 'wireCount',
      message: 'Number of conductors:',
      validate: (value) => validateNumericInput(value, { name: 'Number of conductors', min: 1, integer: true })
    }
  ]);

  try {
    const result = calculateConduitSize(inputs);
    const results = {
      'Wire Size': `${result.wireSize} AWG`,
      'Conductors': result.conductors.toString(),
      'Conduit Type': result.conduitType,
      'Minimum Size': `${result.minimumSize}"`
    };

    displayResult('CONDUIT SIZING', results);
    return result;
  } catch (error) {
    showError(error.message);
    return null;
  }
}

async function showConduitTable(prefilledInputs = null) {
  const conduitTypes = getConduitTypes();
  const inputs = prefilledInputs || await inquirer.prompt([
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
      choices: (answers) => getSupportedConduitWireSizes(answers.conduitType)
        .map(size => ({ name: `${size} AWG`, value: size }))
    }
  ]);

  try {
    const rows = getConduitFillTable(inputs);
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

    rows.forEach((row) => {
      table.push([
        `${row.size}"`,
        row.maxConductors.toString(),
        row.area.toFixed(3)
      ]);
    });

    console.log(`\n${chalk.bold.yellow(`${inputs.wireSize} AWG in ${inputs.conduitType} Conduit`)}`);
    console.log(table.toString());
    return rows;
  } catch (error) {
    showError(error.message);
    return null;
  }
}