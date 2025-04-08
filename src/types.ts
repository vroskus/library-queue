// Global Types
import type {
  Channel,
  ChannelModel,
  Message,
} from 'amqplib';

export type $Channel = Channel;
export type $Config = {
  host: string;
};
export type $Connection = ChannelModel;

export type $Message = Message;
