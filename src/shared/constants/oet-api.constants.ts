/**
 * @purpose Define constantes para validação e configuração da API OET
 * @why Centralizar valores de validação e facilitar manutenção
 * @collaborators DTOs, Services, Controllers
 * @inputs Nenhum
 * @outputs Constantes exportadas
 * @sideEffects Nenhum
 * @errors Nenhum
 * @examples import { VALIDATION_RULES } from './shared/constants/oet-api.constants'
 */

/**
 * Regras de validação para campos obrigatórios
 */
export const VALIDATION_RULES = {
  NIT_TRANSP: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 50,
    PATTERN: /^[\d\-]+$/,
  },
  CONTACT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  CLIENT_EMAIL: {
    MAX_LENGTH: 100,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 5000,
  },
  SUBJECT_NAME: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
  PHONE_USER: {
    MIN_LENGTH: 7,
    MAX_LENGTH: 20,
    PATTERN: /^\+?[\d\s\-\(\)]+$/,
  },
  COD_PRODUCT: {
    MAX_LENGTH: 50,
    PATTERN: /^\d+$/,
  },
} as const;

/**
 * Limitações de arquivos
 */
export const FILE_LIMITS = {
  MAX_FILES_COUNT: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_TOTAL_SIZE: 25 * 1024 * 1024, // 25MB
} as const;

/**
 * Tipos de arquivo permitidos
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const;

/**
 * Extensões de arquivo permitidas
 */
export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
] as const;

/**
 * Configurações de timeout e retry
 */
export const REQUEST_CONFIG = {
  TIMEOUT: 15000,
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,
} as const;

/**
 * Mensagens de erro padronizadas
 */
export const ERROR_MESSAGES = {
  VALIDATION: {
    NIT_TRANSP_MIN_LENGTH: 'NIT deve ter pelo menos 5 caracteres',
    NIT_TRANSP_MAX_LENGTH: 'NIT deve ter no máximo 50 caracteres',
    NIT_TRANSP_INVALID: 'NIT deve conter apenas números e hífens',
    CONTACT_NAME_MIN_LENGTH: 'Nome deve ter pelo menos 3 caracteres',
    CONTACT_NAME_MAX_LENGTH: 'Nome deve ter no máximo 100 caracteres',
    EMAIL_INVALID: 'Email inválido',
    EMAIL_MAX_LENGTH: 'Email deve ter no máximo 100 caracteres',
    DESCRIPTION_MIN_LENGTH: 'Descrição deve ter pelo menos 10 caracteres',
    DESCRIPTION_MAX_LENGTH: 'Descrição deve ter no máximo 5000 caracteres',
    SUBJECT_MIN_LENGTH: 'Assunto deve ter pelo menos 5 caracteres',
    SUBJECT_MAX_LENGTH: 'Assunto deve ter no máximo 200 caracteres',
    PHONE_MIN_LENGTH: 'Telefone deve ter pelo menos 7 caracteres',
    PHONE_MAX_LENGTH: 'Telefone deve ter no máximo 20 caracteres',
    PHONE_INVALID: 'Formato de telefone inválido',
    COD_PRODUCT_MAX_LENGTH: 'Código do produto deve ter no máximo 50 caracteres',
    COD_PRODUCT_INVALID: 'Código do produto deve conter apenas números',
  },
  FILES: {
    TOO_MANY_FILES: 'Máximo de 10 arquivos permitidos',
    FILE_TOO_LARGE: 'Arquivo excede o tamanho máximo de 5MB',
    TOTAL_SIZE_EXCEEDED: 'Tamanho total dos arquivos excede 25MB',
    INVALID_FILE_TYPE: 'Tipo de arquivo não permitido',
    INVALID_URL: 'URL de arquivo inválida',
    DOWNLOAD_FAILED: 'Falha ao baixar arquivo',
  },
  OET: {
    AUTH_ERROR: 'Credenciais OET inválidas',
    VALIDATION_ERROR: 'Erro de validação na OET',
    SERVICE_ERROR: 'Erro ao comunicar com serviço OET',
    TIMEOUT: 'Timeout na comunicação com OET',
  },
  INTERNAL: {
    UNEXPECTED_ERROR: 'Erro interno inesperado',
    CONFIG_ERROR: 'Erro de configuração',
  },
} as const;

/**
 * Status HTTP codes
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

/**
 * Mapeamento de campos JSON para SOAP
 */
export const FIELD_MAPPING = {
  contact_name: 'nom_usuari',
  client_email: 'ema_usuari',
  description: 'tex_messag',
  subject_name: 'asu_messag',
  phone_user: 'tel_usuari',
  nit_transp: 'nit_transp',
  cod_product: 'id_project',
} as const;

