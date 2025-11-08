# Dockerfile customizado para n8n
FROM n8nio/n8n:latest

# Definir usuário root temporariamente
USER root

# Instalar dependências adicionais (se necessário)
RUN apk add --no-cache \
    tzdata \
    curl

# Configurar timezone
ENV TZ=America/Sao_Paulo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Voltar para usuário n8n
USER node

# Criar diretório de dados
RUN mkdir -p /home/node/.n8n

# Configurações
ENV N8N_PORT=5678
ENV NODE_ENV=production
ENV EXECUTIONS_PROCESS=main

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node /usr/local/lib/node_modules/n8n/dist/HealthCheck.js

EXPOSE 5678

CMD ["n8n"]

