// Global Types
import type {
  Channel,
  Connection,
  Message,
} from 'amqplib';

export type $Connection = Connection;
export type $Channel = Channel;
export type $Message = Message;

export type $Config = {
  host: string;
};
