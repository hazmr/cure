import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttpException ? exception.getResponse() : 'Internal server error';
    const message =
      typeof raw === 'string'
        ? raw
        : Array.isArray((raw as { message?: unknown }).message)
          ? (raw as { message: string[] }).message
          : ((raw as { message?: string }).message ?? 'Internal server error');

    response.status(status).json({
      error: {
        statusCode: status,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

