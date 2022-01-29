import {NS} from "Bitburner";
import {f$, sec, table} from "/lib/utils.js";

export async function main(ns: NS) {
    const h = ns.args[0] as string
    const res = {
        host: h,
        money: f$(ns.getServerMoneyAvailable(h)) + ' / ' + f$(ns.getServerMaxMoney(h)),
        hack_time: sec(ns.getHackTime(h)),
        hack_chance: (ns.hackAnalyzeChance(h)*100).toFixed(0) + '%',
        weak_time: sec(ns.getWeakenTime(h)),
        security: ns.getServerSecurityLevel(h).toFixed(1) + ' > ' + ns.getServerMinSecurityLevel(h),
        ram: ns.getServerUsedRam(h) + ' / ' + ns.getServerMaxRam(h),
    }
    ns.tprint('\n' + table(Object.entries(res)))
}

export function autocomplete(data: any) {
    return data.servers
}