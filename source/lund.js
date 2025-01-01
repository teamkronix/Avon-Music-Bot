const { ClusterManager } = require('discord-hybrid-sharding');

class manasbhaiontop extends ClusterManager {
    constructor(file, options) {
        super(file, options);
        this.stats = new Map();
        this.globalStats = {
            cpu: 0,
            ram: 0,
            uptime: 0,
        };
    }
    async collectStats() {
        const promises = [];
        for (const [id, cluster] of this.clusters) {
            promises.push(
                cluster.request({ type: 'STATS_REQUEST' })
                    .then(stats => this.stats.set(id, stats))
                    .catch(err => console.error(`Failed to collect stats from cluster ${id}:`, err))
            );
        }
        await Promise.all(promises);
        this.updateGlobalStats();
    }
    updateGlobalStats() {
        let totalCPU = 0;
        let totalRAM = 0;
        let totalUptime = 0;
        for (const stats of this.stats.values()) {
            totalCPU += stats.cpu;
            totalRAM += stats.ram;
            totalUptime += stats.uptime;
        }
        this.globalStats = {
            cpu: totalCPU / this.clusters.size,
            ram: totalRAM,
            uptime: totalUptime / this.clusters.size,
        };
    }
}

module.exports = { manasbhaiontop };