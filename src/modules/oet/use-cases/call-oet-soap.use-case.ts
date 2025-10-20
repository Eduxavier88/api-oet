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
      
      const soapEnvelope = this.buildSoapEnvelope(soapRequest, processedFiles);
      
      
      this.logger.log(`[DEBUG] SOAP Envelope enviado (${processedFiles.length} arquivos)`);
      
      
      const wsdlUrl = this.configService.get<string>('OET_WSDL_URL');
      if (!wsdlUrl) {
        throw new Error('OET_WSDL_URL não configurada');
      }
      
      
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
      this.logger.log(`[DEBUG] OET Response Status: ${response.status}`);
      this.logger.log(`[DEBUG] OET Response Data: ${response.data}`);

     
      return this.parseSoapResponse(response.data);
      
    } catch (error: unknown) {
     
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
      for (let index = 0; index < processedFiles.length; index += 1) {
        const file = processedFiles[index];
        
        this.logger.log(`[SOAP] Arquivo ${index + 1}: (${file.size} bytes, ${file.contentType})`);
        soapBody += `
              <item>
                <file>${file.base64}</file>
                <fil_sizexx>${file.size}</fil_sizexx>
                <nom_filexx>file-${index + 1}</nom_filexx>
                <tip_attach>${file.contentType}</tip_attach>
              </item>`;
      }
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
    const codeRe = /<code_resp[^>]*>(\d+)<\/code_resp>/;
    const msgRe = /<msg_resp[^>]*>(.*?)<\/msg_resp>/;
    const code = codeRe.exec(soapResponse)?.[1];
    const message = msgRe.exec(soapResponse)?.[1];

    // Não logar mensagem completa para evitar PII
    if (code === '1000') {
      
      const taskIdRe = /La Tarea (\d+)/;
      const taskId = taskIdRe.exec(message || '')?.[1];
      
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