const { ReClusterManager, HeartbeatManager, messageType } = require('discord-hybrid-sharding');
const { avonlodepe } = require('./cluster');
const { LoadBalancer } = require('./.gg/coderz');
const config = require('./Config');

const manager = new avonlodepe(`./source/manasontop.js`, {
    totalShards: 1,
    shardsPerClusters: 1,
    totalClusters: 1,
    mode: 'process',
    token: config.token.manaspapa ?? config.token.manaspapa2,
    restarts: {
        max: 10,
        interval: 60000 * 60
    },
    queue: {
        auto: true,
    },
});

manager.extend(
    new ReClusterManager(),
    new HeartbeatManager({
        interval: 2000,
        maxMissedHeartbeats: 5,
    })
);
const loadBalancer = new LoadBalancer(manager);
loadBalancer.on('rebalance', (source, target) => {
    console.log(`Rebalancing: Moving load from Cluster ${source.id} to Cluster ${target.id}`);
    source.send({ content: 'Rebalancing to Cluster ' + target.id });
    async function moveShards() {
        const shards = await source.getShards();
        for (const shard of shards) {
            await source.moveShard(shard, target);
        }
    }
    moveShards().then(() => {
        console.log(`Rebalancing complete: Cluster ${source.id} -> Cluster ${target.id}`);
    }).catch(err => {
        console.error(`Failed to rebalance Cluster ${source.id} -> Cluster ${target.id}:`, err);
    });
});

manager.on('clusterCreate', cluster => {
    cluster.on('message', message => {
        console.log(`Cluster ${cluster.id} received message: ${message.content}`);
        if (message._type !== messageType.CUSTOM_REQUEST) return;
        message.reply({ content: 'Hello from the manager!' });
    });
    cluster.on('error', error => {
        console.error(`Error in Cluster ${cluster.id}:`, error);
    });
    setInterval(() => {
        cluster.send({ content: 'Heartbeat from manager' });
        cluster.request({ type: 'STATS_REQUEST' })
            .then(stats => {
                manager.stats.set(cluster.id, stats);
                console.log(`Cluster ${cluster.id} stats:`, stats);
            })
            .catch(err => console.error(`Failed to get stats from Cluster ${cluster.id}:`, err));
    }, 10000);
});

manager.on('debug', message => {
    console.debug(`[Manager Debug] ${message}`);
});
async function run() {
    try {
        await manager.spawn({ delay: 7000, timeout: -1 });
        manager.queue.next();
        manager.queue.start();
        setInterval(async () => {
            await manager.collectStats();
            console.log('Global stats:', manager.globalStats);
            loadBalancer.balance();
        }, 30000);
    } catch (error) {
        console.error('Failed to spawn clusters:', error);
        process.exit(1);
    }
}
run();
