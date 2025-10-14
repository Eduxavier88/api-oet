import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface ProcessedFile {
  file: string; 
  fil_sizexx: number; 
  nom_filexx: string; 
  tip_attach: string; 
}

@Injectable()
export class ProcessFilesUseCase {
  constructor(private readonly httpService: HttpService) {}

  async execute(filesUrls?: string): Promise<ProcessedFile[]> {
    if (!filesUrls) {
      return [];
    }

    
    const urls = filesUrls.split(',').map(url => url.trim());
    const results: ProcessedFile[] = [];

    for (const url of urls) {
      try {
        // Download do arquivo
        const response = await this.httpService.axiosRef.get(url, {
          responseType: 'arraybuffer',
          timeout: 15000
        });

        // Converter para base64
        const buffer = Buffer.from(response.data);
        const base64Content = buffer.toString('base64');

        
        const fileName = url.split('/').pop() || 'file';
        
        // Criar objeto processado
        results.push({
          file: base64Content,
          fil_sizexx: buffer.length,
          nom_filexx: fileName,
          tip_attach: response.headers['content-type'] || 'application/octet-stream'
        });
      } catch (error) {
        throw error;
      }
    }

    return results;
  }
}