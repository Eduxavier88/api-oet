/**
 * @purpose Define tipos TypeScript para integração com API OET
 * @why Garantir type safety e documentação dos contratos de API
 * @collaborators OetService, OetController
 * @inputs Nenhum
 * @outputs Tipos exportados para uso em toda aplicação
 * @sideEffects Nenhum
 * @errors Nenhum
 * @examples import { OetIncidentRequest } from './shared/types/oet.types'
 */

/**
 * Payload de entrada para criação de incidente OET
 */
export interface OetIncidentRequest {
  nit_transp: string;
  id_project?: string;
  contact_name: string;
  client_email: string;
  description: string;
  subject_name: string;
  phone_user: string;
  files_urls: string[];
}

/**
 * Resposta de sucesso da API OET
 */
export interface OetSuccessResponse {
  status: 'ok';
  task_id: string;
}

/**
 * Resposta de erro da API OET
 */
export interface OetErrorResponse {
  status: 'error';
  code_resp: number;
  msg: string;
}

/**
 * Tipo união para resposta da API OET
 */
export type OetApiResponse = OetSuccessResponse | OetErrorResponse;

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
 * Estrutura de produto para getProduct
 */
export interface OetProduct {
  cod: string;
  det: string;
}

/**
 * Resposta do getProduct
 */
export interface OetProductResponse {
  products: OetProduct[];
}

/**
 * Configuração da API OET
 */
export interface OetConfig {
  user: string;
  password: string;
  wsdlUrl: string;
  timeout: number;
  maxRetries: number;
}
