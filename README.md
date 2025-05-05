# Automated Dependency System (ADS)

This package implements an automated dependency system (ADS) built with Domain‑Driven Design. 

It scans for CVEs, enforces version locking, blocks unauthorized dependency changes, and more.

# How to Use the ADS Package

### Installation:

```bash
npm install -g automated-dependency-system
```

### Usage

Run `ads` in command line after the installation, follow the instructions.

### Configuration:
- To override ADS behavior for local package development, create a .melignore file in your project root (one project name per line).
- Set the maintainer (for adding/removing dependencies) by setting an environment variable, for example:

```bash
# *nix
export USER=your_username

# Windows
$env:USER=your_username
```
Instead of calling npm directly, use the ADS CLI to trigger ADS checks automatically.

Acronyms
- UP = unprotected - any developer can execute it
- SP = semi-protected - function has common and protected scripts
- FP = fully-protected - only maintainer can execute

### Integration:
You can also import and use ADS programmatically in your own build scripts:

```js
const createADS = require('automated-dependency-system');
const { dependencyService } = createADS(process.env.ADS_MAINTAINER);

(async () => {
    await dependencyService.runADSChecks();
    // Proceed with your npm commands…
})();
```

