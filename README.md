# Automated Dependency System (ADS)

This package implements an automated dependency system (ADS) built with Domain‑Driven Design. 

It scans for CVEs, enforces version locking, blocks unauthorized dependency changes, and more.

# How to Use the ADS Package

### Installation:

```bash
npm install -g automated-dependency-system
```

### Configuration:
- To override ADS behavior for local package development, create a .melignore file in your project root (one project name per line).
- Set the maintainer (for adding/removing dependencies) by setting an environment variable, for example:

```bash
# *nix
export USER=your_username

# Windows
$env:USER=your_username
```
Instead of calling npm directly, use the ADS CLI to trigger ADS checks automatically:

### Common ADS check:
- CVE scanning
- Cleaning unused dependencies
- Locking all current dependencies in ADS file

### All ADS CLI commands

```bash
ads init                  # [UP] Initialize ADS with local package.json

ads resolve               # [UP] Solve dependencies conflict of current package

ads check                 # [UP] Run all ADS checks (CVE scanning, cleaning, locking)

ads install               # [SP] Run npm install with ADS check 
                          # [CONDITION] if not-maintainer, then block adding operations

ads build                 # [UP] Run npm build with ADS check

ads clean-install         # [UP] Run npm ci

ads add foo 1.2.3         # [FP] Add a new dependency to ads file
                          # [CONDITION]  if not-maintainer, then block
                          
ads remove foo            # [FP] Remove a dependency from ads file
                          # [CONDITION]  if not-maintainer, then block
                          
ads allowed-versions foo  # [UP] List the three most recent versions available for "foo"
```

Acronyms
- UP = unprotected - any developer can execute it
- SP = semi-protected - 
- FP = fully-protected

### Integration:
You can also import and use ADS programmatically in your own build scripts:

```js
const createADS = require('automated-dependency-system');
const { dependencyService } = createADS(process.env.ADS_MAINTAINER || 'defaultMaintainer');

(async () => {
    await dependencyService.runADSChecks();
    // Proceed with your npm commands…
})();
```

