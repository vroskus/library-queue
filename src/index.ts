// Helpers
import {
  getDuration,
  makeCode,
} from '@vroskus/library-helpers/dist/node';
import {
  openChannel,
  openConnection,
} from './helpers';

// Types
import type {
  $Channel,
  $Connection,
  $Message,
  $Config as Config,
} from './types';

export type $Config = Config;

class Queue<
C extends Config,
T extends Record<string, string>,
P extends Record<string, unknown>,
> {
  host: string;

  connection: $Connection | null;

  type: T;

  mockConsumers: Record<T[keyof T], (arg0: P[T[keyof T]]) => unknown>;

  constructor({
    host,
  }: C, type: T) {
    this.host = host;
    this.type = type;
    // @ts-expect-error mocks
    this.mockConsumers = {
    };

    this.connection = null;
  }

  async connect(type: T[keyof T]): Promise<void> {
    if (this.host !== '') {
      this.connection = await openConnection(
        this.host,
        type,
      );

      this.connection.on(
        'close',
        async () => {
          console.info(
            'Queue connection closed',
            type,
          );

          this.connection = await openConnection(
            this.host,
            type,
          );
        },
      );
    }
  }

  async initConsumer<QET extends T[keyof T]>({
    action,
    requeue,
    type,
  }: {
    action: (params: P[QET]) => Promise<void>;
    requeue?: boolean;
    type: QET;
  }): Promise<void> {
    await this.connect(type);

    if (this.connection !== null) {
      const channel: $Channel = await openChannel(
        this.connection,
        type,
      );

      await channel.assertQueue(type);

      await channel.consume(
        type,
        async (message: $Message | null): Promise<void> => {
          if (message !== null) {
            const params = JSON.parse(message.content.toString());
            const start = process.hrtime();
            const code: string = makeCode(JSON.stringify({
              params,
              start,
              type,
            }));

            console.info(
              'Queue task consumed',
              code,
              type,
              params,
            );

            try {
              await action(params);

              console.info(
                'Queue task done',
                code,
                type,
                getDuration(start),
              );

              channel.ack(message);
            } catch (error) {
              console.info(
                'Queue task failed',
                code,
                type,
                getDuration(start),
              );

              channel.nack(
                message,
                false,
                requeue !== false,
              );

              throw error;
            }
          }
        },
      );
    } else {
      // @ts-expect-error mocks
      this.mockConsumers[type] = action;
    }
  }

  async runTask<QET extends T[keyof T]>({
    params,
    type,
  }: {
    params: P[QET];
    type: QET;
  }): Promise<void> {
    await this.connect(type);

    if (this.connection !== null) {
      const channel: $Channel = await openChannel(
        this.connection,
        type,
      );

      console.info(
        'Queue task produced',
        type,
        params,
      );

      await channel.assertQueue(type);
      await channel.sendToQueue(
        type,
        Buffer.from(JSON.stringify(params)),
      );
      await channel.close();
    } else {
      // mock mode
      const mockConsumer = this.mockConsumers[type];

      if (mockConsumer) {
        console.info(
          'Queue task consumed',
          type,
          params,
        );

        mockConsumer(params);
      }
    }
  }
}

export default Queue;
