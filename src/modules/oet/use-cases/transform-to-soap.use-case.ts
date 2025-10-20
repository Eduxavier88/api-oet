import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getOetCredentials } from '../../../config/oet-credentials.config';

/**
 * @purpose Transforma dados JSON da API em formato SOAP para OET
 * @why Converter dados do Typebot para formato esperado pela OET
 * @collaborators getOetCredentials para credenciais
 * @inputs Dados validados da incidência
 * @outputs Objeto no formato SOAP OET
 * @sideEffects Nenhum
 * @errors Pode lançar erro se credenciais não estiverem configuradas
 * @examples await useCase.execute(validatedData)
 */
export interface OetSoapRequest {
  nom_usuari: string;
  ema_usuari: string;
  tex_messag: string;
  asu_messag: string;
  tel_usuari: string;
  nit_transp: string;
  id_project?: string;
  nom_usulog: string;
  pwd_usulog: string;
}

@Injectable()
export class TransformToSoapUseCase {
  constructor(private readonly configService: ConfigService) {}

  /**
   * @purpose Transforma dados validados em formato SOAP para OET
   * @why Mapear campos da API para campos esperados pela OET
   * @collaborators getOetCredentials para credenciais
   * @inputs Dados validados da incidência
   * @outputs Objeto no formato SOAP OET
   * @sideEffects Nenhum
   * @errors Pode lançar erro se credenciais não estiverem configuradas
   * @examples const soapRequest = await useCase.execute(validatedData)
   */
  async execute(data: any): Promise<OetSoapRequest> {
    return {
      nom_usuari: data.contact_name,
      ema_usuari: data.client_email,
      tex_messag: data.description,
      asu_messag: data.subject_name,
      tel_usuari: data.phone_user,
      nit_transp: data.nit_transp,
      id_project: data.id_project || this.configService.get<string>('OET_DEFAULT_PROJECT_ID') || '52', // ID do projeto fixo para OET
      nom_usulog: this.getOetCredentials().username,
      pwd_usulog: this.getOetCredentials().password,
    };
  }

  /**
   * @purpose Obtém as credenciais OET baseadas no ambiente
   * @why Usar credenciais diferentes para dev e produção
   * @collaborators ConfigService
   * @inputs Nenhum
   * @outputs Credenciais OET (username e password)
   * @sideEffects Nenhum
   * @errors Nenhum
   * @examples getOetCredentials() -> { username: 'usr_prod', password: 'xxx' }
   */
  private getOetCredentials(): { username: string; password: string } {
    return getOetCredentials();
  }
}
