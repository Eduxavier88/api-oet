/**
 * @fileoverview Configuração de credenciais OET
 * @warning NÃO COMMITAR CREDENCIAIS REAIS DE PRODUÇÃO
 */

export interface OetCredentials {
  username: string;
  password: string;
}

/**
 * Credenciais OET - SEMPRE usar variáveis de ambiente
 * @security Use sempre variáveis de ambiente para credenciais
 */
export function getOetCredentialsObject(): OetCredentials {
  return {
    username: process.env['OET_USER'] || '',
    password: process.env['OET_PASSWORD'] || ''
  };
}

/**
 * Obtém credenciais OET
 * @returns Credenciais OET
 * @throws Error se credenciais não estiverem configuradas
 */
export function getOetCredentials(): OetCredentials {
  const credentials = getOetCredentialsObject();
  
  if (!credentials.username || !credentials.password) {
    throw new Error('Credenciais OET não configuradas. Configure OET_USER e OET_PASSWORD nas variáveis de ambiente.');
  }
  return credentials;
}
