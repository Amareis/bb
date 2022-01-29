import { NS } from "Bitburner";
import { allHosts, table } from "/lib/utils";

type Res = {host: string, files: string[]}

export function find(ns: NS, args = ns.args) {
    const type = args[0] as string
    const hosts = allHosts(ns)
    const res: Res[] = []
    for (const host of hosts) {
        const files = ns.ls(host).filter(f => type ? f.endsWith(type) : !f.endsWith('.js'))
        if (files.length)
            res.push({host, files})
    }
    if (args === ns.args && res.length)
        ns.tprintf(table(res.map(e => [e.host, ...e.files])))
    return res
}

export {find as main}