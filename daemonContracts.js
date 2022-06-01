/** @param {NS} ns */
import { buildServerMap, refreshServers } from '/lib/libExternalServers.ns';
import * as libContracts from '/lib/libContracts.ns';

export async function main(ns) {
	ns.disableLog("ALL");

	var mServers = buildServerMap(ns);
	mServers = new Map(Array.from(mServers).sort((a,b) => {
		return a[1].iNumContracts() - b[1].iNumContracts();
	}));

	var oHandlers = {
		"Generate IP Addresses" : (input) => { return libContracts.GenerateIPAddresses(input); },
	};
	
	while (true) {
		ns.clearLog();
		
		mServers.forEach((oServer, sHostname) => {
			var iContractCount = oServer.iNumContracts();
			if (iContractCount > 0) {
				var aContracts = ns.ls(sHostname, ".cct");
				for (var iContract = 0; iContract < aContracts.length; iContract++) {
					var sContractType = ns.codingcontract.getContractType(aContracts[iContract], sHostname);
					var sContractFile = aContracts[iContract];
					ns.printf("%s: %s => %s", sHostname, sContractFile, sContractType);
					if (sContractType in oHandlers) {
						var iNumTries = ns.codingcontract.getNumTriesRemaining(sContractFile, sHostname);
						if (iNumTries > 3) {
							var sInput = ns.codingcontract.getData(sContractFile, sHostname);
							ns.printf("Attempting, %d tries remaining:", iNumTries);
							ns.print(ns.codingcontract.getDescription(sContractFile, sHostname));
							ns.printf(" >> Input: %s", sInput);
							var sResult = oHandlers[sContractType].call(ns, sInput);
							ns.printf(" >> Output: %s", sResult);
							var sReward = ns.codingcontract.attempt(sResult, sContractFile, sHostname,{ returnReward: true });
							if (sReward.length > 0) {
								ns.printf(" >> success! Reward: %s", sReward);
							}
							else {
								ns.print(" >> Failed attempt.");
							}
						}
					}
				}
			}
		});

		await ns.sleep(20000);
	}
}
