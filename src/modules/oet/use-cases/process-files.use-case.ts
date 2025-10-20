import { Injectable } from '@nestjs/common';

export interface ProcessedFile {
  file: string; 
  fil_sizexx: number; 
  nom_filexx: string; 
  tip_attach: string; 
}

@Injectable()
export class ProcessFilesUseCase {
  constructor() {}

  async execute(filesBinary?: string): Promise<ProcessedFile[]> {
    // Se não há arquivos, retornar array vazio
    if (!filesBinary || filesBinary.trim() === '') {
      return [];
    }

    // Processar arquivo base64
    return this.processBase64File(filesBinary);
  }

  /**
   * @purpose Processa arquivo binário em base64 (formato data:image/jpeg;base64,...)
   * @why Converter arquivos binários do Typebot para formato OET
   * @collaborators Nenhum
   * @inputs String binário base64 com prefixo data: ou string vazia/null
   * @outputs Array com arquivo processado ou array vazio se não há arquivos
   * @sideEffects Nenhum
   * @errors Nenhum
   * @examples execute('data:image/jpeg;base64,/9j/4AAQ...') ou execute('')
   */
  private processBase64File(base64String: string): ProcessedFile[] {
    try {
      // Extrair tipo MIME e dados base64
      const [header, base64Data] = base64String.split(',');
      
      if (!header || !base64Data) {
        throw new Error('Formato base64 inválido');
      }
      
      const mimeRe = /data:([^;]+)/;
      const mimeType = mimeRe.exec(header)?.[1] || 'application/octet-stream';
      
      // Converter base64 para buffer para calcular tamanho
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Gerar nome do arquivo baseado no tipo
      const extension = mimeType.split('/')[1] || 'bin';
      const fileName = `file_${Date.now()}.${extension}`;
      
      return [{
        file: base64Data,
        fil_sizexx: buffer.length,
        nom_filexx: fileName,
        tip_attach: mimeType
      }];
    } catch (error) {
      throw new Error(`Erro ao processar arquivo base64: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}