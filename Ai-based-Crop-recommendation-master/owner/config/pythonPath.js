const { execFileSync } = require('child_process');
const fs = require('fs');

/**
 * Resolve the Python 3 executable.
 * Priority:
 *   1. PYTHON_PATH env var (set by setup.bat to the venv python.exe)
 *   2. Auto-detect: py / python3 / python
 *
 * Uses execFileSync (not execSync) so paths with spaces work without quoting.
 */
let _cached = null;

function getPythonPath() {
  if (_cached) return _cached;

  // 1. Explicit env override (set by setup.bat)
  const envPath = process.env.PYTHON_PATH;
  if (envPath) {
    const clean = envPath.replace(/^["']|["']$/g, ''); // strip surrounding quotes
    if (fs.existsSync(clean)) {
      _cached = clean;
      console.log(`[Python] Using PYTHON_PATH → ${_cached}`);
      return _cached;
    }
    console.warn(`[Python] PYTHON_PATH set but not found: ${clean}`);
  }

  // 2. Auto-detect
  const candidates = ['py', 'python3', 'python'];
  for (const cmd of candidates) {
    try {
      const out = execFileSync(cmd, ['--version'], {
        timeout: 4000,
        stdio: 'pipe',
      }).toString().trim();

      if (/^Python 3/i.test(out)) {
        _cached = cmd;
        console.log(`[Python] Auto-detected '${cmd}' → ${out}`);
        return _cached;
      }
    } catch (_) {
      // not found or not Python 3 — try next
    }
  }

  console.warn('[Python] Could not detect Python 3. Falling back to "python". ' +
    'Run setup.bat or set PYTHON_PATH in owner/.env');
  _cached = 'python';
  return _cached;
}

module.exports = { getPythonPath };
