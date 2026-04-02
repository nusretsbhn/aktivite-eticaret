import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { originalUrl?: string; method?: string }>();
    const method = req?.method ?? 'GET';
    const url = req?.originalUrl ?? 'unknown';

    const startedAt = Date.now();
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - startedAt;
        // eslint-disable-next-line no-console
        console.log(`[HTTP] ${method} ${url} - ${ms}ms`);
      }),
    );
  }
}

