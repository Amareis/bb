import { NS } from "Bitburner";

export async function main(ns: NS) {
    const [file] = ns.args as string[]
    ns.rm(file)
}