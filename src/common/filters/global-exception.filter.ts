import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from '../../logging/logging.service';

interface AuthenticatedRequest extends Request {
  user?: { id?: string };
}

interface HttpExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(@Optional() private readonly loggingService?: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.resolveMessage(exception);

    if (exception instanceof Error) {
      console.error(
        `[GlobalExceptionFilter] ${request.method} ${request.url} - ${status}`,
      );
      console.error(exception.stack || exception.message);
    }

    void this.loggingService?.error(
      `${request.method} ${request.url} - ${status}`,
      {
        method: request.method,
        path: request.url,
        statusCode: status,
        userId: request.user?.id,
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    });
  }

  private resolveMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return 'Internal server error';
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const httpResponse = response as HttpExceptionResponse;
      return httpResponse.message ?? 'Internal server error';
    }

    return 'Internal server error';
  }
}
