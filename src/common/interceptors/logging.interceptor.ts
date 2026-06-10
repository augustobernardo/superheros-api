import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService } from '../../logging/logging.service';

interface AuthenticatedRequest extends Request {
  user?: { id?: string };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(@Optional() private readonly loggingService?: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { method, url } = request;
    const userId = request.user?.id;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const duration = Date.now() - start;
        const statusCode = response.statusCode;

        void this.loggingService?.info(`${method} ${url}`, {
          method,
          path: url,
          statusCode,
          duration,
          userId,
        });
      }),
    );
  }
}
