# API OET - Integração com Sistema de Chamados

API para integração com sistema de chamados OET via URA do Omnihit.

## Estrutura do Projeto

```
src/
├── main.ts                     # Ponto de entrada da aplicação
├── app.module.ts               # Módulo raiz da aplicação
├── config/
│   └── app.config.ts          # Configurações centralizadas
├── modules/
│   ├── oet/                   # Módulo de integração OET
│   │   ├── controllers/
│   │   │   └── oet.controller.ts
│   │   ├── services/
│   │   │   ├── oet.service.ts
│   │   │   ├── file-processing.service.ts
│   │   │   └── oet-soap.service.ts
│   │   ├── dto/
│   │   │   └── create-incident.dto.ts
│   │   └── oet.module.ts
│   └── health/                # Módulo de health checks
│       ├── controllers/
│       │   └── health.controller.ts
│       └── health.module.ts
└── shared/
    ├── types/
    │   ├── oet.types.ts       # Tipos originais (legado)
    │   └── oet-api.types.ts   # Tipos baseados no contrato
    ├── constants/
    │   └── oet-api.constants.ts
    └── exceptions/
        └── oet-api.exceptions.ts
```

## Configuração

1. Copie o arquivo `env.example` para `.env`
2. Configure as variáveis de ambiente necessárias
3. Execute `npm install` para instalar dependências

## Scripts Disponíveis

- `npm run start:dev` - Inicia em modo desenvolvimento
- `npm run build` - Compila o projeto
- `npm run test` - Executa testes
- `npm run lint` - Executa linter

## Endpoints

### Health Check
- `GET /health` - Verifica se a aplicação está funcionando

### OET Integration
- `POST /api/v1/integrations/oet/incidents` - Cria incidência no sistema OET

## Próximos Passos

1. Implementar lógica nos serviços
2. Adicionar testes unitários e de integração
3. Configurar CI/CD
4. Documentar API com Swagger

