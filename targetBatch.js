/** @param {NS} ns */
export async function main(ns) {
	var ua = ns.flags([
		["host", ns.getHostname()],
		["target", ns.getHostname()],
		["pct", 0.30],
	]);

	ns.disableLog("ALL");
	ns.clearLog();

	var oWeakenInfo = weakenToZero(ns, ua);
	await ns.sleep(oWeakenInfo.time + 100);

	var oGrowInfo = growToFull(ns, ua);
	await ns.sleep(oGrowInfo.time + 100);

	oWeakenInfo = weakenToZero(ns, ua);
	await ns.sleep(oWeakenInfo.time + 100);

	var oHackInfo = hackByPct(ns, ua);
	await ns.sleep(oHackInfo.time + 100);

	oGrowInfo = growToFull(ns, ua);
	await ns.sleep(oGrowInfo.time + 100);

	oWeakenInfo = weakenToZero(ns, ua);
	await ns.sleep(oWeakenInfo.time + 100);

	var iLastGrowThreads = oGrowInfo.threads;
	var iLastWeakenThreads = oWeakenInfo.threads;

	var iIteration = 0;
	var iAverageCount = 50;
	var aWeaken = [iLastWeakenThreads];
	var aGrow = [iLastGrowThreads];
	while (true) {
		var iWait = 2000;
		iIteration += 1;
		if (iIteration % 10 == 0) { ns.clearLog(); }
		ns.printf("<<<< ITERATION %d >>>>", iIteration);

		oHackInfo = hackByPct(ns, ua);
		oGrowInfo = growToFull(ns, ua, iLastGrowThreads);
		oWeakenInfo = weakenToZero(ns, ua, iLastWeakenThreads);

		await ns.sleep(oHackInfo.time + 100);
		while (stillRunning(ns, ua, "targetHack.js")) {
			ns.print("hack still running... sleep 100.");
			await ns.sleep(100);
		}
		iLastGrowThreads = getGrowThreads(ns, ua) * 1.25;

		while (stillRunning(ns, ua, "targetGrow.js")) {
			ns.print("grow still running... sleep 100.");
			await ns.sleep(100);
		}
		iLastWeakenThreads = getWeakenThreads(ns, ua) * 1.10;

		while (stillRunning(ns, ua, "targetHack.js") || stillRunning(ns, ua, "targetGrow.js") || stillRunning(ns, ua, "targetWeaken.js")) {
			ns.print("Scripts still running.... sleeping.");
			await ns.sleep(500);
		}

		await ns.sleep(iWait);
	}
}

function weakenToZero(ns, ua, threads) {
	var iWeakenTime = ns.getWeakenTime(ua.target);
	var iNumWeakenThreads = threads || getWeakenThreads(ns, ua);
	ns.printf("Weaken %s from %s using %d threads; should take %d ms", ua.target, ua.host, iNumWeakenThreads, iWeakenTime);
	ns.exec("targetWeaken.js", ua.host, iNumWeakenThreads, "--target", ua.target);

	return { "time" : iWeakenTime, "threads" : iNumWeakenThreads };
}

function getWeakenThreads(ns, ua) {
	var fWeakenDecrease = ns.weakenAnalyze(1, ns.getServer(ua.host).cpuCores);
	var fCurSecurity = ns.getServerSecurityLevel(ua.target);
	var fMinSecurity = ns.getServerMinSecurityLevel(ua.target);
	var iNumWeakenThreads = Math.max(1, Math.ceil((fCurSecurity - fMinSecurity) / fWeakenDecrease));

	return iNumWeakenThreads;
}

function growToFull(ns, ua, threads) {
	var iGrowTime = ns.getGrowTime(ua.target);
	var iNumGrowThreads = threads || getGrowThreads(ns, ua);
	ns.printf("Grow %s from %s using %d threads; should take %d ms", ua.target, ua.host, iNumGrowThreads, iGrowTime);
	ns.exec("targetGrow.js", ua.host, iNumGrowThreads, "--target", ua.target);

	return { "time" : iGrowTime, "threads" : iNumGrowThreads };
}

function getGrowThreads(ns, ua) {
	var fCurMoney = ns.getServerMoneyAvailable(ua.target);
	var fMaxMoney = ns.getServerMaxMoney(ua.target);
	var fPctMoney = fCurMoney / fMaxMoney;
	var fGrowFactor = 1 / fPctMoney;
	var iNumGrowThreads = Math.max(1, ns.growthAnalyze(ua.target, fGrowFactor, ns.getServer(ua.host).cpuCores));

	return iNumGrowThreads;
}

function hackByPct(ns, ua) {
	var iHackTime = ns.getHackTime(ua.target);
	var fHackPct = ns.hackAnalyze(ua.target);
	var iNumHackThreads = Math.ceil(ua.pct / fHackPct);
	ns.printf("Hack %s from %s using %d threads; should take %d ms", ua.target, ua.host, iNumHackThreads, iHackTime);
	ns.exec("targetHack.js", ua.host, iNumHackThreads, "--target", ua.target);
	
	return { "time" : iHackTime, "threads" : iNumHackThreads };
}

function arraySum(times) {
	var iSum = 0;
	times.forEach((t) => { iSum += t; });
	return iSum;
}

function stillRunning(ns, ua, sFilename) {
	var aRunning = ns.ps(ua.host);
	var bRunning = false;
	aRunning.forEach((oProcess) => {
		if (oProcess.filename === sFilename) {
			oProcess.args.forEach((arg) => {
				if (arg === ua.target) { 
					bRunning = true;
					return true;
				}
			});
		}
	});

	return bRunning;
}
