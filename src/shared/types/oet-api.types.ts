/**
 * @purpose Define tipos TypeScript para a API de integração OET baseados no contrato
 * @why Garantir type safety e documentação dos contratos de API
 * @collaborators OetController, OetService, DTOs
 * @inputs Nenhum
 * @outputs Tipos exportados para uso em toda aplicação
 * @sideEffects Nenhum
 * @errors Nenhum
 * @examples import { OetIncidentRequest } from './shared/types/oet-api.types'
 */

/**
 * Request para criação de incidência OET
 */
export interface OetIncidentRequest {
  nit_transp: string;
  contact_name: string;
  client_email: string;
  description: string;
  subject_name: string;
  phone_user: string;
  files_urls?: string;
  cod_product?: string;
}

/**
 * Response de sucesso da API
 */
export interface OetIncidentSuccessResponse {
  status: 'ok';
  task_id: string;
  message: string;
}

/**
 * Response de erro da API
 */
export interface OetIncidentErrorResponse {
  status: 'error';
  code: string;
  message: string;
  oet_code?: string;
  errors?: ValidationError[];
  details?: ErrorDetails;
  correlation_id?: string;
  retry_available?: boolean;
}

/**
 * Erro de validação de campo
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Detalhes de erro para casos específicos
 */
export interface ErrorDetails {
  total_size?: number;
  max_size?: number;
  files_count?: number;
}

/**
 * Tipo união para response da API
 */
export type OetIncidentResponse = OetIncidentSuccessResponse | OetIncidentErrorResponse;

/**
 * Estrutura do envelope SOAP para setSoport
 */
export interface OetSoapRequest {
  nom_usulog: string;
  pwd_usulog: string;
  nom_usuari: string;
  ema_usuari: string;
  tex_messag: string;
  asu_messag: string;
  tel_usuari: string;
  nit_transp: string;
  id_project?: string;
  dat_filexx: {
    item: OetFileAttachment[];
  };
}

/**
 * Estrutura de anexo de arquivo para SOAP
 */
export interface OetFileAttachment {
  file: string; // base64
  fil_sizexx: number;
  nom_filexx: string;
  tip_attach: string;
}

/**
 * Resposta SOAP da OET
 */
export interface OetSoapResponse {
  code_resp: number;
  msg_resp: string;
}

/**
 * Códigos de resposta da OET
 */
export enum OetResponseCode {
  SUCCESS = 1000,
  VALIDATION_ERROR = 6001,
  INSERT_ERROR = 3001,
  INVALID_CREDENTIALS = 1002,
}

/**
 * Códigos de erro da API
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  OET_AUTH_ERROR = 'OET_AUTH_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  OET_VALIDATION_ERROR = 'OET_VALIDATION_ERROR',
  OET_SERVICE_ERROR = 'OET_SERVICE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Informações de arquivo processado
 */
export interface ProcessedFile {
  url: string;
  content: Buffer;
  base64: string;
  size: number;
  name: string;
  mimeType: string;
}

/**
 * Headers da requisição
 */
export interface RequestHeaders {
  'Content-Type': string;
  'Accept': string;
  'X-Request-ID'?: string;
}

