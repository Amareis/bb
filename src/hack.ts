import { NS } from "Bitburner";

export async function main(ns: NS) {
    const [target, sTime] = ns.args as [string, number?]
    if (sTime)
        await ns.sleep(sTime)
    await ns.hack(target)
}