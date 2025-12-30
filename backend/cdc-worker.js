const { Kafka } = require('kafkajs');
const log4js = require('log4js');

log4js.configure({
  appenders: {
    out: { type: 'stdout', layout: { type: 'messagePassThrough' } }
  },
  categories: {
    default: { appenders: ['out'], level: 'info' }
  }
});
const logger = log4js.getLogger('shviki-cdc');

const kafka = new Kafka({
  clientId: 'cdc-worker',
  brokers: ['kafka:9092'],
  retry: {
    initialRetryTime: 300,
    retries: 10
  }
});

const consumer = kafka.consumer({ groupId: 'cdc-group' });

const run = async () => {
  while (true) {
    try {
      // Ensure clean state
      try {
        await consumer.disconnect();
      } catch (e) {
        // Ignore if already disconnected
      }

      console.log(">>> Connecting to Kafka...");
      await consumer.connect();

      console.log(">>> Subscribing to topic 'db-changes'...");
      await consumer.subscribe({ topic: 'db-changes', fromBeginning: false });

      console.log(">>> CDC Worker Listening for Database Change Events on topic 'db-changes'...");

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
            console.error("Raw:", message.value.toString());
          }
        },
      });

      // If we exit run() unexpectedly
      console.log("Consumer run stopped. Restarting in 5 seconds...");
    } catch (err) {
      console.error("CDC Worker error — retrying in 5 seconds:", err.message);
    }

    // Always wait before retry
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};

run();