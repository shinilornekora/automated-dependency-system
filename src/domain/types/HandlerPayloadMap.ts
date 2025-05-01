import {COMMON_COMMANDS} from "./commonCommands.js";
import {Dependency} from "../Dependency.js";
import {PROTECTED_COMMANDS} from "./protectedCommands.js";

export type HandlerPayloadMap = {
    // Всем разрешенные команды
    [COMMON_COMMANDS.INIT_ADS]: unknown;
    [COMMON_COMMANDS.CHANGE_CONFIGURATION_FILE]: unknown;
    [COMMON_COMMANDS.CHANGE_EXISTING_DEPENDENCY]: Dependency;
    [COMMON_COMMANDS.RESOLVE_CONFLICTS]: unknown;
    [COMMON_COMMANDS.GET_MAINTAINER]: unknown;
    [COMMON_COMMANDS.COMMON_ADS_CHECK]: unknown;
    [COMMON_COMMANDS.CLEAN_INSTALL_DEPENDENCIES]: unknown;
    [COMMON_COMMANDS.INSTALL_DEPENDENCIES]: string[]
    [COMMON_COMMANDS.SHOW_THREE_VERSIONS]: { depName: string };
    [COMMON_COMMANDS.TRIGGER_ADS_BUILD]: unknown;

    // Требуется проверка доступа
    [PROTECTED_COMMANDS.DELETE_DEPENDENCY]: { depName: string };
    [PROTECTED_COMMANDS.REPLACE_DEPENDENCY]: Dependency;
    [PROTECTED_COMMANDS.ADD_DEPENDENCY]: Dependency;
};