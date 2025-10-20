import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * @purpose Baixa imagens de URLs e converte para base64
 * @why O OET precisa receber imagens em formato base64
 * @collaborators ChatwootService, OetService
 * @inputs Array de URLs de imagens
 * @outputs Array de objetos com dados base64 e metadados
 * @sideEffects Faz downloads HTTP de imagens
 * @errors HttpException se download falhar
 * @examples downloadImages(['https://...']) → [{ base64: 'data:image/jpeg;base64,...', filename: 'image.jpg' }]
 */
@Injectable()
export class ImageDownloadService {
  private readonly logger = new Logger(ImageDownloadService.name);
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  constructor(private readonly httpService: HttpService) {}

  /**
   * @purpose Baixa múltiplas imagens e converte para base64
   * @why Processar todas as imagens de uma vez é mais eficiente
   * @collaborators ImageDownloadService
   * @inputs Array de URLs de imagens
   * @outputs Array de imagens processadas
   * @sideEffects Downloads HTTP paralelos
   * @errors HttpException se alguma imagem falhar
   * @examples downloadImages(['https://...', 'https://...'])
   */
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

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          const failedUrl = imageUrls[index];
          if (failedUrl) {
            failed.push(failedUrl);
            this.logger.error(`[IMAGE_DOWNLOAD] Falha ao processar ${failedUrl}: ${result.reason}`);
          }
        }
      });

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

  /**
   * @purpose Baixa uma única imagem e converte para base64
   * @why Processar uma imagem por vez com validações
   * @collaborators ImageDownloadService
   * @inputs URL da imagem, índice para logs
   * @outputs Imagem processada com base64
   * @sideEffects Download HTTP da imagem
   * @errors HttpException se download ou validação falhar
   * @examples downloadSingleImage('https://...', 0)
   */
  private async downloadSingleImage(url: string, index: number): Promise<ProcessedImage> {
    this.logger.log(`[IMAGE_DOWNLOAD] Baixando imagem ${index + 1}: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
          timeout: 15000, // 15 segundos
          maxContentLength: this.maxFileSize,
        })
      );

      const contentType = response.headers['content-type'] || '';
      const contentLength = parseInt(response.headers['content-length'] || '0', 10);

      // Validações
      this.validateImage(contentType, contentLength, url);

      // Converte para base64
      const base64 = Buffer.from(response.data).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;

      // Gera nome do arquivo
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

  /**
   * @purpose Valida se o arquivo é uma imagem válida
   * @why Garantir que só processamos imagens válidas e dentro dos limites
   * @collaborators ImageDownloadService
   * @inputs Content-type, tamanho, URL
   * @outputs Nenhum (lança erro se inválido)
   * @sideEffects Nenhum
   * @errors HttpException se validação falhar
   * @examples validateImage('image/jpeg', 1024, 'https://...')
   */
  private validateImage(contentType: string, contentLength: number, _url: string): void {
    // Verifica se é uma imagem
    if (!this.allowedTypes.includes(contentType)) {
      throw new Error(`Tipo de arquivo não permitido: ${contentType}. Apenas imagens são aceitas.`);
    }

    // Verifica tamanho
    if (contentLength > this.maxFileSize) {
      throw new Error(`Arquivo muito grande: ${contentLength} bytes. Máximo permitido: ${this.maxFileSize} bytes.`);
    }

    // Verifica se tem conteúdo
    if (contentLength === 0) {
      throw new Error('Arquivo vazio ou corrompido');
    }
  }

  /**
   * @purpose Gera nome de arquivo baseado na URL e tipo
   * @why Ter nomes consistentes para as imagens processadas
   * @collaborators ImageDownloadService
   * @inputs URL, content-type, índice
   * @outputs Nome do arquivo
   * @sideEffects Nenhum
   * @errors Nenhum
   * @examples generateFilename('https://...', 'image/jpeg', 0) → 'image_0.jpg'
   */
  private generateFilename(url: string, contentType: string, index: number): string {
    try {
      // Tenta extrair nome do arquivo da URL
      const urlPath = new URL(url).pathname;
      const urlFilename = urlPath.split('/').pop();
      
      if (urlFilename && urlFilename.includes('.')) {
        return urlFilename;
      }
    } catch {
      // Se falhar, usa nome padrão
    }

    // Nome padrão baseado no tipo e índice
    const extension = contentType.split('/')[1] || 'jpg';
    return `image_${index}.${extension}`;
  }
}

/**
 * @purpose Interface para imagem processada
 * @why Tipagem para imagens convertidas para base64
 * @collaborators ImageDownloadService
 * @inputs Nenhum
 * @outputs Estrutura de imagem processada
 * @sideEffects Nenhum
 * @errors Nenhum
 * @examples { filename: 'image.jpg', base64: 'data:image/jpeg;base64,...', size: 1024 }
 */
export interface ProcessedImage {
  filename: string;
  contentType: string;
  base64: string; // data:image/jpeg;base64,...
  size: number;
  originalUrl: string;
}
