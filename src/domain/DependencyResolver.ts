import * as fs from 'fs';
import * as path from 'path';
import * as kiwi from '@lume/kiwi';

type DependencySection = 'dependencies' | 'devDependencies' | 'peerDependencies';
type VersionSpec = { op: string, major: number, minor: number, patch: number };
type PkgConstraints = { [pkg: string]: VersionSpec[] };

function parseVersion(versionStr: string): VersionSpec[] {
    const specs: VersionSpec[] = [];
    const re = /(\^|~|>=|<=|>|<|=)?\s*([\d]+)(?:\.([\d]+))?(?:\.([\d]+))?/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(versionStr)) !== null) {
        let op = m[1] || '==';
        if (op === '=') op = '==';
        let major = parseInt(m[2] || '0', 10);
        let minor = parseInt(m[3] || '0', 10);
        let patch = parseInt(m[4] || '0', 10);
        specs.push({ op, major, minor, patch });
    }
    return specs;
}

function collectAllConstraints(packageJson: any): { [pkg: string]: VersionSpec[] } {
    const sections: DependencySection[] = ['dependencies', 'devDependencies', 'peerDependencies'];
    let result: { [pkg: string]: VersionSpec[] } = {};
    for (let section of sections) {
        const deps = packageJson[section] || {};
        for (const [pkg, ver] of Object.entries(deps)) {
            if (!result[pkg]) result[pkg] = [];
            result[pkg].push(...parseVersion(ver as string));
        }
    }
    return result;
}

function addConstraints(
    solver: kiwi.Solver,
    variables: { [pkg: string]: kiwi.Variable },
    pkg: string,
    specs: VersionSpec[]
) {
    const v = variables[pkg];
    for (const { op, major, minor, patch } of specs) {
        const num = major * 10000 + minor * 100 + patch;
        switch (op) {
            case '==':
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Eq, num));
                break;
            case '>=':
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Ge, num));
                break;
            case '<=':
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Le, num));
                break;
            case '>':
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Ge, num));
                break;
            case '<':
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Le, num));
                break;
            case '^':
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Ge, num));
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Le, (major + 1) * 10000));
                break;
            case '~':
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Ge, num));
                solver.addConstraint(new kiwi.Constraint(v, kiwi.Operator.Le, major * 10000 + (minor + 1) * 100));
                break;
            default:
                throw new Error('Unknown operator: ' + op);
        }
    }
}

export class DependencyResolver {
    private readonly constraints: PkgConstraints;
    private resolved: { [pkg: string]: string } = {};
    constructor(packageJson: any) {
        this.constraints = collectAllConstraints(packageJson);
    }

    resolve() {
        const pkgs = Object.keys(this.constraints);
        const variables: { [pkg: string]: kiwi.Variable } = {};
        pkgs.forEach(pkg => {
            variables[pkg] = new kiwi.Variable(pkg);
        });

        const solver = new kiwi.Solver();

        let impossible: string[] = [];

        // будет пытаться поочередно каждый пакет решать отдельно,
        // чтобы в случае конфликта видеть всех конфликтующих
        pkgs.forEach(pkg => {
            try {
                const singleSolver = new kiwi.Solver();
                singleSolver.addEditVariable(variables[pkg], kiwi.Strength.weak);
                singleSolver.suggestValue(variables[pkg], 10000);
                addConstraints(singleSolver, variables, pkg, this.constraints[pkg]);
                singleSolver.updateVariables();
            } catch (e) {
                impossible.push(pkg);
            }
        });

        if (impossible.length) {
            return `Несовместимые зависимости: ${impossible.join(', ')}.`;
        }

        // Если никаких конфликтов, то решим все скопом и получим решения
        pkgs.forEach(pkg => {
            solver.addEditVariable(variables[pkg], kiwi.Strength.weak);
            solver.suggestValue(variables[pkg], 10000);
            addConstraints(solver, variables, pkg, this.constraints[pkg]);
        });

        solver.updateVariables();

        const result: { [pkg: string]: string } = {};
        pkgs.forEach(pkg => {
            const num = Math.round(variables[pkg].value());
            const major = Math.floor(num / 10000);
            const minor = Math.floor((num % 10000) / 100);
            const patch = num % 100;
            result[pkg] = `${major}.${minor}.${patch}`;
        });
        return result;
    }
}
