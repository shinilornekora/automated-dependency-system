import * as fs from 'fs';
import { FileSystemAPI } from './FileSystemAPI.js';

jest.mock('fs');

describe('readMelIgnore', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('returns empty array if file does not exist', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        const result = FileSystemAPI.readMelIgnore();
        expect(result).toEqual([]);
    });

    test('reads and trims lines correctly with Unix line divider', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('line1\nline2\n  line3  ');
        const expectedLines = ['line1', 'line2', 'line3'];
        const result = FileSystemAPI.readMelIgnore();
        expect(result).toEqual(expectedLines);
    });

    test('reads and trims lines correctly with Windows line divider', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('line1\r\nline2\r\n  line3  ');
        const expectedLines = ['line1', 'line2', 'line3'];
        const result = FileSystemAPI.readMelIgnore();
        expect(result).toEqual(expectedLines);
    });
});

describe('readPackageJson', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('returns null if package.json does not exist', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        const result = FileSystemAPI.readPackageJson();
        expect(result).toBeNull();
    });

    test('returns package data if file exists and JSON is valid', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        const json = '{ "name": "test", "version": "1.0.0" }';
        (fs.readFileSync as jest.Mock).mockReturnValue(json);

        const result = FileSystemAPI.readPackageJson();
        expect(result).toEqual(JSON.parse(json));
    });
});

describe('writePackageJson', () => {
    let mockWriteFileSync: jest.SpyInstance;
    let mockStringify: jest.SpyInstance;

    beforeEach(() => {
        jest.resetAllMocks();
        mockWriteFileSync = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        mockStringify = jest.spyOn(JSON, 'stringify').mockImplementation((data) => JSON.stringify(data));
    });

    test('writes package data if no error occurs', () => {
        const packageData = { name: 'test', version: '1.0.0' };
        mockStringify.mockReturnValue('stringified json');
        const result = FileSystemAPI.writePackageJson(packageData);
        expect(result).toBe(true);
        expect(mockWriteFileSync).toHaveBeenCalled();
    });
});

describe('readDependencyADSFile', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('returns null if dependency file does not exist', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        const result = FileSystemAPI.readDependencyADSFile();
        expect(result).toBeNull();
    });

    test('returns dependency data if file exists and JSON is valid', () => {
        const depsData = '{ "dependencies": ["dep1", "dep2"] }';
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(depsData);

        const result = FileSystemAPI.readDependencyADSFile();
        expect(result).toEqual(JSON.parse(depsData));
    });
});

describe('saveDependencyADSFile', () => {
    let mockGetStringify: jest.SpyInstance;
    let mockWriteFile: jest.SpyInstance;
    let mockMakeDir: jest.SpyInstance;
    let mockEnsureDir: jest.SpyInstance;

    beforeEach(() => {
        jest.resetAllMocks();
        mockGetStringify = jest.spyOn(FileSystemAPI, '_getDependenciesJson').mockImplementation(() => 'stringified deps');
        mockWriteFile = jest.spyOn(FileSystemAPI, '_writeFile').mockImplementation(() => {});
    });

    test('successfully saves dependencies if directory is created and writing is ok', () => {
        const result = FileSystemAPI.saveDependencyADSFile([]);
        expect(result).toBeUndefined();
    });
});