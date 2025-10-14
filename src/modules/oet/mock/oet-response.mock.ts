import { Logger } from '@nestjs/common';

/**
 * @purpose Mock de respostas da OET para desenvolvimento/testes
 * @why Simular comportamento da OET sem credenciais reais
 * @collaborators CallOetSoapUseCase quando OET_TEST_MODE=true
 * @inputs Dados SOAP e arquivos processados
 * @outputs Resposta simulada da OET
 * @sideEffects Nenhum - apenas simulação
 * @errors Simula diferentes cenários de erro
 * @examples OetResponseMock.simulateResponse(soapData, files)
 */

export interface MockScenario {
  name: string;
  probability: number; // 0-1
  response: () => any;
}

export class OetResponseMock {
  private static readonly logger = new Logger(OetResponseMock.name);
  /**
   * @purpose Simula resposta da OET baseada em cenários configuráveis
   * @why Permitir testes determinísticos e variados
   * @collaborators ConfigService para modo de teste
   * @inputs Dados SOAP e arquivos processados
   * @outputs Resposta simulada da OET
   * @sideEffects Nenhum
   * @errors Retorna cenários de erro simulados
   * @examples const response = OetResponseMock.simulateResponse(soapRequest, files)
   */
  static simulateResponse(soapRequest: any, _processedFiles: any[]): any {
    // PROTEÇÃO DE SEGURANÇA: Verificar se não está em produção
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('[SEGURANÇA] Mock não pode ser executado em PRODUÇÃO!');
    }
    
    // PROTEÇÃO: Verificar se credenciais são de teste
    if (soapRequest.nom_usulog !== 'test_user' && soapRequest.pwd_usulog !== 'test_pass') {
      this.logger.warn('[SEGURANÇA] Mock executado com credenciais não-teste!');
    }
    // Cenários de simulação
    const scenarios: MockScenario[] = [
      {
        name: 'success',
        probability: 0.8, // 80% sucesso
        response: () => ({
          status: 'ok',
          task_id: `DEV-${Date.now()}`,
          message: 'Se Crea Con Exito La Tarea DEV (Modo Desenvolvimento)'
        })
      },
      {
        name: 'auth_error',
        probability: 0.1, // 10% erro de auth
        response: () => ({
          status: 'error',
          code: 'OET_AUTH_ERROR',
          oet_code: '1002',
          message: 'Clave y/o usuario incorrectos. (Modo Desenvolvimento)'
        })
      },
      {
        name: 'validation_error',
        probability: 0.1, // 10% erro de validação
        response: () => ({
          status: 'error',
          code: 'OET_VALIDATION_ERROR',
          oet_code: '6001',
          message: 'Campo - ema_usuari, Detalle - longitud minima invalida (Modo Desenvolvimento)'
        })
      }
    ];

    // Forçar sucesso se credenciais são de teste
    if (soapRequest.nom_usulog === 'test_user' || soapRequest.pwd_usulog === 'test_pass') {
      return scenarios[0]?.response();
    }

    // Escolher cenário baseado em hash determinístico dos dados
    const dataHash = this.hashData(soapRequest);
    const randomValue = (dataHash % 100) / 100; // 0-1
    
    let cumulativeProbability = 0;
    for (const scenario of scenarios) {
      cumulativeProbability += scenario.probability;
      if (randomValue <= cumulativeProbability) {
        return scenario.response();
      }
    }

    // Fallback para sucesso
    return scenarios[0]?.response();
  }

  /**
   * @purpose Gera hash determinístico dos dados para cenários consistentes
   * @why Mesmo input sempre gera mesmo cenário
   * @collaborators simulateResponse
   * @inputs Dados SOAP
   * @outputs Número hash
   * @sideEffects Nenhum
   * @errors Nenhum
   * @examples const hash = OetResponseMock.hashData(soapRequest)
   */
  private static hashData(data: any): number {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  
  static async simulateNetworkDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500; // 500-1500ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
