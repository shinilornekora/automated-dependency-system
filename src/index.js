const FileSystemService = require('./infrastructure/FileSystemService');
const DependencyRepository = require('./infrastructure/DependencyRepository');
const CVEScanner = require('./infrastructure/CVEScanner');
const NpmService = require('./infrastructure/NpmService');
const DependencyManager = require('./domain/DependencyManager');
const DependencyResolver = require('./domain/DependencyResolver');
const DependencyService = require('./application/DependencyService');

function createADS(currentUser) {
    const fsService = new FileSystemService();
    const melIgnoreList = fsService.readMelIgnore();
    const dependencyRepository = new DependencyRepository();
    const cveScanner = new CVEScanner();
    const npmService = new NpmService();
    const dependencyResolver = new DependencyResolver();
    const dependencyManager = new DependencyManager({
        dependencyRepository,
        dependencyResolver,
        cveScanner,
        currentUser,
        melIgnoreList
    });
    const dependencyService = new DependencyService({
        dependencyManager,
        npmService
    });
    return {
        dependencyRepository,
        dependencyManager,
        dependencyService,
        fsService
    };
}

module.exports = createADS;
