import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { OetModule } from './modules/oet/oet.module';
import { HealthModule } from './modules/health/health.module';
/**
 * @purpose Módulo raiz da aplicação que configura e organiza todos os módulos
 * @why Necessário para bootstrap da aplicação NestJS
 * @collaborators HealthModule, ConfigModule
 * @inputs Nenhum
 * @outputs Módulo configurado da aplicação
 * @sideEffects Nenhum
 * @errors Nenhum
 * @examples AppModule é importado automaticamente pelo main.ts
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    HttpModule.register({
      timeout: parseInt(process.env['HTTP_TIMEOUT'] || '15000', 10),
      maxRedirects: 2,
    }),
    OetModule,
    HealthModule,
  ],
 
})
export class AppModule {}
