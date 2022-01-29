import { NS } from "Bitburner"

export async function main(ns: NS) {
    const host = ns.args[0] as string
    while (ns.getServerMoneyAvailable(host) > 1_000) {
      await ns.sleep(100)
      await ns.weaken(host)
    }
  }
