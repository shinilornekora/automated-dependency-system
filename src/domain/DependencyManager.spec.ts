import { DependencyManager } from './DependencyManager.js';
import { FileSystemAPI } from '../infrastructure/FileSystemAPI.js';
import { DependencyRepository } from '../infrastructure/DependencyRepository.js';
import { DependencyResolver } from './DependencyResolver.js';
import { CVEScanner } from '../infrastructure/CVEScanner.js';
import { NpmService } from '../infrastructure/NpmService.js';
import { User } from './User.js';
import { Dependency } from './Dependency.js';

describe('DependencyManager', () => {
    const mockDependencyRepository = {
        get: jest.fn(),
        getAll: jest.fn(),
        add: jest.fn(),
        remove: jest.fn()
    };

    const mockDependencyResolver = {
        suggestBestVersions: jest.fn().mockResolvedValue({ recommended: {}, conflicts: {} }),
        fetchMeta: jest.fn().mockResolvedValue({}),
        gatherAllConstraints: jest.fn().mockResolvedValue({})
    };

    const mockCVEScanner = {
        scan: jest.fn()
    };

    const mockNpmService = {
        getAllowedSemverVersions: jest.fn().mockResolvedValue(['1.4.0', '1.3.0', '1.2.0']),
        run: jest.fn()
    };

    const mockUser = {
        getName: jest.fn().mockReturnValue('MaintainerName'),
        isPackageMaintainer: false, 
        name: 'test', 
        checkIfCurrentPackageMaintainsByUser: jest.fn().mockReturnValue(false)
    };

    let dependencyManager: DependencyManager;

    beforeEach(() => {
        dependencyManager = new DependencyManager({
            dependencyRepository: mockDependencyRepository as unknown as DependencyRepository,
            dependencyResolver: mockDependencyResolver as unknown as DependencyResolver,
            cveScanner: mockCVEScanner as unknown as CVEScanner,
            currentUser: mockUser as unknown as User,
            npmService: mockNpmService as unknown as NpmService,
            melIgnoreList: []
        });
    });

    describe('addDependency', () => {
        it('should add a dependency when not already present', () => {
            const dep = new Dependency({
                name: 'test',
                version: '1.0.0',
                maintainer: 'Maintainer',
                readOnly: false,
                isLocal: false
            });

            mockDependencyRepository.get.mockReturnValue(null);

            const resultDep = dependencyManager.addDependency(dep);

            expect(mockDependencyRepository.add).toHaveBeenCalledWith(dep);
            expect(mockDependencyRepository.get).toHaveBeenCalledWith(dep.getName);
        });
    });

    describe('removeDependency', () => {
        it('should remove a dependency when it exists', async () => {
            const mockDependency = new Dependency({
                name: 'test',
                version: '1.0.0',
                maintainer: 'Maintainer',
                readOnly: false,
                isLocal: false
            });

            mockDependencyRepository.get.mockReturnValue(mockDependency);

            dependencyManager.removeDependency('test');

            expect(mockDependencyRepository.remove).toHaveBeenCalledWith('test');
        });

        it('should throw an error when dependency does not exist', () => {
            const error = 'Dependency test not found.';
            mockDependencyRepository.get.mockReturnValue(null);
            expect(() => dependencyManager.removeDependency('test')).toThrow(error);
        });
    });

    describe('getSecureVersion', () => {
        it('should return a secure version by reducing the minor version', () => {
            const result = dependencyManager.getSecureVersion('2.4.5');
            expect(result).toBe('2.3.5');
        });

        it('should return original version if minor is 0', () => {
            const result = dependencyManager.getSecureVersion('2.0.0');
            expect(result).toBe('2.0.0');
        });

        it('should return original version if format is invalid', () => {
            const result = dependencyManager.getSecureVersion('invalid');
            expect(result).toBe('invalid');
        });

        it('should handle version with incomplete length', () => {
            const result = dependencyManager.getSecureVersion('1.2');
            expect(result).toBe('1.1.0');
        });
    });

    describe('checkAndResolveCVEs', () => {
        const testCVE = {
            severity: 'high',
            fixedVersion: '1.2.0'
        };

        it('should not update read-only dependency with high severity', async () => {
            const mockDependency = new Dependency({
                name: 'vulnerable-dep',
                version: '1.4.0',
                maintainer: 'Maintainer',
                readOnly: true,
                isLocal: false
            });

            mockDependencyRepository.getAll.mockReturnValue([mockDependency]);

            mockCVEScanner.scan.mockResolvedValue(testCVE as any);

            await dependencyManager.checkAndResolveCVEs();

            expect(mockDependency.getVersion).toBe('1.4.0');
        });

        it('should log error if scanning fails', async () => {
            const mockDependency = new Dependency({
                name: 'unscannable-dep',
                version: '1.0.0',
                maintainer: 'Maintainer',
                readOnly: false,
                isLocal: false
            });

            mockDependencyRepository.getAll.mockReturnValue([mockDependency]);
            mockCVEScanner.scan.mockRejectedValue(new Error('Scan error'));

            await dependencyManager.checkAndResolveCVEs();

            expect(mockCVEScanner.scan).toHaveBeenCalledWith(mockDependency);
        });
    });

    describe('lockAllCurrentVersions', () => {
        it('should mark dependencies as read-only', () => {
            const mockDependency1 = { name: 'dep1', readOnly: false };
            const mockDependency2 = { name: 'dep2', readOnly: false };
            mockDependencyRepository.getAll.mockReturnValue([mockDependency1, mockDependency2]);

            dependencyManager.lockAllCurrentVersions();

            expect(mockDependencyRepository.getAll).toHaveBeenCalled();
        });
    });

    describe('checkMelIgnore', () => {
        it('should return false if dependency name is not in melIgnoreList', () => {
            const isIgnored = dependencyManager.checkMelIgnore('new-dep');

            expect(isIgnored).toBe(false);
        });
    });

    describe('getAllowedVersions', () => {
        it('should fetch the three most recent allowed versions from npmService', async () => {
            const depName = 'example-dep';
            const versions = await dependencyManager.getAllowedVersions({ depName });

            expect(mockNpmService.getAllowedSemverVersions).toHaveBeenCalledWith(depName);
            expect(versions).toEqual(['1.4.0', '1.3.0', '1.2.0']);
        });

        it('should return an empty array if npmService throws an error', async () => {
            mockNpmService.getAllowedSemverVersions.mockRejectedValue(new Error('Fetch error'));

            const versions = await dependencyManager.getAllowedVersions({ depName: 'error-dep' });

            expect(versions).toEqual([]);
        });
    });

    describe('syncWithPackageJson', () => {
        it('should sync with a valid package.json', () => {
            const packageJSONContent = {
                dependencies: {
                    'dependency1': '1.0.0',
                    'dependency2': '2.0.0'
                }
            };
            const mockDependency1 = new Dependency({
                name: 'dependency1',
                version: '1.0.0',
                maintainer: 'MaintainerName',
                readOnly: false,
                isLocal: false
            });
            const mockDependency2 = new Dependency({
                name: 'dependency2',
                version: '2.0.0',
                maintainer: 'MaintainerName',
                readOnly: false,
                isLocal: false
            });

            mockDependencyRepository.get.mockImplementation((name) => {
                if (name === 'dependency1') return null;
                return mockDependency2;
            });

            (FileSystemAPI as any).readPackageJson = jest.fn().mockReturnValue(packageJSONContent);

            const addDependencySpy = jest.spyOn(dependencyManager, 'addDependency');

            dependencyManager.syncWithPackageJson();

            expect(addDependencySpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'dependency1', version: '1.0.0' }));
            expect(addDependencySpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'dependency2', version: '2.0.0' }));
            expect(addDependencySpy).toHaveBeenCalledTimes(2);
        });

        it('should throw an error if package.json is invalid or not found', async () => {
            (FileSystemAPI as any).readPackageJson = jest.fn().mockImplementation(() => {
                throw new Error('File not found');
            });

            await expect(dependencyManager.syncWithPackageJson()).rejects.toThrow('Package.json is invalid or there is no alike file.');
        });
    });

    describe('cleanInstallDependencies', () => {
        it('should call npm ci', () => {
            dependencyManager.cleanInstallDependencies();

            expect(mockNpmService.run).toHaveBeenCalledWith('ci');
        });
    });

    describe('triggerADSBuild', () => {
        it('should trigger the build command', () => {
            dependencyManager.triggerADSBuild();

            expect(mockNpmService.run).toHaveBeenCalledWith('run', ['build']);
        });
    });

    describe('installDeps', () => {
        it('should call npm install with a list of dependencies', () => {
            dependencyManager.installDeps(['dep1', 'dep2']);

            expect(mockNpmService.run).toHaveBeenCalledWith('install', ['dep1', 'dep2']);
        });
    });
});
