import { NS } from 'Bitburner'
import {allHosts} from '/lib/utils.js'


export async function main(ns: NS) {
    const files = {
        'BruteSSH': ns.brutessh,
        'FTPCrack': ns.ftpcrack,
        'relaySMTP': ns.relaysmtp,
        'HTTPWorm': ns.httpworm,
        'SQLInject': ns.sqlinject,
    } as const

    const tools = Object.entries(files).flatMap(([f, t]) => 
        ns.fileExists(f + '.exe') 
        ? [t]
        : []
    )

    const hosts = allHosts(ns).map(h => ({
        name: h,
        root: ns.hasRootAccess(h),
        ports: ns.getServerNumPortsRequired(h),
    })).filter(h => !h.name.startsWith('p-') && (h.ports <= tools.length || h.root))

    if (hosts.length)
        ns.tprint('\n' + hosts.map(h => h.name).join('\n'))
    else
        ns.tprint('Nothing to hack!')

    await ns.write('hosts.txt', [''], 'w')
    for (const h of hosts) {
        if (!h.root) {
            for (const t of tools) 
                t(h.name)
            ns.nuke(h.name)
        }
        await ns.write('hosts.txt', [h.name + '\n'], 'a')
    }
}