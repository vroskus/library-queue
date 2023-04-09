// Helpers
import {
  connect,
} from 'amqplib';
import {
  sleep,
} from '@vroskus/library-helpers/dist/node';

// Types
import type {
  $Channel,
  $Connection,
} from './types';

const tries = 100;

export const openConnection = async (
  host: string,
  purpose: string,
): Promise<$Connection> => {
  let connection: $Connection | null = null;
  let error: Error | null = null;

  for (let t = 0; t < tries; t += 1) {
    if (connection === null) {
      try {
        connection = await connect(host);

        // eslint-disable-next-line no-console
        console.info(
          'Queue new connection',
          purpose,
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.info(
          'Queue unable to connect',
          purpose,
          error,
          `try: ${t}`,
        );

        error = err;

        await sleep(1000);
      }
    }
  }

  if (connection !== null) {
    return connection;
  }

  throw error;
};

export const openChannel = (
  connection: $Connection,
  purpose: string,
): Promise<$Channel> => new Promise((resolve, reject) => {
  connection.createChannel().then(
    (channel: $Channel) => {
    // eslint-disable-next-line no-console
      console.info(
        'Queue new channel created',
        purpose,
      );

      resolve(channel);
    },
    (error) => {
    // eslint-disable-next-line no-console
      console.info(
        'Queue unable to create channel',
        purpose,
        error,
      );

      reject(error);
    },
  );
});
