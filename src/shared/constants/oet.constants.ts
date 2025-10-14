/**
 * @purpose Define constantes para códigos de resposta e configurações da API OET
 * @why Centralizar valores mágicos e facilitar manutenção
 * @collaborators OetService, OetController
 * @inputs Nenhum
 * @outputs Constantes exportadas
 * @sideEffects Nenhum
 * @errors Nenhum
 * @examples import { OET_SUCCESS_CODE } from './shared/constants/oet.constants'
 */

/**
 * Códigos de resposta da API OET
 */
export const OET_RESPONSE_CODES = {
  SUCCESS: 1000,
  VALIDATION_ERROR: 6001,
  INSERT_ERROR: 3001,
  INVALID_CREDENTIALS: 1002,
} as const;

/**
 * Mensagens de erro padronizadas
 */
export const OET_ERROR_MESSAGES = {
  [OET_RESPONSE_CODES.VALIDATION_ERROR]: 'Erro de validação dos dados enviados',
  [OET_RESPONSE_CODES.INSERT_ERROR]: 'Erro ao inserir dados no sistema OET',
  [OET_RESPONSE_CODES.INVALID_CREDENTIALS]: 'Credenciais inválidas para acesso à API OET',
  DEFAULT: 'Erro interno na comunicação com API OET',
} as const;

/**
 * Configurações padrão
 */
export const OET_DEFAULT_CONFIG = {
  TIMEOUT: 15000,
  MAX_RETRIES: 2,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_COUNT: 10,
} as const;

/**
 * Tipos de arquivo permitidos
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

/**
 * Padrões de validação
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  NIT: /^[\d\-]+$/,
} as const;

