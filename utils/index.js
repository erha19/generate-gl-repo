
const child_process = require('child_process');


const utils = {
  exec: async (command, quiet) =>{
    await exec(command, quiet)
  }
}
const exec = (command, quiet) => {
  return new Promise((resolve, reject) => {
    try {
      const child = child_process.exec(command, { encoding: 'utf8', wraning: false}, function () {
        resolve();
      });
      if (!quiet) {
        child.stdout.pipe(process.stdout);
      }
      child.stderr.pipe(process.stderr);
    }
    catch (e) {
      console.error('execute command failed :', command);
      reject(e);
    }
  });
}
module.exports = utils;