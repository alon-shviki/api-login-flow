const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'shviki-worker',
  brokers: ['kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'login-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-logins', fromBeginning: true });

  console.log(">>> Kafka Worker Listening for Login Events...");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      console.log("====================================");
      console.log("[KAFKA EVENT RECEIVED]");
      console.log(`User: ${event.userId}`);
      console.log(`Action: ${event.action}`);
      console.log(`Time: ${event.timestamp}`);
      console.log("====================================");
    },
  });
};

run().catch(console.error);