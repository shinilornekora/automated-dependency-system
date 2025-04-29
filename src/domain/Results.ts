type ResultsProps = {
    projectName: string;
    projectWasBuilt: boolean;
    wasAnyConflictThere: boolean;
    wasAnyVulnerabilityThere: boolean;
    conflicts: Array<string>;
    vulnerabilities: Array<string>;
}

/**
 * Класс для генерации отчета после автоматического процесса ADS.
 * Печатаем куда-то в консоль, оставим вывод на систему.
 */
export class Results {
    private readonly projectName: string;
    private readonly projectWasBuilt: boolean;
    private readonly wasAnyConflictThere: boolean;
    private readonly wasAnyVulnerabilityThere: boolean;
    private readonly conflicts: Array<string>;
    private readonly vulnerabilities: Array<string>;

    public constructor({
        projectWasBuilt,
        wasAnyConflictThere,
        wasAnyVulnerabilityThere,
        conflicts,
        vulnerabilities,
        projectName,
    }: ResultsProps) {
        this.projectWasBuilt = projectWasBuilt;
        this.wasAnyVulnerabilityThere = wasAnyVulnerabilityThere;
        this.wasAnyConflictThere = wasAnyConflictThere;
        this.conflicts = conflicts;
        this.vulnerabilities = vulnerabilities;
        this.wasAnyConflictThere = wasAnyConflictThere;
        this.conflicts = conflicts;
        this.vulnerabilities = vulnerabilities;
        this.projectName = projectName;
    }

    private printArrayConditionalResult(title: string, array: Array<string>, condition: boolean) {
        return `
            ${title}: ${condition ? 'YES' : 'NO'}
            ${ array.reduce((acc, current: string) => acc + `${current}\n`, '') }
        `;
    }

    public getResults(): string {
        const conflicts = this.printArrayConditionalResult('CONFLICTS', this.conflicts, this.wasAnyConflictThere)
        const vulnerabilities = this.printArrayConditionalResult('CVE', this.vulnerabilities, this.wasAnyVulnerabilityThere);

        return `
            RESULTS FOR PROJECT "${this.projectName}":
            WAS BUILT: ${ this.projectWasBuilt ? 'YES' : 'NO' }
            ${ conflicts }
            ${ vulnerabilities }
        `;

    }
}