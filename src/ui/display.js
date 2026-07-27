import chalk from 'chalk';
import boxen from 'boxen';
import inquirer from 'inquirer';

export function showBanner() {
  const banner = `
⚡ ${chalk.bold.yellow('ELEC-CALC')} ⚡
${chalk.cyan('Professional Electrical Calculations')}
${chalk.gray('Built for electricians, by electricians')}
`;

  console.log(boxen(banner, {
    padding: 1,
    margin: 1,
    borderStyle: 'double',
    borderColor: 'yellow',
    backgroundColor: 'black'
  }));
}

export async function showMenu() {
  return await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: chalk.bold('What calculation do you need?'),
    choices: [
      {
        name: `${chalk.red('⚡')} Voltage Drop Calculation`,
        value: 'voltage-drop'
      },
      {
        name: `${chalk.blue('🔧')} Conduit Fill & Sizing`,
        value: 'conduit-fill'
      },
      {
        name: `${chalk.green('🏠')} Service Entrance Calc`,
        value: 'service'
      },
      {
        name: `${chalk.magenta('⚙️')} Ohm\'s Law (V=IR, P=VI)`,
        value: 'ohms-law'
      },
      {
        name: `${chalk.cyan('📏')} Wire Sizing`,
        value: 'wire-size'
      },
      new inquirer.Separator(),
      {
        name: `${chalk.gray('❌')} Exit`,
        value: 'exit'
      }
    ]
  }]);
}

export function displayResult(title, data, unit = '') {
  const result = Object.entries(data)
    .map(([key, value]) => `${chalk.cyan(key)}: ${chalk.bold.white(value)}${unit}`)
    .join('\n');
    
  console.log(boxen(result, {
    title: chalk.bold.yellow(title),
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: 'cyan'
  }));
}

export function displayTable(title, headers, rows) {
  import('cli-table3').then(Table => {
    const table = new Table.default({
      head: headers.map(h => chalk.bold.cyan(h)),
      style: {
        head: [],
        border: ['cyan']
      }
    });
    
    rows.forEach(row => table.push(row));
    
    console.log(`\n${chalk.bold.yellow(title)}`);
    console.log(table.toString());
  });
}

export function showWarning(message) {
  console.log(boxen(chalk.yellow(`⚠️  ${message}`), {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: 'yellow'
  }));
}

export function showError(message) {
  console.log(boxen(chalk.red(`❌ ${message}`), {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 1, bottom: 1 },
    borderStyle: 'round',
    borderColor: 'red'
  }));
}