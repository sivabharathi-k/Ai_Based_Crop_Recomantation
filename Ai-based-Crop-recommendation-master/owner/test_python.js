const { PythonShell } = require('python-shell');

console.log(PythonShell.run.toString());

PythonShell.run('non_existent.py', {}).then(res => console.log('Promise resolved:', res)).catch(err => console.log('Promise rejected:', err.message));
