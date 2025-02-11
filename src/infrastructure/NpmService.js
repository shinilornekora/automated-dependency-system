const { spawn } = require('child_process');

class NpmService {
    run(command, args = []) {
        // Block install-changing operations: if extra arguments are provided with "install" then exit.
        if (command === 'install' && args.length > 0) {
            console.error("Install-changing operations are blocked by ADS.");
            process.exit(1);
        }
        
        const npm = process.platform === "win32" ? "npm.cmd" : "npm";
        const child = spawn(npm, [command, ...args], { stdio: 'inherit' });

        child.on('close', (code) => {
            process.exit(code);
        });
    }
}

module.exports = NpmService;
