import {NS} from "Bitburner";
import {allHosts, f$, getHosts, table} from "/lib/utils.js";

export async function main(ns: NS) {
    const [o] = ns.args 
    const rel = o === '-r'
    const res = allHosts(ns)
    const hosts = getHosts(ns, 'all')
    const prepared = new Set(hosts.flatMap(p => ns.ps(p)
        .filter(p => p.filename === 'weaken.js' && !!p.args.find(a => a.toString().includes('prepare-')))
        .map(p => p.args[0])))
    const pumps = res.filter(h => h.startsWith('p-')).concat('home')
    const pumped = new Set(pumps.flatMap(p => ns.ps(p).filter(p => p.filename === 'pump.js').map(p => p.args[0])))

    const isPrepared = (h: string) => ns.getServerSecurityLevel(h) === ns.getServerMinSecurityLevel(h) 
        && ns.getServerMoneyAvailable(h) === ns.getServerMaxMoney(h) && ns.getServerMaxMoney(h) > 0

    const e = res
        .map((h) => [
            ns.getServerRequiredHackingLevel(h),
            //(maxMoney * hackSuccessChance * taking) / weakenTime 
            x(ns, h, !rel),
            ns.hasRootAccess(h) ? 'Y' : 'N', 
            h,
            pumped.has(h) ? 'PUMP' : prepared.has(h) ? '@' : isPrepared(h) ? '!' : '',
            ns.getServerSecurityLevel(h).toFixed(0) + ' > ' + ns.getServerMinSecurityLevel(h).toFixed(0),
            f$(ns.getServerMoneyAvailable(h)), ((ns.getServerMoneyAvailable(h) / ns.getServerMaxMoney(h)) * 100).toFixed(0),
        ] as const)
        .sort((e1, e2) => !rel ? e1[0] - e2[0] : e2[1] - e1[1])

    const headers = ['#', 'H', 'X', 'R', 'Name', 'Status', 'S > MS', '$', '%']

    ns.alert(
        table([headers].concat(e.map((e, i) => [i+1 as any].concat(e))))
    )
}

function x(ns: NS, host: string, abs: boolean) {
    if (ns.fileExists('Formulas.exe', 'home')) {
        const s = ns.getServer(host)
        const p = ns.getPlayer()
        s.hackDifficulty = s.minDifficulty
        s.moneyAvailable = s.moneyMax
        if (abs)
            p.hacking = s.requiredHackingSkill * 2 + 10
        const maxMoney = s.moneyMax
        const weakenTime = ns.formulas.hacking.weakenTime(s, p)
        const hackSuccessChance = ns.formulas.hacking.hackChance(s, p)
        const taking = ns.formulas.hacking.hackPercent(s, p)

        return Math.round((maxMoney * hackSuccessChance * taking) / weakenTime)
    }
    return Math.round(ns.getServerMaxMoney(host) / 1e5 / ns.getServerMinSecurityLevel(host) * (abs ? 1 : ns.hackAnalyze(host) * 100))
}