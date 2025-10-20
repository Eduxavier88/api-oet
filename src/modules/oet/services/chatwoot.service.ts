import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * @purpose Busca mensagens de uma conversa no Chatwoot
 * @why Precisamos verificar se há imagens anexadas na conversa antes de enviar para OET
 * @collaborators OetService, ImageDownloadService
 * @inputs conversationId, accountId
 * @outputs Array de mensagens com anexos
 * @sideEffects Faz requisição HTTP para Chatwoot
 * @errors HttpException se token inválido ou conversa não encontrada
 * @examples getConversationMessages('33809', '1') → { messages: [...], attachments: [...] }
 */
@Injectable()
export class ChatwootService {
  private readonly logger = new Logger(ChatwootService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('CHATWOOT_BASE_URL') || '';
    this.token = this.configService.get<string>('CHATWOOT_TOKEN') || '';
  }


  async getConversationMessages(conversationId: string, accountId: string = '1'): Promise<ChatwootConversationResponse> {
    if (!this.token) {
      throw new HttpException('Token do Chatwoot não configurado. Configure CHATWOOT_TOKEN nas variáveis de ambiente.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!this.baseUrl) {
      throw new HttpException('URL base do Chatwoot não configurada. Configure CHATWOOT_BASE_URL nas variáveis de ambiente.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const url = `${this.baseUrl}/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    
    this.logger.log(`[CHATWOOT] Buscando mensagens da conversa ${conversationId} na conta ${accountId}`);
    
    this.logger.log('[CHATWOOT] Preparando requisição de mensagens');

    try {
      
      let lastError: any;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          this.logger.log(`[CHATWOOT] Tentativa ${attempt}/3`);
          const response = await firstValueFrom(
            this.httpService.get(url, {
              headers: {
                'api_access_token': this.token,
                'Content-Type': 'application/json',
              },
              timeout: 30000, 
            })
          );

                 this.logger.log(`[CHATWOOT] Resposta recebida: ${response.status}`);

          return response.data;
        } catch (error) {
          lastError = error;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          this.logger.warn(`[CHATWOOT] Tentativa ${attempt} falhou: ${errorMessage}`);
          
          
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); 
          }
        }
      }
      
     
      throw lastError;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`[CHATWOOT] Erro ao buscar mensagens: ${errorMessage}`);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as any;
        if (httpError.response?.status === 401) {
          throw new HttpException('Token do Chatwoot inválido ou expirado', HttpStatus.UNAUTHORIZED);
        }
        
        if (httpError.response?.status === 404) {
          throw new HttpException('Conversa não encontrada no Chatwoot', HttpStatus.NOT_FOUND);
        }
      }
      
      throw new HttpException(
        `Erro ao buscar mensagens no Chatwoot: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

 
  
  extractImageUrls(messages: ChatwootMessage[]): string[] {
    const imageUrls: string[] = [];
    
    messages.forEach(message => {
      if (message.attachments && message.attachments.length > 0) {
        message.attachments.forEach(attachment => {
          // Verifica se é uma imagem baseado no file_type
          if (attachment.file_type === 'image') {
            const imageUrl = attachment.data_url || attachment.file_url;
            if (imageUrl) {
              imageUrls.push(imageUrl);
            }
          }
        });
      }
    });

    this.logger.log(`[CHATWOOT] Encontradas ${imageUrls.length} imagens na conversa`);
    return imageUrls;
  }
}


export interface ChatwootConversationResponse {
  payload: ChatwootMessage[];
  meta?: {
    count: number;
    current_page: number;
    total_pages: number;
  };
}


 
export interface ChatwootMessage {
  id: number;
  content: string;
  message_type: 'incoming' | 'outgoing';
  created_at: string;
  attachments?: ChatwootAttachment[];
}


export interface ChatwootAttachment {
  id: number;
  file_type: string;
  data_url?: string;
  file_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
}
