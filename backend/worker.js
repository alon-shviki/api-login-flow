const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'shviki-worker',
  brokers: ['kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'login-group' });

// CHANGED: Added full retry logic (same pattern as cdc-worker)

const start = async () => {
  try {
    console.log(">>> Connecting to Kafka...");
    await consumer.connect();

    console.log(">>> Subscribing to 'user-logins'...");
    await consumer.subscribe({ topic: 'user-logins', fromBeginning: true });

    console.log(">>> Kafka Worker Listening for Login Events...");

    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value.toString());
        console.log("====================================");
        console.log("[KAFKA EVENT RECEIVED]");
        console.log(`User: ${event.userId || 'unknown'}`);
        console.log(`Action: ${event.action}`);
        if (event.attemptedEmail) {
          console.log(`Attempted Email: ${event.attemptedEmail}`);
        }
        console.log(`Time: ${event.timestamp}`);
        console.log(`IP: ${event.ipAddress || 'unknown'}`);
        console.log("====================================");
      },
    });
  } catch (err) {
    console.error("Login Worker error:", err.message);
    try {
      await consumer.disconnect();
    } catch (e) {}
    console.log(">>> Restarting in 5 seconds...");
    setTimeout(start, 5000);
  }
};

start();