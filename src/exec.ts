import { NS } from 'Bitburner'
import {getHosts} from '/lib/utils.js'

export async function exec(ns: NS, args = ns.args, times = 1): Promise<number> {
    const [hostStr, script, ...sargs] = args as string[]

    const hosts = getHosts(ns, hostStr)
    
    let t = 0
    let hn = 0
    for (const host of hosts) {
        hn++
        t += await runScript(ns, host, script, sargs, times - t)
        if (t >= times)
            break
        await ns.sleep(50)
    }
    if (times && t < times)
        ns.tprint(`Cannot run all ${times} tasks!`)
    ns.tprint(`Ran ${script} on ${hn} hosts in ${t} instances`)
    return t
}

async function runScript(ns: NS, host: string, script: string, args: any[], times = 1): Promise<number> {
    if (!ns.serverExists(host)) {
        ns.alert('There is no host ' + host)
        return 0
    }
    const thisHost = ns.getHostname()

    if (!ns.fileExists(script, thisHost)) {
        ns.alert('There is no script ' + script)
        return 0
    }

    const mem = ns.getScriptRam(script)
    let total = ns.getServerMaxRam(host)
    if (host === 'home')
        total /= 2
    const used = ns.getServerUsedRam(host)

    await ns.scp(script, thisHost, host)

    const threads = Math.min(Math.floor((total - used) / mem), times)
    if (threads < 1)
        return 0

    if (!ns.exec(script, host, threads, ...args)) {
        ns.alert('Run error! ' + script + '@' + host)
        return 0
    }
    return threads
}
