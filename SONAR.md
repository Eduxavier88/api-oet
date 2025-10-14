# SonarQube Scanner - API OET

## 📊 Configuração de Qualidade de Código

Este projeto está configurado para análise de qualidade de código com SonarQube Scanner.

### 🔧 Pré-requisitos

1. **SonarQube Server** rodando (local ou remoto)
2. **SonarQube Scanner** instalado
3. **Node.js** e **npm** instalados

### 📋 Scripts Disponíveis

```bash
# Executar testes com cobertura
npm run test:cov

# Executar análise completa de qualidade
npm run quality

# Executar análise completa + SonarQube
npm run quality:sonar

# SonarQube local (localhost:9000)
npm run sonar:local

# SonarQube remoto
npm run sonar
```

### 🎯 Métricas de Cobertura

- **Statements**: 67.58%
- **Branches**: 56.43%
- **Functions**: 51.85%
- **Lines**: 67.48%

### 📁 Arquivos de Configuração

- `sonar-project.properties` - Configuração do SonarQube
- `jest.config.js` - Configuração de testes e cobertura
- `.sonarqubeignore` - Arquivos ignorados pelo SonarQube

### 🚀 Como Usar

#### 1. Análise Local (Desenvolvimento)

```bash
# Instalar dependências
npm install

# Executar testes com cobertura
npm run test:cov

# Executar análise de qualidade
npm run quality
```

#### 2. Análise com SonarQube Local

```bash
# Iniciar SonarQube local (porta 9000)
# Acessar: http://localhost:9000

# Executar scanner
npm run sonar:local
```

#### 3. Análise com SonarQube Remoto

```bash
# Configurar variáveis de ambiente
export SONAR_HOST_URL=https://your-sonar-server.com
export SONAR_TOKEN=your-sonar-token

# Executar scanner
npm run sonar
```

### 📊 Relatórios Gerados

- **HTML**: `coverage/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`

### 🔍 Qualidade de Código

O projeto segue as melhores práticas:

- ✅ **TypeScript Strict Mode**
- ✅ **ESLint** com regras de qualidade
- ✅ **Jest** para testes unitários e integração
- ✅ **Cobertura de código** configurada
- ✅ **Logger estruturado** (NestJS)
- ✅ **Validação de entrada** (class-validator)
- ✅ **Arquitetura limpa** (Use Cases)

### 📈 Melhorias Contínuas

Para melhorar a qualidade:

1. **Aumentar cobertura de testes**
2. **Reduzir complexidade ciclomática**
3. **Eliminar código duplicado**
4. **Melhorar documentação**
5. **Aplicar princípios SOLID**

### 🛠️ Troubleshooting

#### Erro: "SonarQube Scanner not found"

```bash
# Instalar SonarQube Scanner globalmente
npm install -g sonar-scanner

# Ou usar npx
npx sonar-scanner
```

#### Erro: "Coverage file not found"

```bash
# Regenerar cobertura
npm run test:cov

# Verificar se arquivo existe
ls -la coverage/lcov.info
```

#### Erro: "Quality Gate failed"

```bash
# Verificar métricas
npm run test:cov

# Ajustar thresholds em jest.config.js
# Ou configurar Quality Gate no SonarQube
```
