import { NS } from 'Bitburner'
import {getHosts} from '/lib/utils.js'

export async function main(ns: NS) {
    let [h = 'all'] = ns.args as string[]
    const hosts = getHosts(ns, h)

    for (const host of hosts) {
        if (host === 'home')
            continue
        ns.killall(host)
        await ns.sleep(50)
    }
    ns.tprintf(`killall ${hosts.length} hosts!`)
    if (h === 'all')
        ns.killall('home')
}