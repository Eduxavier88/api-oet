import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorCode, ValidationError } from '../types/oet-api.types';

/**
 * @purpose Exceções customizadas para a API OET
 * @why Padronizar tratamento de erros e facilitar debugging
 * @collaborators OetController, OetService, ExceptionFilter
 * @inputs Código de erro, mensagem e detalhes opcionais
 * @outputs Exceções HTTP padronizadas
 * @sideEffects Lança exceções HTTP
 * @errors Nenhum
 * @examples throw new OetValidationException('Email inválido', [{ field: 'email', message: 'Formato inválido' }])
 */

/**
 * Exceção para erros de validação de entrada
 */
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

/**
 * Exceção para erros de autenticação com OET
 */
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

/**
 * Exceção para arquivos muito grandes
 */
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

/**
 * Exceção para erros de validação da OET
 */
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

/**
 * Exceção para erros de comunicação com OET
 */
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

/**
 * Exceção para erros internos
 */
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

