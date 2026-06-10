import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument, LogLevel } from './schemas/log.schema';

export interface LogContext {
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  stack?: string;
  [key: string]: unknown;
}

@Injectable()
export class LoggingService {
  constructor(
    @InjectModel(Log.name) private readonly logModel: Model<LogDocument>,
  ) {}

  async info(message: string, context?: LogContext): Promise<void> {
    await this.createLog(LogLevel.INFO, message, context);
  }

  async warning(message: string, context?: LogContext): Promise<void> {
    await this.createLog(LogLevel.WARNING, message, context);
  }

  async error(message: string, context?: LogContext): Promise<void> {
    await this.createLog(LogLevel.ERROR, message, context);
  }

  async findAll(level?: LogLevel, limit = 100): Promise<LogDocument[]> {
    const filter = level ? { level } : {};
    return this.logModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as Promise<LogDocument[]>;
  }

  private async createLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): Promise<void> {
    try {
      const { userId, method, path, statusCode, duration, stack, ...rest } =
        context ?? {};

      await this.logModel.create({
        level,
        message,
        userId,
        method,
        path,
        statusCode,
        duration,
        stack,
        context: Object.keys(rest).length > 0 ? rest : undefined,
      });
    } catch (err) {
      console.error('Logging failed:', err);
    }
  }
}
