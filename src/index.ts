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
  $Config as Config,
  $Connection,
  $Message,
} from './types';

export type $Config = Config;

class Queue<C extends Config, T extends Record<string, any>, P extends Record<string, any>> {
  host: string;

  connection: $Connection | null;

  type: T;

  mockConsumers: Record<T[keyof T], (arg0: P[T[keyof T]]) => unknown>;

  constructor({
    host,
  }: C, type: T) {
    this.host = host;
    this.type = type;
    // @ts-ignore
    this.mockConsumers = {
    };
  }

  async connect(type: T[keyof T]): Promise<void> {
    this.connection = await openConnection(
      this.host,
      type,
    );

    this.connection.on(
      'close',
      async () => {
      // eslint-disable-next-line no-console
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

  async initConsumer<QET extends T[keyof T]>({
    action,
    type,
  }: {
    type: QET;
    action: (params: P[QET]) => unknown;
  }): Promise<void> {
    if (this.host !== '') {
      await this.connect(type);

      const channel: $Channel = await openChannel(
        this.connection,
        type,
      );

      await channel.assertQueue(type);

      await channel.consume(
        type,
        async (message: $Message): Promise<void> => {
          if (message !== null) {
            const params = JSON.parse(message.content.toString());
            const start = process.hrtime();
            const code: string = makeCode(JSON.stringify({
              params,
              start,
              type,
            }));

            // eslint-disable-next-line no-console
            console.info(
              'Queue task consumed',
              code,
              type,
              params,
            );

            await action(params);

            // eslint-disable-next-line no-console
            console.info(
              'Queue task done',
              code,
              type,
              getDuration(start),
            );

            channel.ack(message);
          }
        },
      );
    } else {
      // mock mode
      this.mockConsumers[type] = action;
    }
  }

  async runTask<QET extends T[keyof T]>({
    params,
    type,
  }: {
    type: QET;
    params: P[QET];
  }): Promise<void> {
    if (this.host !== '') {
      await this.connect(type);

      const channel: $Channel = await openChannel(
        this.connection,
        type,
      );

      // eslint-disable-next-line no-console
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
    } else {
      // mock mode
      const mockConsumer = this.mockConsumers[type];

      if (mockConsumer) {
        // eslint-disable-next-line no-console
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
