import { CVEScanner } from '../infrastructure/CVEScanner.js';
import { exec } from 'child_process';
import { Dependency } from '../domain/Dependency.js';
import { fetch } from 'undici';

jest.mock('child_process', () => ({
    exec: jest.fn((command, callback) => {
        callback(null, 'mock stdout', 'mock stderr');
    })
}));

jest.mock('undici', () => ({
    fetch: jest.fn(),
}));

describe('CVEScanner', () => {
    const scanner: CVEScanner = new CVEScanner();

    beforeEach(() => {
        (exec as unknown as jest.Mock).mockReset();
        (fetch as jest.Mock).mockReset();
    });

    describe('getAuditResults', () => {
        it('возвращает кэшированный результат, если не forceRefresh', async () => {
            const cachedResult = { advisories: { '1': { module_name: 'cached' } } };
            scanner.auditResults = Promise.resolve(cachedResult);

            const result = await scanner.getAuditResults(false);

            expect(result).toBe(cachedResult);
        });

        it('выполняет команду npm audit, если нет кэшированных данных', async () => {
            (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
                callback(null, JSON.stringify({ advisories: { '1': { module_name: 'test' } } }), '');
            });

            const result = await scanner.getAuditResults();

            expect(result).toHaveProperty('advisories');
        });
    });

    describe('checkDeprecated', () => {
        it('возвращает false, если версия не deprecated', async () => {
            const mockPackageName = 'mockPackage';
            const mockVersion = '1.0.0';
            const mockMeta = {
                versions: {
                    '1.0.0': { deprecated: false }
                }
            };

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn(() => Promise.resolve(mockMeta))
            });

            const result = await scanner.checkDeprecated(mockPackageName, mockVersion);
            expect(result).toBe(false);
        });

        it('возвращает false при ошибках регестра', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: jest.fn(() => Promise.resolve({}))
            });

            const result = await scanner.checkDeprecated('notFound', '1.0.0');
            expect(result).toBe(false);
        });

        it('возвращает false при ошибке', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Rate limit exceeded'));
            const result = await scanner.checkDeprecated('foo', '1.0.0');
            expect(result).toBe(false);
        });
    });

    describe('extractVersionMeta', () => {
        it('возвращает версию, если она существует', () => {
            const meta = {
                versions: {
                    '1.0.0': { deprecated: 'old' }
                }
            };
            const versionMeta = scanner.extractVersionMeta(meta, '1.0.0');
            expect(versionMeta).toHaveProperty('deprecated', 'old');
        });

        it('находит совпадение версий по semver', () => {
            const meta = {
                versions: {
                    '1.0.1': { deprecated: 'old' }
                }
            };
            const versionMeta = scanner.extractVersionMeta(meta, '1.0.0');
            expect(versionMeta).toBeNull();
        });

        it('возвращает null, если версия не найдена', () => {
            const meta = {
                versions: {
                    '2.0.0': { deprecated: 'old' }
                }
            };
            const versionMeta = scanner.extractVersionMeta(meta, '1.0.0');
            expect(versionMeta).toBeNull();
        });
    });

    describe('scan', () => {
        it('возвращает "fixed", если найдена критическая или high уязвимость и текущая версия не исправлена', async () => {
            const mockDep = new Dependency({ name: 'test-package', version: '1.0.0', maintainer: 'test', readOnly: false });
            const advisories = {
                '100': {
                    module_name: 'test-package',
                    severity: 'critical',
                    patched_versions: '>=2.0.0'
                }
            };

            jest.spyOn(scanner, 'getAuditResults').mockResolvedValue({ advisories });

            const latestVersionSpy = jest
                .spyOn(scanner, 'getLatestVersionAsync')
                .mockImplementation(async (name: string) => '2.0.0');

            const result = await scanner.scan(mockDep);

            expect(result.severity).toEqual('fixed');
            expect(result.fixedVersion).toEqual('2.0.0');
            latestVersionSpy.mockRestore();
        });

        it('возвращает "none", если дальнейшая обработка не удалась', async () => {
            (scanner.getAuditResults as jest.Mock).mockImplementation(async (force?: boolean) => {
                throw new Error('some audit error');
            });
            const mockDep = new Dependency({ name: 'test-package', version: '1.0.0', maintainer: 'test', readOnly: false });

            const result = await scanner.scan(mockDep);

            expect(result.severity).toBe('none');
        });
    });

    describe('getLatestVersionAsync', () => {
        it('возвращает последнюю версию пакета', async () => {
            (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
                callback(null, '3.0.0', '');
            });
            const version = await scanner.getLatestVersionAsync('mock-pkg');
            expect(version).toBe('3.0.0');
        });

        it('возвращает null, если есть ошибка', async () => {
            (exec as unknown as jest.Mock).mockImplementationOnce((cmd, callback) => {
                callback(new Error('view error'), '', '');
            });
            const version = await scanner.getLatestVersionAsync('mock-pkg');
            expect(version).toBeNull();
        });
    });

    describe('error handlers', () => {
        it('logAuditError выводит отладку', async () => {
            const mockConsoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const err = new Error('Audit error');
            scanner.logAuditError(err);
            scanner.logAuditError({ message: 'unknown error', prop: 1 });

            expect(mockConsoleError).toHaveBeenCalled();
            mockConsoleError.mockRestore();
        });

        it('logGetLatestVersionError видит ошибку получения последней версии', async () => {
            const mockConsoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            const err = 'view error';
            scanner.logGetLatestVersionError(err, 'mockDep');
            expect(mockConsoleError).toHaveBeenCalled();
            mockConsoleError.mockRestore();
        });

        it('logGetLatestVersionError видит произвольную ошибку', async () => {
            const mockConsoleError = jest
                .spyOn(console, 'error')
                .mockImplementation(() => {
                    // do nothing
                });

            const err = new Error('some error');
            scanner.logGetLatestVersionError(err, 'mockDep');
            const errorString = JSON.stringify(err);
            expect(mockConsoleError).toHaveBeenCalledWith(`[LATEST VERSION ERROR] mockDep: ${errorString}`);
            mockConsoleError.mockRestore();
        });
    });
});
