import { app } from '@azure/functions';

app.storageQueue('abandonedCartWorker', {
  queueName: 'jobs',
  connection: 'QUEUE_CONN',
  handler: async () => {
    // TODO: implement abandoned cart reminders
  },
});
