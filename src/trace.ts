import {NS} from "Bitburner"

export async function main(ns: NS) {
    const [t] = ns.args as string[]
    const host = ns.getHostname()
    const {hops} = scanDeep(ns, host, new Set([host]), t)!
    const res = hops.map(h => `connect ${h}`).join('; ')
    const d = globalThis['document']
    setTimeout(() => (d.getElementById('terminal-input') as HTMLInputElement).value = res, 100)
}

type Hop = {host: string, hops: string[]}

function scanDeep(ns: NS, host: string, excluded: Set<string>, target: string): Hop | null {
    const neig = ns.scan(host).filter(h => !excluded.has(h))
    if (!neig.length)
        return null
    if (neig.includes(target))
        return {host, hops: [target]}
    
    const e = new Set([...excluded].concat(neig))
    const hops = neig.map(n => scanDeep(ns, n, e, target)).filter((v): v is Hop => !!v)
    if (!hops.length)
        return null

    const f = hops.sort((a, b) => a.hops.length - b.hops.length)[0]
    return {
        host,
        hops: [f.host, ...f.hops]
    }
}

export function autocomplete(data: any) {
    return data.servers
}