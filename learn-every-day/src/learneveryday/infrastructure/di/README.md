# InversifyJS Dependency Injection Setup

Este documento explica como o InversifyJS foi configurado no projeto LearnEveryday para gerenciar dependências e injeções.

## 📋 Visão Geral

O projeto utiliza InversifyJS para implementar Inversão de Controle (IoC) e Injeção de Dependência (DI), proporcionando:

- **Gerenciamento centralizado de dependências**
- **Redução de acoplamento entre classes**
- **Facilitação de testes unitários**
- **Melhoria na manutenibilidade do código**

## 🏗️ Arquitetura

### Abordagem Híbrida

O projeto utiliza uma abordagem híbrida para maximizar os benefícios do DI:

1. **Dependency Injection Completo** para:
   - Repositórios (NedbCustomerRepository, NedbTopicRepository, etc.)
   - Ports (GenerateTopicHistoryPort, SendTopicHistoryByEmailPort)
   - Services (SchedulingService)

2. **Factory Pattern** para:
   - Features (CreateCustomerFeature, AddTopicFeature, etc.)
   - Commands (CreateCustomerCommand, AddTopicCommand, etc.)
   - Queries (GetAllCustomersQuery, GetCustomerByIdQuery, etc.)

## 📁 Estrutura de Arquivos

```
src/learneveryday/infrastructure/di/
├── container.ts          # Configuração principal do container
├── types.ts             # Identificadores de tipos para DI
└── README.md            # Esta documentação
```

## 🔧 Configuração

### 1. Dependências Instaladas

```bash
npm install inversify reflect-metadata @types/commander
```

### 2. TypeScript Configuration

O `tsconfig.json` foi configurado para suportar decorators:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 3. Container Configuration

O container é configurado em `container.ts`:

```typescript
export class ContainerBuilder {
  public static build(dataDir: string = './data/production/led'): Container {
    // Configuração do container
  }
}
```

## 🎯 Tipos de Dependências

### Repositórios (Completamente Injetados)

```typescript
// Bind repositories
this.container.bind<CustomerRepositoryPort>(TYPES.CustomerRepository)
  .to(NedbCustomerRepository)
  .inSingletonScope();
```

**Repositórios disponíveis:**
- `CustomerRepository` → `NedbCustomerRepository`
- `TopicRepository` → `NedbTopicRepository`
- `TopicHistoryRepository` → `NedbTopicHistoryRepository`
- `ScheduledTaskRepository` → `NedbScheduledTaskRepository`

### Ports (Injetados via Factory)

```typescript
// Bind ports
this.container.bind<GenerateTopicHistoryPort>(TYPES.GenerateTopicHistoryPort)
  .toDynamicValue(() => TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv())
  .inSingletonScope();
```

**Ports disponíveis:**
- `GenerateTopicHistoryPort` → `TopicHistoryGeneratorFactory.createChatGptGeneratorFromEnv()`
- `SendTopicHistoryByEmailPort` → `EmailSenderFactory.createNodemailerSender()`

### Services (Injetados via Factory)

```typescript
// Bind services
this.container.bind<SchedulingService>(TYPES.SchedulingService)
  .toDynamicValue(() => SchedulingServiceFactory.create(dataDir))
  .inSingletonScope();
```

**Services disponíveis:**
- `SchedulingService` → `SchedulingServiceFactory.create(dataDir)`

## 🚀 Uso no CLI

### Inicialização do Container

```typescript
private async initializeContainer(): Promise<void> {
  if (!this.container) {
    this.container = ContainerBuilder.build(this.dataDir);
  }
}
```

### Obtenção de Dependências

```typescript
// Obter repositórios do container
const customerRepository = this.container.get<CustomerRepositoryPort>(TYPES.CustomerRepository);
const topicRepository = this.container.get<TopicRepositoryPort>(TYPES.TopicRepository);

// Criar features manualmente (factory pattern)
const createCustomerFeature = new CreateCustomerFeature(customerRepository, topicRepository);

// Criar commands manualmente
const command = new CreateCustomerCommand(data, createCustomerFeature);
```

## 🧪 Testes

### Teste de Dependency Injection

Execute o teste para verificar se o DI está funcionando:

```bash
npx ts-node --project tsconfig.node.json src/learneveryday/examples/test-di.ts
```

**O teste verifica:**
- Construção do container
- Injeção de repositórios
- Injeção de ports
- Injeção de services
- Comportamento singleton
- Métodos dos repositórios

## 🔄 Ciclo de Vida

### Singleton Scope

Todas as dependências são configuradas como singletons:

```typescript
.inSingletonScope()
```

Isso garante que:
- Uma única instância é criada e reutilizada
- Recursos são gerenciados eficientemente
- Estado é mantido consistentemente

### Reset do Container

Para testes, o container pode ser resetado:

```typescript
ContainerBuilder.reset();
```

## 📈 Benefícios Implementados

### 1. Inversão de Controle (IoC)
- As classes não criam suas próprias dependências
- O container gerencia a criação e injeção

### 2. Injeção de Dependência (DI)
- Dependências são injetadas automaticamente
- Reduz acoplamento entre classes

### 3. Gerenciamento Centralizado
- Todas as dependências são configuradas em um local
- Fácil de modificar e manter

### 4. Facilita Testes Unitários
- Dependências podem ser mockadas facilmente
- Testes são mais isolados e confiáveis

### 5. Melhora Manutenibilidade
- Mudanças em dependências são centralizadas
- Código é mais modular e reutilizável

## 🔧 Extensibilidade

### Adicionando Novas Dependências

1. **Adicione o tipo em `types.ts`:**
```typescript
export const TYPES = {
  // ... existing types
  NewService: Symbol.for('NewService'),
} as const;
```

2. **Configure o binding em `container.ts`:**
```typescript
this.container.bind<NewServicePort>(TYPES.NewService)
  .to(NewServiceImplementation)
  .inSingletonScope();
```

3. **Use no código:**
```typescript
const newService = this.container.get<NewServicePort>(TYPES.NewService);
```

## 🚨 Considerações Importantes

### Decorators
- Decorators são usados apenas nos repositórios
- Features, Commands e Queries usam factory pattern
- Isso evita problemas de configuração de decorators

### Performance
- Container é construído uma vez e reutilizado
- Dependências são singletons para eficiência
- Lazy loading para dependências pesadas

### Testes
- Container pode ser resetado entre testes
- Dependências podem ser mockadas facilmente
- Testes são isolados e confiáveis

## 📚 Recursos Adicionais

- [InversifyJS Documentation](https://inversify.io/)
- [Dependency Injection Patterns](https://martinfowler.com/articles/injection.html)
- [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) 