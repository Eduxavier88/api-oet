import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OetResponseMock } from '../mock/oet-response.mock';

export interface OetIncidentResponse {
  status: 'ok' | 'error';
  task_id?: string | undefined;
  message?: string | undefined;
  code?: string | undefined;
  errors?: string[] | undefined;
  oet_code?: string | undefined;
  retry_available?: boolean | undefined;
}

@Injectable()
export class CallOetSoapUseCase {
  private readonly logger = new Logger(CallOetSoapUseCase.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async execute(soapRequest: any, processedFiles: any[]): Promise<OetIncidentResponse> {
    // Verificar se está em modo de desenvolvimento (múltiplas validações)
    const isDevMode = this.isDevelopmentMode();
    
    if (isDevMode) {
      this.logger.warn('[DEV MODE] Usando mock da OET - NÃO USAR EM PRODUÇÃO!');
      
      // Simular delay de rede
      await OetResponseMock.simulateNetworkDelay();
      
      // Retornar resposta simulada
      return OetResponseMock.simulateResponse(soapRequest, processedFiles);
    }

    try {
      // Construir envelope SOAP
      const soapEnvelope = this.buildSoapEnvelope(soapRequest, processedFiles);
      
      // URL do WSDL OET
      const wsdlUrl = this.configService.get<string>('OET_WSDL_URL') || 'https://oet-dev.intrared.net:8083/ap/interf/app/spg_new/spg.php?wsdl';
      
      // Fazer chamada SOAP
      const response = await this.httpService.axiosRef.post(
        wsdlUrl,
        soapEnvelope,
        {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'setSoport'
          },
          timeout: 15000
        }
      );

      // Processar resposta SOAP
      return this.parseSoapResponse(response.data);
      
    } catch (error: unknown) {
      // Tratar erros de rede/timeout
      if (error instanceof Error && error.message?.includes('timeout')) {
        return {
          status: 'error',
          code: 'OET_SERVICE_ERROR',
          message: 'Erro ao comunicar com serviço OET: timeout após 15 segundos',
          retry_available: true
        };
      }
      
      // Re-lançar outros erros
      throw error;
    }
  }

  private buildSoapEnvelope(soapRequest: any, processedFiles: any[]): string {
    // Construir XML SOAP envelope
    let soapBody = `
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <setSoport>
            <nom_usulog>${soapRequest.nom_usulog}</nom_usulog>
            <pwd_usulog>${soapRequest.pwd_usulog}</pwd_usulog>
            <nom_usuari>${soapRequest.nom_usuari}</nom_usuari>
            <ema_usuari>${soapRequest.ema_usuari}</ema_usuari>
            <tex_messag>${soapRequest.tex_messag}</tex_messag>
            <asu_messag>${soapRequest.asu_messag}</asu_messag>
            <tel_usuari>${soapRequest.tel_usuari}</tel_usuari>
            <nit_transp>${soapRequest.nit_transp}</nit_transp>
            <id_project>${soapRequest.id_project || ''}</id_project>
    `;

    // Adicionar arquivos se existirem
    if (processedFiles.length > 0) {
      soapBody += '<dat_filexx>';
      processedFiles.forEach(file => {
        soapBody += `
          <item>
            <file>${file.file}</file>
            <fil_sizexx>${file.fil_sizexx}</fil_sizexx>
            <nom_filexx>${file.nom_filexx}</nom_filexx>
            <tip_attach>${file.tip_attach}</tip_attach>
          </item>
        `;
      });
      soapBody += '</dat_filexx>';
    }

    soapBody += `
          </setSoport>
        </soap:Body>
      </soap:Envelope>
    `;

    return soapBody;
  }

  /**
   * @purpose Verifica se está em modo de desenvolvimento com múltiplas validações
   * @why Garantir que mock nunca execute em produção
   * @collaborators ConfigService, process.env
   * @inputs Nenhum
   * @outputs Boolean indicando se é modo dev
   * @sideEffects Nenhum
   * @errors Nenhum
   * @examples const isDev = useCase.isDevelopmentMode()
   */
  private isDevelopmentMode(): boolean {
    // Validação 1: Variável de ambiente explícita
    const testMode = this.configService.get<string>('OET_TEST_MODE');
    const isTestMode = testMode === 'true';
    
    // Validação 2: NODE_ENV não deve ser 'production'
    const nodeEnv = process.env['NODE_ENV'];
    const isNotProduction = nodeEnv !== 'production';
    
    // Validação 3: Verificar se credenciais são de teste
    const user = this.configService.get<string>('OET_USER');
    const password = this.configService.get<string>('OET_PASSWORD');
    const isTestCredentials = user === 'test_user' || password === 'test_pass';
    
    // Só ativa mock se TODAS as condições forem verdadeiras
    const shouldUseMock = isTestMode && isNotProduction && isTestCredentials;
    
    // Log de segurança em produção
    if (nodeEnv === 'production' && isTestMode) {
      this.logger.error('[SEGURANÇA] OET_TEST_MODE=true detectado em PRODUÇÃO! Desabilitando mock.');
      return false;
    }
    
    return shouldUseMock;
  }

  private parseSoapResponse(soapResponse: string): OetIncidentResponse {
    // Extrair código de resposta
    const codeMatch = soapResponse.match(/<code_resp>(\d+)<\/code_resp>/);
    const msgMatch = soapResponse.match(/<msg_resp>(.*?)<\/msg_resp>/);
    
    const code = codeMatch?.[1];
    const message = msgMatch?.[1];

    // Código 1000 = sucesso
    if (code === '1000') {
      // Extrair task_id da mensagem
      const taskIdMatch = message?.match(/La Tarea (\d+)/);
      const taskId = taskIdMatch?.[1];
      
      return {
        status: 'ok',
        task_id: taskId,
        message: message
      };
    }

    // Códigos de erro
    if (code === '1002') {
      return {
        status: 'error',
        code: 'OET_AUTH_ERROR',
        oet_code: code,
        message: message
      };
    }

    if (code === '6001') {
      return {
        status: 'error',
        code: 'OET_VALIDATION_ERROR',
        oet_code: code,
        message: message
      };
    }

    // Erro genérico
    return {
      status: 'error',
      code: 'OET_ERROR',
      oet_code: code,
      message: message || 'Erro desconhecido da OET'
    };
  }
}