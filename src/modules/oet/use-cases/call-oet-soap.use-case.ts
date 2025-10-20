import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';


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
    try {
      // Construir envelope SOAP
      const soapEnvelope = this.buildSoapEnvelope(soapRequest, processedFiles);
      
      // Log resumido para debug (sem base64)
      this.logger.log(`[DEBUG] SOAP Envelope enviado (${processedFiles.length} arquivos)`);
      
      // URL do WSDL OET
      const wsdlUrl = this.configService.get<string>('OET_WSDL_URL');
      if (!wsdlUrl) {
        throw new Error('OET_WSDL_URL não configurada');
      }
      
      // Fazer chamada SOAP
      const response = await this.httpService.axiosRef.post(
        wsdlUrl,
        soapEnvelope,
        {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'urn:consult_base#setSoport'
          },
          timeout: this.configService.get<number>('HTTP_TIMEOUT') || 15000
        }
      );

      // Log da resposta da OET
      this.logger.log(`[DEBUG] OET Response Status: ${response.status}`);
      this.logger.log(`[DEBUG] OET Response Data: ${response.data}`);

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
      
      
      throw error;
    }
  }

  private buildSoapEnvelope(soapRequest: any, processedFiles: any[]): string {
    
    let soapBody = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:consult_base">
        <soapenv:Header/>
        <soapenv:Body>
          <urn:setSoport>
            <nom_usulog>${soapRequest.nom_usulog}</nom_usulog>
            <pwd_usulog>${soapRequest.pwd_usulog}</pwd_usulog>
            <nom_usuari>${soapRequest.nom_usuari}</nom_usuari>
            <ema_usuari>${soapRequest.ema_usuari}</ema_usuari>
            <tex_messag>${soapRequest.tex_messag}</tex_messag>
            <asu_messag>${soapRequest.asu_messag}</asu_messag>
            <dat_filexx>`;

    // Adicionar arquivos processados se existirem
    if (processedFiles && processedFiles.length > 0) {
      this.logger.log(`[SOAP] Incluindo ${processedFiles.length} arquivos no SOAP`);
      processedFiles.forEach((file, index) => {
        // Evitar logar nomes reais de arquivo
        this.logger.log(`[SOAP] Arquivo ${index + 1}: (${file.size} bytes, ${file.contentType})`);
        soapBody += `
              <item>
                <file>${file.base64}</file>
                <fil_sizexx>${file.size}</fil_sizexx>
                <nom_filexx>file-${index + 1}</nom_filexx>
                <tip_attach>${file.contentType}</tip_attach>
              </item>`;
      });
    } else {
      
      soapBody += `
              <item>
                <file/>
                <fil_sizexx/>
                <nom_filexx/>
                <tip_attach/>
              </item>`;
    }

    soapBody += `
            </dat_filexx>
            <tel_usuari>${soapRequest.tel_usuari}</tel_usuari>
            <nit_transp>${soapRequest.nit_transp}</nit_transp>
            <id_project>${soapRequest.id_project}</id_project>
          </urn:setSoport>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

    return soapBody;
  }

  

  private parseSoapResponse(soapResponse: string): OetIncidentResponse {
    // Extrair código de resposta - OET usa namespaces diferentes
    const codeMatch = soapResponse.match(/<code_resp[^>]*>(\d+)<\/code_resp>/);
    const msgMatch = soapResponse.match(/<msg_resp[^>]*>(.*?)<\/msg_resp>/);
    
    const code = codeMatch?.[1];
    const message = msgMatch?.[1];

    // Não logar mensagem completa para evitar PII
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
    if (code === '1001') {
      return {
        status: 'error',
        code: 'OET_PARENT_TASK_ERROR',
        oet_code: code,
        message: message
      };
    }

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

    
    return {
      status: 'error',
      code: 'OET_ERROR',
      oet_code: code,
      message: message || 'Erro desconhecido da OET'
    };
  }
}