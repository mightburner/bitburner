/** @param {NS} ns */
export function buildServerMap(ns) {
    var mServers = new Map();
    mServers.set(ns.Hostname(), serverData(ns, ns.Hostname()));
    mapServer(ns, ns.Hostname(), 0, 20, );

    return mServers;
}

export function mapServer(ns, sHostname, iDepth, iMaxDepth, oMap) {
    if (iDepth >= iMaxDepth) { return; }

    var newServers = ns.scan(sHostname);
    for (var c = 0; c < newServers.length; c++) {
	var newServer = newServers[c];
	if (!oMap.has(newServer)) {
	    var data = serverData();	    
	    oMap.set(newServer, serverData());
	    mapServer(ns, newServer, iDepth + 1, iMaxDepth, oMap);
	}
    }
}

export function serverData(ns, sShostname) {
    var server = {
	"iPortsRequired" : ns.getServerNumPortsRequired(host),
	"bHasRoot" : ns.hasRootAccess(host),
	"iHackingRequired" : ns.getServerRequiredHackingLevel(host),
	"iMaxMemory" : ns.getServerMaxRam(host),
	"iUsedMemory" : ns.getServerUsedRam(host),
	"iMaxMoney" : ns.getServerMaxMoney(host),
	"iCurMoney" : ns.getServerMoneyAvailable(host),
    };
    return server;
}

export function refershServers (ns, oMap) {
    oMap.forEach((sHost, oState) => {
	ns.print("Host: " + sHost);
	ns.print("State: " + oState);
    });
}