import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

@Schema({ timestamps: true, collection: 'logs' })
export class Log {
  @Prop({ required: true, enum: LogLevel, index: true })
  level!: LogLevel;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: Object })
  context?: Record<string, unknown>;

  @Prop({ index: true })
  userId?: string;

  @Prop()
  method?: string;

  @Prop()
  path?: string;

  @Prop()
  statusCode?: number;

  @Prop()
  duration?: number;

  @Prop()
  stack?: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
