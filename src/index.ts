import { FileSystemService } from './infrastructure/FileSystemService';
import { DependencyRepository } from './infrastructure/DependencyRepository';
import { CVEScanner } from './infrastructure/CVEScanner';
import { NpmService } from './infrastructure/NpmService';
import { DependencyManager } from './domain/DependencyManager';
import { DependencyResolver } from './domain/DependencyResolver';
import { DependencyService } from './application/DependencyService';
import { User } from "./domain/User";

export function createADS(currentUsername: string) {
    const currentUser = new User({ name: currentUsername, isPackageMaintainer: false });
    const fsService = new FileSystemService();
    const melIgnoreList = fsService.readMelIgnore();
    const dependencyRepository = new DependencyRepository();
    const cveScanner = new CVEScanner();
    const npmService = new NpmService();
    const dependencyResolver = new DependencyResolver({});
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
