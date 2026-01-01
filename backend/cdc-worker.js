const { Kafka } = require('kafkajs');
const log4js = require('log4js');

// Updated log4js configuration to use a more compact format
log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'messagePassThrough' } } },
  categories: { default: { appenders: ['out'], level: 'info' } }
});
const logger = log4js.getLogger('shviki-cdc');

// Adjusted Kafka configuration to include connection and request timeouts
const kafka = new Kafka({
  clientId: 'cdc-worker',
  brokers: ['kafka:9092'],
  connectionTimeout: 10000,
  requestTimeout: 30000
});

const consumer = kafka.consumer({ groupId: 'cdc-group' });

//15-second delay ensures Kafka and TiCDC are fully ready (topic created, coordinator initialized)


const start = async () => {
  try {
    // 15-second delay for Kafka/TiCDC full initialization
    console.log(">>> Waiting 15 seconds for Kafka and TiCDC to be fully ready...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log(">>> Connecting to Kafka...");
    await consumer.connect();

    console.log(">>> Subscribing to 'db-changes'...");
    await consumer.subscribe({ topic: 'db-changes', fromBeginning: true });

    console.log(">>> CDC Worker successfully started — listening for real-time database changes");

    await consumer.run({
      autoCommit: true,
      eachMessage: async ({ message }) => {
        try {
          const event = JSON.parse(message.value.toString());

          const logData = {
            timestamp: new Date().toISOString(),
            cdc_event_type: event.type || 'UNKNOWN',
            database: event.database || null,
            table: event.table || null,
            data: event.data || null,
            old: event.old || null,
            tidb_commit_ts: event._tidb?.commitTs || null
          };

          logger.info(JSON.stringify(logData));
        } catch (err) {
          console.error("Failed to parse CDC message:", err.message);
        }
      },
    });
  } catch (err) {
    console.error("CDC Worker error:", err.message);
    try {
      await consumer.disconnect();
    } catch (e) {}
    console.log(">>> Restarting in 5 seconds...");
    setTimeout(start, 5000);
  }
};

start();