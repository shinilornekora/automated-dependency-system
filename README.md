# Automated Dependency System (ADS)

This is the package for automatic dependency control, implemented in Domain-Driven-Design style. 
- It scans your dependencies for CVEs each time it is being build
- It removes unused dependencies of the project
- It resolves conflicts automatically so you don't need to analyze peers anymore
- And more. :)



### Installation:

```bash
npm install -g automated-dependency-system
```

---

### Usage

Run `ads` in command line after the installation, follow the instructions.

---

### Configuration:
You can exclude some dependencies from the control of ADS for some reason.

Create .melignore file at the root of your project, and write one dependency per line that needed to be excluded:

```bash
vue
lodash
date-fns
```

Note that dependency name should be exactly as in package.json file - each added dep will be invisible for ADS.

- You can set the maintainer of the package to divide command permission execution.
  - Instead of calling npm directly, use the ADS CLI to trigger ADS checks automatically.
  - Set the maintainer (for adding/removing dependencies) by setting an environment variable, for example:
    ```bash
    # *nix
    export USER=your_username
    
    # Windows
    $env:USER=your_username
    ```
  - And there we go with UP / SP / FP functionality.
---

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
    // Proceed with your ads commands…
})();
```

