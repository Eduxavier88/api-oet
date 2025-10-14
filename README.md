# API OET - Integração com Sistema de Chamados

API NestJS para integração com sistema de chamados OET via URA do Omnihit.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem principal
- **Jest** - Testes unitários e integração
- **SonarQube** - Análise de qualidade
- **SOAP/WSDL** - Integração com OET

## 📁 Estrutura do Projeto

```
src/
├── main.ts                     # Ponto de entrada da aplicação
├── app.module.ts               # Módulo raiz da aplicação
├── config/
│   └── app.config.ts          # Configurações centralizadas
├── modules/
│   ├── oet/                   # Módulo de integração OET
│   │   ├── controllers/       # Endpoints REST
│   │   ├── services/          # Lógica de negócio
│   │   ├── use-cases/         # Casos de uso (Clean Architecture)
│   │   ├── dto/              # Validação de entrada
│   │   ├── mock/             # Simulações para desenvolvimento
│   │   ├── test/             # Testes unitários e integração
│   │   └── oet.module.ts
│   └── health/                # Módulo de health checks
└── shared/
    ├── types/                # Tipos TypeScript
    ├── constants/            # Constantes e configurações
    └── exceptions/           # Exceções customizadas
```

## ⚙️ Configuração

1. Clone o repositório
2. Copie o arquivo `.env.example` para `.env`
3. Configure as variáveis de ambiente necessárias
4. Execute `npm install` para instalar dependências

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev          # Inicia em modo desenvolvimento
npm run start:debug        # Inicia em modo debug

# Build e Produção
npm run build              # Compila o projeto
npm run start:prod         # Inicia versão de produção

# Testes e Qualidade
npm run test               # Executa testes
npm run test:cov           # Executa testes com cobertura
npm run test:watch         # Executa testes em modo watch
npm run lint               # Executa linter
npm run format             # Formata código

# Análise de Qualidade
npm run quality            # Executa testes + lint + build
npm run quality:sonar      # Executa análise completa + SonarQube
npm run sonar              # Executa análise SonarQube
```

## 🌐 Endpoints

### Health Check
- `GET /health` - Verifica se a aplicação está funcionando

### OET Integration
- `POST /api/v1/integrations/oet/incidents` - Cria incidência no sistema OET

## 📊 Qualidade de Código

- **Cobertura de Testes**: 67.58% statements, 56.43% branches
- **SonarQube**: Integrado com análise contínua
- **ESLint**: Configurado para TypeScript
- **TypeScript**: Modo strict habilitado

## 🧪 Testes

- **Unitários**: Use Cases e Services
- **Integração**: Controllers e endpoints
- **Mock**: Sistema de simulação para desenvolvimento

## 📈 Critérios de Aceitação

- ✅ Fluxo de coleta de dados
- ✅ Validação de campos obrigatórios
- ✅ Processamento de arquivos
- ✅ Integração SOAP com OET
- ✅ Tratamento de erros
- ✅ Logs estruturados
- ✅ Testes completos

