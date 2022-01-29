import { NS } from "Bitburner"
import { exec } from "./exec.js"

export async function main(ns: NS) {
  await exec(ns, ns.args, 10000)
}
