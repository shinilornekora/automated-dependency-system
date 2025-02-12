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
export ADS_MAINTAINER=your_username
```
Instead of calling npm directly, use the ADS CLI to trigger ADS checks automatically:

```bash
ads check                 # Run all ADS checks (CVE scanning, cleaning, locking)
ads install               # Run npm install (only from package.json)
ads build                 # Run npm build (via "npm run build")
ads clean-install         # Run npm ci
ads add foo 1.2.3         # Add a new dependency (if you’re the maintainer)
ads remove foo            # Remove a dependency (if you’re the maintainer)
ads allowed-versions foo  # List the three most recent versions available for "foo"
```

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

