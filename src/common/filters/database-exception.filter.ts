import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PostgresError } from 'postgres';

@Catch(PostgresError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: PostgresError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception.code === '23505') {
      status = HttpStatus.CONFLICT;
      message = 'Duplicate entry';
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: exception.message,
    });
  }
}
