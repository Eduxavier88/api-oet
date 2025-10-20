import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class ImageDownloadService {
  private readonly logger = new Logger(ImageDownloadService.name);
  private readonly maxFileSize = 5 * 1024 * 1024; 
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  
  async downloadImages(imageUrls: string[]): Promise<ProcessedImage[]> {
    if (!imageUrls || imageUrls.length === 0) {
      this.logger.log('[IMAGE_DOWNLOAD] Nenhuma imagem para processar');
      return [];
    }

    this.logger.log(`[IMAGE_DOWNLOAD] Processando ${imageUrls.length} imagens`);

    // Processa imagens em paralelo
    const downloadPromises = imageUrls.map((url, index) => 
      this.downloadSingleImage(url, index)
    );

    try {
      const results = await Promise.allSettled(downloadPromises);
      const successful: ProcessedImage[] = [];
      const failed: string[] = [];
      for (let index = 0; index < results.length; index += 1) {
        const settled = results[index];
        if (settled && settled.status === 'fulfilled') {
          successful.push(settled.value);
        } else if (settled && settled.status === 'rejected') {
          const failedUrl = imageUrls[index];
          if (failedUrl) {
            failed.push(failedUrl);
            this.logger.error(`[IMAGE_DOWNLOAD] Falha ao processar ${failedUrl}: ${settled.reason}`);
          }
        }
      }

      this.logger.log(`[IMAGE_DOWNLOAD] Sucesso: ${successful.length}, Falhas: ${failed.length}`);
      
      if (failed.length > 0) {
        this.logger.warn(`[IMAGE_DOWNLOAD] URLs que falharam: ${failed.join(', ')}`);
      }

      return successful;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`[IMAGE_DOWNLOAD] Erro geral: ${errorMessage}`);
      throw new HttpException(
        `Erro ao processar imagens: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  
  private async downloadSingleImage(url: string, index: number): Promise<ProcessedImage> {
    // Substituir URL do Chatwoot para usar IP correto do servidor
    const chatwootBaseUrl = this.configService.get<string>('CHATWOOT_BASE_URL') || 'http://172.31.187.223:3000';
    
    // Substituir qualquer URL que contenha 'omnihitv2.omnihit.app.br' pelo IP do servidor
    const correctedUrl = url.replace(/https?:\/\/[^\/]*omnihitv2\.omnihit\.app\.br/, chatwootBaseUrl);
    
    this.logger.log(`[IMAGE_DOWNLOAD] Baixando imagem ${index + 1}: ${correctedUrl}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(correctedUrl, {
          responseType: 'arraybuffer',
          timeout: 60000,
          maxContentLength: this.maxFileSize,
          maxRedirects: 5,
        })
      );

      const contentType = response.headers['content-type'] || '';
      const contentLength = Number.parseInt(response.headers['content-length'] || '0', 10);

     
      this.validateImage(contentType, contentLength, url);

      
      const base64 = Buffer.from(response.data).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;

      
      const filename = this.generateFilename(url, contentType, index);

      this.logger.log(`[IMAGE_DOWNLOAD] Imagem ${index + 1} processada: ${filename} (${contentLength} bytes)`);

      return {
        filename,
        contentType,
        base64: dataUrl,
        size: contentLength,
        originalUrl: url,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`[IMAGE_DOWNLOAD] Erro ao baixar ${url}: ${errorMessage}`);
      throw new Error(`Falha ao baixar imagem: ${errorMessage}`);
    }
  }

 
  private validateImage(contentType: string, contentLength: number, _url: string): void {
    
    if (!this.allowedTypes.includes(contentType)) {
      throw new Error(`Tipo de arquivo não permitido: ${contentType}. Apenas imagens são aceitas.`);
    }

    
    if (contentLength > this.maxFileSize) {
      throw new Error(`Arquivo muito grande: ${contentLength} bytes. Máximo permitido: ${this.maxFileSize} bytes.`);
    }

    
    if (contentLength === 0) {
      throw new Error('Arquivo vazio ou corrompido');
    }
  }

 
  private generateFilename(url: string, contentType: string, index: number): string {
    try {
      
      const urlPath = new URL(url).pathname;
      const urlFilename = urlPath.split('/').pop();
      
      if (urlFilename?.includes('.')) {
        return urlFilename;
      }
    } catch {
      // Se falhar, usa nome padrão
    }

   
    const extension = contentType.split('/')[1] || 'jpg';
    return `image_${index}.${extension}`;
  }

}


export interface ProcessedImage {
  filename: string;
  contentType: string;
  base64: string; 
  size: number;
  originalUrl: string;
}
