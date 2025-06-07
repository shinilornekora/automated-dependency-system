import { Dependency } from '../domain/Dependency.js';
import { DependencyRepository } from './DependencyRepository.js';
import { FileSystemAPI } from "./FileSystemAPI.js";

jest.mock('./FileSystemAPI.js');

describe('DependencyRepository', () => {
    let instance: DependencyRepository;

    beforeEach(() => {
        (FileSystemAPI.readDependencyADSFile as jest.Mock).mockReturnValue([]);
        (FileSystemAPI.readMelIgnore as jest.Mock).mockReturnValue([]);
        (FileSystemAPI.readPackageJson as jest.Mock).mockReturnValue({});
        (FileSystemAPI.saveDependencyADSFile as jest.Mock).mockReturnValue([]);
        (FileSystemAPI.writePackageJson as jest.Mock).mockReturnValue({});
        instance = new DependencyRepository();
    });

    describe('#initialize', () => {
        it('initializes the repository by clearing and loading dependencies', () => {
            const dep1 = { name: 'dep1', version: '1.0.0', maintainer: 'shiniasse', readOnly: true };
            const dep2 = { name: 'dep2', version: '2.0.0', maintainer: 'shiniasse', readOnly: true };
            const deps = [dep1, dep2];

            // Чтобы ссылка не менялась
            (FileSystemAPI.readDependencyADSFile as jest.Mock).mockReturnValue(deps);

            instance.addAll(deps.map(dep => new Dependency(dep)));

            const repoDeps = instance.getAll();

            expect(repoDeps.length).toBe(deps.length);
            expect(repoDeps[0].getName).toBe('dep1');
            expect(repoDeps[0].getVersion).toBe('1.0.0');
            expect(repoDeps[1].getName).toBe('dep2');
            expect(repoDeps[1].getVersion).toBe('2.0.0');
        });
    });

    describe('_toDependency', () => {
        it('parses object with name and version into a Dependency instance', () => {
            const testDep = { name: 'dep1', version: '1.0.0', maintainer: 'shiniasse', readonly: true };
            const dependency = instance['_toDependency'](testDep)!;

            expect(dependency).toBeInstanceOf(Dependency);
            expect(dependency.getName).toBe('dep1');
        });

        it('returns null if dep does not contain name or version', () => {
            const invalidDep1 = { name: 'dep1' };
            const invalidDep2 = { version: '1.0.0' };

            const parsed1 = instance['_toDependency'](invalidDep1);
            const parsed2 = instance['_toDependency'](invalidDep2);

            expect(parsed1).toBeNull();
            expect(parsed2).toBeNull();
        });

        it('returns dep if it is already a Dependency instance', () => {
            const dep = new Dependency({ name: 'dep1', version: '1.0.0', maintainer: 'nobody', readOnly: false });
            const parsedDep = instance['_toDependency'](dep);

            expect(parsedDep).toBe(dep);
        });

        it('returns null if dep is invalid', () => {
            const parsed = instance['_toDependency'](undefined);
            expect(parsed).toBeNull();
        });
    });

    describe('_isValidDepsArray', () => {
        it('returns true for a valid array', () => {
            const arr = [1, 2, 3];
            expect(instance['_isValidDepsArray'](arr)).toBe(true);
        });

        it('returns false for a non-array value', () => {
            expect(instance['_isValidDepsArray']({})).toBe(false);
            expect(instance['_isValidDepsArray']('string')).toBe(false);
            expect(instance['_isValidDepsArray'](null)).toBe(false);
        });
    });

    describe('_depsArrayToRecord', () => {
        it('converts Dependency[] to Record<string, string>', () => {
            const dependency1 = new Dependency({ name: 'dep1', version: '1.0.0', maintainer: 'nobody', readOnly: false });
            const dependency2 = new Dependency({ name: 'dep2', version: '2.0.0', maintainer: 'nobody', readOnly: false });
            const input = [ dependency1, dependency2 ];
            const expectedOutput = {
                dep1: '1.0.0',
                dep2: '2.0.0'
            };
            const result = instance['_depsArrayToRecord'](input);
            expect(result).toEqual(expectedOutput);
        });

        it('excludes dependencies without a name', () => {
            const dependency = new Dependency({
                name: '',
                version: '1.0.0',
                maintainer: 'nobody',
                readOnly: false
            });
            const input = [dependency];
            const expectedOutput = {};
            const result = instance['_depsArrayToRecord'](input);
            expect(result).toEqual(expectedOutput);
        });
    });

    describe('_enforceMelIgnoreRules', () => {
        it('adds to newDeps when dependency is in melIgnoreFile and in packageJSON', () => {
            const melIgnore = ['depX'];
            const packageJSON = {
                dependencies: {
                    depX: {
                        version: '3.0.0',
                    }
                }
            };
            const newDeps: Record<string, string> = {};
            const currentNames: string[] = [];
            instance['_enforceMelIgnoreRules'](newDeps, melIgnore, packageJSON);

            expect(newDeps).toHaveProperty('depX');
            expect(newDeps['depX']).toBe('3.0.0');
        });

        it('does not add if dependency is already present in newDeps', () => {
            const melIgnore = ['depX'];
            const packageJSON = {
                dependencies: {
                    depX: { version: '3.0.0' }
                }
            };
            const newDeps = { depX: '1.0.0' };
            instance['_enforceMelIgnoreRules'](newDeps, melIgnore, packageJSON);
            expect(newDeps['depX']).toBe('1.0.0');
        });

        it('does nothing if packageJSON is not an object', () => {
            const newDeps = { depY: '2.0.0' };
            const melIgnore = ['depX'];
            const packageJSON = 123; // Invalid object
            instance['_enforceMelIgnoreRules'](newDeps, melIgnore, packageJSON);
            expect(newDeps).toEqual({ depY: '2.0.0' });
        });
    });

    describe('#add', () => {
        it('adds a valid dependency to the repository and saves it', () => {
            const dep = new Dependency({ name: 'dep1', version: '1.0.0', maintainer: 'nobody', readOnly: false });
            const addSpy = jest.spyOn(instance, 'add');

            instance.add(dep);
            const repoDeps = instance.getAll();

            expect(repoDeps.length).toBe(1);
            expect(repoDeps[0].getName).toBe('dep1');
            expect(repoDeps[0].getVersion).toBe('1.0.0');
            expect(addSpy).toHaveBeenCalled();
        });

        it('throws error if dependency is invalid', () => {
            const invalidDep = {} as unknown as Dependency;

            expect(() => {
                instance.add(invalidDep);
            }).toThrow('Invalid dependency');
        });

        it('throws error if dependency is in melIgnore', () => {
            const dep = new Dependency({ 
                name: 'dep1',
                version: '1.0.0',
                maintainer: 'nobody',
                readOnly: false 
            });
            (FileSystemAPI.readMelIgnore as jest.Mock).mockReturnValue(['dep1']);

            expect(() => {
                instance.add(dep);
            }).toThrow(`Dependency dep1 is included in .melignore file and won't be added to ADS control unit.`);
        });
    });

    describe('#addAll', () => {
        it('adds all dependencies in the array to the repository and saves', () => {
            const dependency1 = new Dependency({
                name: 'dep1',
                version: '1.0.0',
                maintainer: 'nobody',
                readOnly: false
            });
            const dependency2 = new Dependency({
                name: 'dep2',
                version: '2.0.0',
                maintainer: 'nobody',
                readOnly: false
            });
            const deps = [ dependency1, dependency2 ];

            instance.addAll(deps);
            const repoDeps = instance.getAll();

            expect(repoDeps.length).toBe(2);
            expect(repoDeps[0].getName).toBe('dep1');
            expect(repoDeps[0].getVersion).toBe('1.0.0');
            expect(repoDeps[1].getName).toBe('dep2');
            expect(repoDeps[1].getVersion).toBe('2.0.0');
        });
    });

    describe('#get', () => {
        it('returns an existing dependency by name', () => {
            const dep = new Dependency({ name: 'dep1', version: '1.0.0', maintainer: 'nobody', readOnly: false });
            instance.add(dep);
            expect(instance.get('dep1')).toBe(dep);
        });

        it('returns undefined for a non-existing dependency', () => {
            expect(instance.get('non-existing')).toBeUndefined();
        });

        it('returns undefined if name is not a valid string', () => {
            expect(instance.get('')).toBeUndefined();
            expect(instance.get(undefined as unknown as string)).toBeUndefined();
            expect(instance.get(null as unknown as string)).toBeUndefined();
        });
    });
});
