import { NS } from "Bitburner";

const stealPercentage = 7;

export async function main(ns: NS) {
	const [target] = ns.args as string[]
	const worker = ns.getHostname()
 
    var fileList = ["hack.js", "grow.js", "weaken.js"]
    var hRam = ns.getScriptRam("hack.js");
	const pRam = ns.getScriptRam("pump.js")
    const gRam = ns.getScriptRam("grow.js");
    const wRam = ns.getScriptRam("weaken.js");
    const workerRam = ns.getServerMaxRam(worker) - pRam;

	var hThreads = fetchHackThreads(ns, target);
	var w1Threads = fetchWeakenThreads(ns.hackAnalyzeSecurity(hThreads));
	var gThreads = fetchGrowThreads(ns, target);
	var w2Threads = fetchWeakenThreads(ns.growthAnalyzeSecurity(gThreads));

    await ns.scp(fileList, "home", worker);

	while (true) {
		let totalRam = hRam * hThreads + gRam * gThreads + (w1Threads + w2Threads) * wRam;
		if (totalRam > workerRam) {
			ns.tprint('Has no ram on worker! Needed ' + totalRam)
			return
		}

		// only continue if we can at least run one iteration, 
		// this is kinda redundant with the line above but I found to still need it 
		let iterations = Math.floor(workerRam / totalRam)
		if (iterations < 1) {
			ns.tprint('Has no ram on worker!')
			return
		}

		const w = ns.getWeakenTime(target)
		const iterTime = 500
		// only run as many iterations as we can start while the first weaken in a run executes
		// as not to still spawn more processes while the earlier ones already resolve
		if (((iterations * iterTime)) > w - 1500) {
			iterations = Math.floor((w - 1500) / iterTime) - 2;
		}

		ns.print("Running " + iterations + " iterations...");
		for (var i = 1; i <= iterations; i++) {
			ns.exec("hack.js", worker, hThreads, target, fetchHackSleep(ns, target), i);
			ns.exec("weaken.js", worker, w1Threads, target, 0, i);
			ns.exec("grow.js", worker, gThreads, target, fetchGrowSleep(ns, target), i);
			ns.exec("weaken.js", worker, w2Threads, target, 200, i);
			await ns.sleep(300);
		}

		//make sure the last iteration has run through before restarting the loop
		await ns.sleep(w + 1000);
	}
}


// calculate threads needed for hack operation
function fetchHackThreads(ns: NS, target: string) {
    let pPerThread = ns.hackAnalyze(target);
    let threadCount = Math.floor((stealPercentage / 100) / pPerThread);
    return threadCount;
}
 
// calculate threads needed for growth operation
function fetchGrowThreads(ns: NS, target: string) {
    // 0.5 added as safety measure
    let threadCount = Math.ceil(ns.growthAnalyze(target, (100 / (100 - stealPercentage)) + 0.1));
    return threadCount;
}
 
// calculate threads needed for weaken operation
function fetchWeakenThreads(amount: number) {
    //+1 or we could be left with less than 0,05 of security difference left...
    let threadCount = Math.ceil(amount / 0.05) + 1
    return threadCount;
}
 
function fetchHackSleep(ns: NS, target: string) {
    var sTime = (ns.getWeakenTime(target) - ns.getHackTime(target)) - 100;
    return sTime;
}
 
function fetchGrowSleep(ns: NS, target: string) {
    var sTime = (ns.getWeakenTime(target) - ns.getGrowTime(target)) + 100;
    return sTime;
}
 