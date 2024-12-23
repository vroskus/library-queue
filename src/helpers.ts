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
const zeroValue: number = 0;
const oneValue: number = 1;
const sleepDuration: number = 1000;

export const openConnection = async (
  host: string,
  purpose: string,
): Promise<$Connection> => {
  let connection: $Connection | null = null;
  let error: Error | null = null;

  for (let t = zeroValue; t < tries; t += oneValue) {
    if (connection === null) {
      try {
        connection = await connect(host);

        console.info(
          'Queue new connection',
          purpose,
        );
      } catch (err) {
        console.info(
          'Queue unable to connect, retrying...',
          purpose,
          error,
          `try: ${t}`,
        );

        error = err as Error;

        await sleep(sleepDuration);
      }
    }
  }

  if (connection !== null) {
    return connection;
  }

  throw Error('Queue was unable to connect');
};

export const openChannel = async (
  connection: $Connection,
  purpose: string,
): Promise<$Channel> => {
  try {
    const channel = await connection.createChannel();

    console.info(
      'Queue new channel created',
      purpose,
    );

    return channel;
  } catch (error) {
    console.info(
      'Queue unable to create channel',
      purpose,
      error,
    );

    throw error;
  }
};
