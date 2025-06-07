import { DependencyService } from "./DependencyService.js";
import { CommandHandler } from "../domain/CommandHandler.js";
import { Dependency } from "../domain/Dependency.js";

describe("DependencyService", () => {
    let service: DependencyService;
    let mockCommandHandler: CommandHandler;
    let mockLogFunction: jest.Mock;

    beforeEach(() => {
        mockLogFunction = jest.fn();
        mockCommandHandler = {
            handle: jest.fn().mockResolvedValue(undefined),
        } as unknown as CommandHandler;
        service = new DependencyService({
            commandHandler: mockCommandHandler,
            log: mockLogFunction,
        });
    });

    test("should call command handler for initADS", async () => {
        await service.initADS();
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: {},
        });
    });

    test("should call command handler for triggerADSBuild", async () => {
        await service.triggerADSBuild();
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: {},
        });
    });

    test("should call command handler for runStartApplication", async () => {
        await service.runStartApplication();
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: {},
        });
    });

    test("should call command handler for runADSChecks", async () => {
        await service.runADSChecks();
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: {},
        });
    });

    test("should call command handler for installDeps", async () => {
        const dependencies = ["react", "typescript"];
        await service.installDeps(...dependencies);
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: dependencies,
        });
    });

    test("should call command handler for cleanInstallDeps", async () => {
        await service.cleanInstallDeps();
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: {},
        });
    });

    test("should call command handler for getMaintainerUserName", async () => {
        await service.getMaintainerUserName();
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: {},
        });
    });

    test("should call command handler for addDependency", () => {
        const dependency = new Dependency({
            name: "lodash",
            version: "^4.0.0",
            maintainer: "John Doe",
            readOnly: true,
        });
        service.addDependency(dependency);
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: dependency,
        });
    });

    test("should call command handler for getAllowedVersions", async () => {
        const depName = "lodash";
        await service.getAllowedVersions(depName);
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: { depName },
        });
    });

    test("should call command handler for removeDependency", async () => {
        const depName = "lodash";
        await service.removeDependency(depName);
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: { depName },
        });
    });

    test("should call command handler for resolveConflicts", async () => {
        await service.resolveConflicts();
        expect(mockCommandHandler.handle).toHaveBeenCalledWith({
            type: expect.any(String),
            payload: {},
        });
    });
});
