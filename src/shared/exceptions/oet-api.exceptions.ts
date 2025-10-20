import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorCode, ValidationError } from '../types/oet-api.types';


export class OetValidationException extends HttpException {
  constructor(message: string, errors: ValidationError[]) {
    super(
      {
        status: 'error',
        code: ApiErrorCode.VALIDATION_ERROR,
        message,
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}


export class OetAuthException extends HttpException {
  constructor(message: string, oetCode?: string) {
    super(
      {
        status: 'error',
        code: ApiErrorCode.OET_AUTH_ERROR,
        oet_code: oetCode,
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}


export class FileSizeExceededException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        status: 'error',
        code: ApiErrorCode.FILE_SIZE_EXCEEDED,
        message,
        details,
      },
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
  }
}


export class OetValidationErrorException extends HttpException {
  constructor(message: string, oetCode: string) {
    super(
      {
        status: 'error',
        code: ApiErrorCode.OET_VALIDATION_ERROR,
        oet_code: oetCode,
        message,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}


export class OetServiceException extends HttpException {
  constructor(message: string, retryAvailable = false) {
    super(
      {
        status: 'error',
        code: ApiErrorCode.OET_SERVICE_ERROR,
        message,
        retry_available: retryAvailable,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}


export class OetInternalException extends HttpException {
  constructor(message: string, correlationId?: string) {
    super(
      {
        status: 'error',
        code: ApiErrorCode.INTERNAL_ERROR,
        message,
        correlation_id: correlationId,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

