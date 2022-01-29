import { NS } from "Bitburner";
import { exec } from "./exec.js";
import { allHosts, getHosts } from "/lib/utils";

type Args = string[]

export async function main(ns: NS) {
    net.update(ns)
    const [c, ...args] = ns.args as string[]
    if (!c || c === 'stats')
        return stats(ns)

    if (c === 'prepare')
        return prepare(ns, args)

    if (c === 'pump')
        return pump(ns, args)
}

function stats(ns: NS) {
    const ram = net.allHosts.reduce((ram, h) => ram + h.totalRam, 0)
    ns.tprint(`${net.hosts.size} hosts, ${ram} GB`)
}

async function prepare(ns: NS, args: Args) {
    const [host = 'all'] = args as string[]
    const targets = net.getHosts(host).map(h => h.toTarget(ns))
    for (const t of targets) {
        if (t.isUseless || net.pumped.has(t.name) || net.preparing.has(t.name))
            continue
        
        const w = t.needWeak
        if (w)
            await net.postWork(ns, 'weaken.js', t, Math.ceil(w / ns.weakenAnalyze(1, 1)), 0, 'prepare-0')

        const md = t.moneyDelta
        if (md) {
            const n = Math.ceil(ns.growthAnalyze(t.name, t.growthNeeded + 0.1, 1) + 0.1)
            const dw = ns.growthAnalyzeSecurity(n) + 0.1
            await net.postWork(ns, 'grow.js', t, n)
            await net.postWork(ns, 'weaken.js', t, Math.ceil(dw / ns.weakenAnalyze(1, 1)), 100, 'prepare-1')
        }
        
        if (!w && !md)
            ns.tprint(`${t.name} prepared!`)
    }
}

async function pump(ns: NS, [host, target]: Args) {
    let tar: Target[]
    if (target === 'all')
        tar = net.allHosts.map(h => h.toTarget(ns))
    else
        tar = [net.upsertTarget(ns, target)]
    const h = net.upsertHost(ns, host)
    for (const t of tar) {
        if (net.pumped.has(t.name))
            continue

        if (!t.isPrepared) {
            if (target !== 'all')
                ns.tprint(t.name + ' not prepared!')
            continue
        }
        
        ns.tprint('Pump ' + t.name)
        await exec(ns, [h.name, 'pump.js', t.name], 1)
    }
}

class Host {
    totalRam = 1
    usedRam = 0
    
    get freeRam() {
        return Math.max(this.totalRam - this.usedRam, 0)
    }

    constructor(readonly name: string, ns: NS) {
        ns.getServerSecurityLevel(name)
    }

    update(ns: NS): this {
        this.totalRam = ns.getServerMaxRam(this.name)
        this.usedRam = ns.getServerUsedRam(this.name)

        if (this.name === 'home')
            this.usedRam = this.usedRam > this.totalRam / 2 ? this.totalRam : this.totalRam / 2

        return this
    }

    toTarget(ns: NS): Target {
        return new Target(this.name, ns).update(ns)
    }
}

class Target {
    curSec = 10
    minSec = 3

    curMon = 100
    maxMon = 200

    constructor(readonly name: string, ns: NS) {
        ns.getServerSecurityLevel(name)
    }

    update(ns: NS): this {
        this.curSec = ns.getServerSecurityLevel(this.name)
        this.minSec = ns.getServerMinSecurityLevel(this.name)

        this.curMon = ns.getServerMoneyAvailable(this.name)
        this.maxMon = ns.getServerMaxMoney(this.name)

        return this
    }

    get needWeak() {
        return this.curSec - this.minSec
    }

    get moneyDelta() {
        return this.maxMon - this.curMon
    }

    get growthNeeded() {
        return this.maxMon / this.curMon
    }

    get isPrepared() {
        return !this.isUseless && !this.needWeak && !this.moneyDelta
    }

    get isUseless() {
        return this.maxMon < 26_000_000
    }
}

class Net {
    hosts = new Map<string, Host>()
    targets = new Map<string, Target>()
    pumped = new Set<string>()
    preparing = new Set<string>()

    update(ns: NS) {
        const hosts = getHosts(ns, 'all')
        for (const h of hosts)
            this.upsertHost(ns, h)

        for (const t of this.targets.values()) 
            t.update(ns)


        const pumps = allHosts(ns).filter(h => h.startsWith('p-')).concat('home')
        this.pumped = new Set(pumps.flatMap(p => ns.ps(p).filter(p => p.filename === 'pump.js').map(p => p.args[0])))


        this.preparing = new Set(hosts.flatMap(p => ns.ps(p)
            .filter(p => p.filename === 'weaken.js' && !!p.args.find(a => a.toString().includes('prepare-')))
            .map(p => p.args[0])))
    }

    upsertHost(ns: NS, h: string): Host {
        return upsertMap(this.hosts, h, () => new Host(h, ns)).update(ns)
    }

    upsertTarget(ns: NS, h: string): Target {
        return upsertMap(this.targets, h, () => new Target(h, ns)).update(ns)
    }

    get allHosts() {
        return [...this.hosts.values()]
    }

    getHosts(str: string) {
        if (str === 'all')
            return this.allHosts

        const host = this.hosts.get(str)
        if (!host)
            throw new Error('There is no host ' + str)
        return [host]
    }

    async postWork(ns: NS, script: string, target: Target, n: number, ...args: Array<string | number>) {
        ns.tprint([script, target, n, ...args].join(' '))
        const t = await exec(ns, ['all', script, target.name, ...args], n)
        if (t < n)
            ns.tprint('Need more...')
    }
}

function upsertMap<T>(map: Map<String, T>, key: string, create: () => T): T {
    let t = map.get(key)
    if (!t) {
        t = create()
        map.set(key, t)
    }
    return t
}

const net = new Net()
