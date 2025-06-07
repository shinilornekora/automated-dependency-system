import { User } from '../domain/User.js';
import { FileSystemAPI } from '../infrastructure/FileSystemAPI.js';

describe('User', () => {
    const originalReadPackageJson = FileSystemAPI.readPackageJson;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    afterAll(() => {
        FileSystemAPI.readPackageJson = originalReadPackageJson;
        jest.restoreAllMocks();
    });

    test('should set isPackageMaintainer to true if author equals user name', () => {
        const mockUserName = 'shiniasse';
        const mockPackageJson = { author: mockUserName };

        jest.spyOn(FileSystemAPI, 'readPackageJson').mockReturnValue(mockPackageJson);

        const user = new User({ name: mockUserName });

        expect(user.isPackageMaintainer).toBe(true);
        expect(FileSystemAPI.readPackageJson).toHaveBeenCalledTimes(1);
    });

    test('should set isPackageMaintainer to false if author is not present in package.json', () => {
        const mockUserName = 'shiniasse';
        const mockPackageJson = { author: undefined };

        jest.spyOn(FileSystemAPI, 'readPackageJson').mockReturnValue(mockPackageJson);

        const user = new User({ name: mockUserName });

        expect(user.isPackageMaintainer).toBe(false);
        expect(FileSystemAPI.readPackageJson).toHaveBeenCalledTimes(1);
    });

    test('should set isPackageMaintainer to false if author does not match user name', () => {
        const mockUserName = 'shiniasse';
        const mockAuthorName = 'notshiniasse';
        const mockPackageJson = { author: mockAuthorName };

        jest.spyOn(FileSystemAPI, 'readPackageJson').mockReturnValue(mockPackageJson);

        const user = new User({ name: mockUserName });

        expect(user.isPackageMaintainer).toBe(false);
        expect(FileSystemAPI.readPackageJson).toHaveBeenCalledTimes(1);
    });

    test('should set isPackageMaintainer to false if an error occurs while reading package.json', () => {
        const mockUserName = 'shiniasse';

        // Mock readPackageJson to throw an error
        jest.spyOn(FileSystemAPI, 'readPackageJson').mockImplementation(() => {
            throw new Error('Package.json reading error');
        });

        const user = new User({ name: mockUserName });

        expect(user.isPackageMaintainer).toBe(false);
        expect(FileSystemAPI.readPackageJson).toHaveBeenCalledTimes(1);
    });

    test('checkIfCurrentPackageMaintainsByUser should return false if author is not present in package.json', () => {
        const mockPackageJson = { author: undefined };

        jest.spyOn(FileSystemAPI, 'readPackageJson').mockReturnValue(mockPackageJson);

        const user = new User({ name: 'testUser' });

        expect(user.checkIfCurrentPackageMaintainsByUser()).toBe(false);
    });

    test('checkIfCurrentPackageMaintainsByUser should return true when author matches user name', () => {
        const mockUserName = 'shiniasse';
        const mockPackageJson = { author: mockUserName };

        jest.spyOn(FileSystemAPI, 'readPackageJson').mockReturnValue(mockPackageJson);

        const user = new User({ name: mockUserName });

        expect(user.checkIfCurrentPackageMaintainsByUser()).toBe(true);
    });

    test('checkIfCurrentPackageMaintainsByUser should return null on error', () => {
        jest.spyOn(FileSystemAPI, 'readPackageJson').mockImplementation(() => {
            throw new Error('IO Exception');
        });

        const user = new User({ name: 'anyUser' });

        expect(user.checkIfCurrentPackageMaintainsByUser()).toBeNull();
    });
});
