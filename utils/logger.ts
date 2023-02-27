import chalk from 'chalk';

const Logger = {
  info: (message: any) => {
    console.log(chalk.blue(message));
  },
  success: (message: string) => {
    console.log(chalk.green(message));
  },
  error: (message: string) => {
    console.log(chalk.red(message));
  },
  table: (object: any) => {
    console.table(object);
  }
};

export default Logger;
