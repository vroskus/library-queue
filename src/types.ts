// Global Types
import type {
  Channel,
  Connection,
  Message,
} from 'amqplib';

export type $Channel = Channel;
export type $Config = {
  host: string;
};
export type $Connection = Connection;

export type $Message = Message;
