import { NS } from 'Bitburner'
import {f$} from '/lib/utils.js'

export async function main(ns: NS) {
    const [n, ramS] = ns.args as string[]
    const ram = Number(ramS)
    if (ns.serverExists(n)) {
        ns.tprint('Server exists')
        return
    }
    const cost = f$(ns.getPurchasedServerCost(ram))

    const buy = await ns.prompt(`Buy server "${n}" with ${ram} GB for ${cost}?`)
    if (buy)
        ns.purchaseServer(n, ram)
}