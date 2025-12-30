const { Kafka } = require('kafkajs');

// 1. KAFKA CONFIGURATION
const kafka = new Kafka({
  clientId: 'shviki-fitness-worker',
  brokers: ['kafka:9092']
});

// Consumers must belong to a "Group"
const consumer = kafka.consumer({ groupId: 'fitness-monitoring-group' });

const runWorker = async () => {
  console.log(">>> Worker initializing...");
  
  await consumer.connect();
  // Subscribe to the topic created by the API
  await consumer.subscribe({ topic: 'user-logins', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const payload = JSON.parse(message.value.toString());
      
      console.log(`\n====================================`);
      console.log(`[KAFKA WORKER] New Event Received!`);
      console.log(`TOPIC: ${topic}`);
      console.log(`USER: ${payload.email}`);
      console.log(`TIME: ${payload.timestamp}`);
      console.log(`ACTION: ${payload.action}`);
      console.log(`====================================\n`);

    },
  });
};

runWorker().catch(err => {
  console.error("!!! Worker Crash:", err.message);
  process.exit(1);
});