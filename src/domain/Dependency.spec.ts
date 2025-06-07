import { Dependency } from './Dependency.js';

describe('Dependency Class', () => {
    it('should create a Dependency instance with given props', () => {
        const now = Date.now();
        
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: 'John Doe',
            readOnly: false,
            lastUsed: now,
            isLocal: true
        });
        
        expect(dependency.getName).toBe('test_dependency');
        expect(dependency.getVersion).toBe('1.0.0');
        expect(dependency.maintainer).toBe('John Doe');
        expect(dependency.isReadOnly).toBe(false);
        expect(dependency.isResolvedByGPT).toBe(undefined);
        expect(dependency.getIsLocal).toBe(true);
        expect(dependency.getLastUsed).toBe(now);
    });

    it('should update the version when dependency is not read-only', () => {
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: null,
            readOnly: false
        });
        
        expect(dependency.getVersion).toBe('1.0.0');
        
        dependency.updateVersion('2.0.0');
        
        expect(dependency.getVersion).toBe('2.0.0');
    });

    it('should throw an error when trying to update the version of a read-only dependency', () => {
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: null,
            readOnly: true
        });

        expect(() => {
            dependency.updateVersion('2.0.0');
        }).toThrow(`Dependency test_dependency is read-only and cannot be updated.`);
    });

    it('should mark the dependency as read-only', () => {
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: null,
            readOnly: false
        });

        expect(dependency.isReadOnly).toBe(false);
        
        dependency.markReadOnly();
        
        expect(dependency.isReadOnly).toBe(true);
    });

    it('should default lastUsed to current time if not provided', () => {
        const currentTime = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(currentTime);
        
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: null,
            readOnly: false,
            isLocal: false
        });
        
        expect(dependency.getLastUsed).toBe(currentTime);        
    });

    it('should update lastUsed to current time', () => {
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: null,
            readOnly: false
        });
        
        const originalLastUsed = dependency.lastUsed;
        const newLastUsed = originalLastUsed + 100;

        jest.spyOn(Date, 'now').mockReturnValue(newLastUsed);
        
        dependency.updateLastUsed();
        
        expect(dependency.getLastUsed).toBe(newLastUsed);
    });
    
    it('should return the maintainer if provided', () => {
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: 'John Doe',
            readOnly: false
        });
        
        expect(dependency.maintainer).toBe('John Doe');
    });
    
    it('should return null if maintainer is not provided', () => {
        const dependency = new Dependency({
            name: 'test_dependency',
            version: '1.0.0',
            maintainer: null,
            readOnly: false
        });
        
        expect(dependency.maintainer).toBe(null);
    });
});
