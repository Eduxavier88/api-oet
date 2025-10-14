import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * @purpose Transforma dados JSON da API em formato SOAP para OET
 * @why Converter dados do Typebot para formato esperado pela OET
 * @collaborators ConfigService para credenciais
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
   * @collaborators ConfigService para credenciais
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
      id_project: data.cod_product,
      nom_usulog: this.configService.get<string>('OET_USER') || 'test_user',
      pwd_usulog: this.configService.get<string>('OET_PASSWORD') || 'test_pass',
    };
  }
}
