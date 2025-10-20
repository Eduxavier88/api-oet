/**
 * @purpose Configuração centralizada da aplicação com validação de variáveis de ambiente
 * @why Centralizar configurações e garantir que variáveis obrigatórias estejam presentes
 * @collaborators ConfigModule, OetService
 * @inputs Variáveis de ambiente
 * @outputs Objeto de configuração validado
 * @sideEffects Nenhum
 * @errors Lança erro se variáveis obrigatórias estiverem ausentes
 * @examples import { appConfig } from './config/app.config'
 */

export interface AppConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
  httpTimeout: number;
  maxRetries: number;
  oet: {
    wsdlUrl: string;
    user: string;
    password: string;
    testMode: boolean;
  };
  files: {
    maxFileSize: number;
    maxTotalFileSize: number;
    maxFilesCount: number;
  };
  chatwoot: {
    baseUrl: string;
    token: string;
    accountId: string;
  };
}


export const appConfig: AppConfig = {
  port: Number.parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  allowedOrigins: process.env['ALLOWED_ORIGINS']?.split(',') || ['*'],
  httpTimeout: Number.parseInt(process.env['HTTP_TIMEOUT'] || '15000', 10),
  maxRetries: Number.parseInt(process.env['MAX_RETRIES'] || '2', 10),
  
  oet: {
    wsdlUrl: process.env['OET_WSDL_URL'] || '',
    user: process.env['OET_USER'] || '',
    password: process.env['OET_PASSWORD'] || '',
    testMode: process.env['OET_TEST_MODE'] === 'true',
  },
  
  files: {
    maxFileSize: Number.parseInt(process.env['MAX_FILE_SIZE'] || '5242880', 10), // 5MB
    maxTotalFileSize: Number.parseInt(process.env['MAX_TOTAL_FILE_SIZE'] || '26214400', 10), // 25MB
    maxFilesCount: Number.parseInt(process.env['MAX_FILES_COUNT'] || '10', 10),
  },
  
  chatwoot: {
    baseUrl: process.env['CHATWOOT_BASE_URL'] || 'https://omnihitv2.omnihit.app.br',
    token: process.env['CHATWOOT_TOKEN'] || '',
    accountId: process.env['CHATWOOT_ACCOUNT_ID'] || '1',
  },
};


export function validateConfig(): void {
  const requiredEnvVars = [
    'OET_WSDL_URL',
    'OET_USER',
    'OET_PASSWORD',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Variáveis de ambiente obrigatórias ausentes: ${missingVars.join(', ')}`
    );
  }
}

