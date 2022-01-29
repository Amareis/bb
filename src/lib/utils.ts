import { NS } from "Bitburner"
import { ReadText } from "/lib/Helpers"

export function getHosts(ns: NS, hostStr: string) {
    if (hostStr === 'all') {
        const hosts = ReadText.readNonEmptyLines(ns, 'hosts.txt').concat('home')
        return hosts.sort((h1, h2) => ns.getServerMaxRam(h2) - ns.getServerMaxRam(h1))
    } else 
        return [hostStr]
}

export function f$(n: number): string {
    const a = {'k': 0, 'm': 0, 'b': 2, 't': 3}
    let t = n
    for (const [k, x] of Object.entries(a)) {
        t = t / 1000
        const f = Math.floor(t)
        if (f > 0 && f < 1000)
            return k + t.toFixed(x)
    }
    return '$' + Math.round(n)
}

export function allHosts(ns: NS): string[] {
    const res = new Set<string>()
    const toProcess = new Set(['home'])

    for (const host of toProcess) {
        const n = ns.scan(host)
        for (const h of n) {
            if (!res.has(h)) {
                res.add(h)
                toProcess.add(h)
            }
        }
    }
    res.delete('home')
    res.delete('darkweb')
    return [...res]
}

export function sec(n: number) {
    const s = (n/1000)
    if (s > 60)
        return Math.floor(s/60) + 'm ' + Math.ceil(s) % 60 + 's'
    return Math.ceil(s) + 's'
}

type El = string | number

function arrWidths(arr: El[]) {
    return arr.map(s => s.toString().length)
}

export function table(arr: El[][], {fill = ' ', sep = ' '}: {fill?: string, sep?: string} = {}) {
    const widths = arr.map(arrWidths).reduce((acc, el) => 
        (el.length > acc.length ? el : acc).map((_, i) => Math.max(el[i] ?? 0, acc[i] ?? 0))
    )
    const f = (arr: El[]) => arr.map((e, i) => e.toString().padEnd(widths[i], fill)).join(sep)
    return arr.map(f).join('\n')
}