#!/usr/bin/env node

import { voltageDrop } from './src/calculations/voltageDrop.js';
import { showBanner } from './src/ui/display.js';
import chalk from 'chalk';

console.clear();
showBanner();

console.log(chalk.bold.cyan('🎯 Quick Demo - Voltage Drop Calculation\n'));

// Demo calculation: 20A load, 100ft run, 120V, 12 AWG wire
const result = await voltageDrop(20, 100, 120, '12');

console.log(chalk.green('\n✨ Try the interactive mode: elec'));
console.log(chalk.green('📚 Or use direct commands: elec voltage-drop --help'));