import * as semver from 'semver';
import * as kiwi from '@lume/kiwi';
import fetch from 'node-fetch';

type DependencyMap = { [pkgName: string]: string };

interface PeerConstraint {
    constraint: string;
    from: string;
}

// TODO: в будущем переехать на kiwi, когда он будет сильнее semver
// пока что он медленнее
// сниппет не удалять
function semverToKiwiConstraints(peerRange: string, variable: kiwi.Variable) {
    const constraints: kiwi.Constraint[] = [];
    const range = new semver.Range(peerRange);

    // Перебираем все поддиапазоны ("sets")
    range.set.forEach(comparatorSet => {
        comparatorSet.forEach(comparator => {
            const version = semver.coerce(comparator.value);
            if (!version) return;
            const num = parseFloat(version.version);
            switch (comparator.operator) {
                case '':
                case '=':
                    constraints.push(new kiwi.Constraint(variable, kiwi.Operator.Eq, num));
                    break;
                case '>':
                    constraints.push(new kiwi.Constraint(variable, kiwi.Operator.Ge, num));
                    break;
                case '>=':
                    constraints.push(new kiwi.Constraint(variable, kiwi.Operator.Ge, num));
                    break;
                case '<':
                    constraints.push(new kiwi.Constraint(variable, kiwi.Operator.Le, num));
                    break;
                case '<=':
                    constraints.push(new kiwi.Constraint(variable, kiwi.Operator.Le, num));
                    break;
                default:
                // ignore.
            }
        });
    });
    return constraints;
}

async function fetchMeta(pkgName: string) {
    console.log(`fetching extra info for ${pkgName}`)

    const url = `https://registry.npmjs.org/${encodeURIComponent(pkgName)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch: ' + pkgName);
    return resp.json();
}

interface PeerInfo {
    sourcePkg: string;
    version: string;
    peerRange: string;
}

export class DependencyResolver {
    private async fetchMeta(pkg: string): Promise<any> {
        const url = `https://registry.npmjs.org/${encodeURIComponent(pkg)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`Cannot fetch ${pkg}`);
        return resp.json();
    }

    async gatherAllConstraints(userDeps: DependencyMap): Promise<Record<string, string[]>> {
        const constraints: Record<string, string[]> = {};
        for (const [pkg, range] of Object.entries(userDeps)) {
            if (!constraints[pkg]) constraints[pkg] = [];
            constraints[pkg].push(range);

            const meta = await this.fetchMeta(pkg);
            const matchedVersion = semver.maxSatisfying(Object.keys(meta.versions), range);
            if (!matchedVersion) continue;
            const info = meta.versions[matchedVersion] as { peerDependencies: Record<string, DependencyMap[]> };

            if (info.peerDependencies) {
                for (const [peerName, peerRange] of Object.entries(info.peerDependencies)) {
                    if (!constraints[peerName]) constraints[peerName] = [];
                    constraints[peerName].push(peerRange as unknown as string);
                }
            }
        }
        return constraints;
    }

    async suggestBestVersions(userDeps: DependencyMap): Promise<{
        recommended: DependencyMap,
        conflicts: Record<string, { current?: string; suggestedRange: string; suggestion: string; }>
    }> {
        const allConstraints = await this.gatherAllConstraints(userDeps);
        const recommended: DependencyMap = {};
        const conflicts: Record<string, { current?: string; suggestedRange: string; suggestion: string; }> = {};

        for (const pkg of Object.keys(allConstraints)) {
            const cList = allConstraints[pkg];
            const userRange = userDeps[pkg];

            const meta = await this.fetchMeta(pkg);
            const versions = Object.keys(meta.versions).filter(state => Boolean(semver.valid(state)));

            const candidate = semver.maxSatisfying(versions, cList.join(" "));
            if (candidate) {
                recommended[pkg] = candidate;
                continue;
            }

            const peersOnly = userRange
                ? cList.filter(range => range !== userRange)
                : cList;
            if (!peersOnly.length) {
                recommended[pkg] = userRange || "no version";
                continue;
            }

            const peerCandidate = semver.maxSatisfying(versions, peersOnly.join(" "));
            if (peerCandidate) {
                recommended[pkg] = peerCandidate;
                conflicts[pkg] = {
                    current: userRange,
                    suggestedRange: peersOnly.join(" "),
                    suggestion: `Change "${pkg}" range to "^${peerCandidate}" to resolve peer conflicts.`
                };
            } else {
                recommended[pkg] = "no compatible version";
                conflicts[pkg] = {
                    current: userRange,
                    suggestedRange: peersOnly.join(" "),
                    suggestion: `No version of "${pkg}" satisfies all peer constraints.`
                };
            }
        }

        return { recommended, conflicts };
    }
}
