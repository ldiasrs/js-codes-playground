# Financial Info Workflow - n8n

Workflow automatizado para gerar relatórios de ações brasileiras (B3) e americanas (NYSE/NASDAQ) e enviar por e-mail.

## 📋 Visão Geral

Este workflow do n8n:
1. Busca lista de ações de uma planilha Google Sheets
2. Separa as ações por mercado (Brasil vs EUA)
3. Usa Google Gemini AI para gerar relatório HTML completo
4. Envia o relatório por e-mail via Gmail

## 🔄 Fluxo do Workflow

```
Schedule Trigger
      ↓
GetStockRows (Google Sheets)
      ↓
SplitStocksByMarket (Code Node)
      ↓
Financial Stock Info (Google Gemini AI)
      ↓
Send a message (Gmail)
```

## 📦 Nós do Workflow

### 1. Schedule Trigger
- **Tipo**: Trigger agendado
- **Configuração**: Segunda-feira às 11h
- **Função**: Inicia o workflow automaticamente

### 2. GetStockRows
- **Tipo**: Google Sheets
- **Função**: Lê lista de ações da planilha
- **Formato esperado**:
  | ticker | market |
  |--------|--------|
  | ITSA4  | BR     |
  | AAPL   | US     |
  | ITUB4  | BR     |
  | GOOGL  | US     |

### 3. SplitStocksByMarket
- **Tipo**: Code (JavaScript)
- **Função**: Separa ações por mercado
- **Saída**:
```json
{
  "brazil": ["ITSA4", "ITUB4", "SEER3"],
  "us": ["AAPL", "GOOGL", "MSFT"],
  "data_geracao": "08/11/2025 14:30",
  "total_brazil": 3,
  "total_us": 3,
  "total": 6
}
```

### 4. prompt_text
- **Tipo**: Code (JavaScript)
- **Função**: Carrega o prompt otimizado para o modelo
- **Nota**: Em produção, pode ser substituído por leitura de arquivo

### 5. Financial Stock Info
- **Tipo**: Google Gemini AI
- **Modelo**: gemini-2.5-flash
- **Função**: Gera relatório HTML com dados reais
- **Input**: Lista de ações + Prompt
- **Output**: HTML completo

### 6. Send a message
- **Tipo**: Gmail
- **Função**: Envia relatório por e-mail
- **Destinatário**: Configurável
- **Assunto**: "Financial info [data/hora]"

## 🔌 Credenciais Necessárias

### 1. Google Gemini (PaLM) API
- Acesse: [Google AI Studio](https://makersuite.google.com/app/apikey)
- Crie uma API Key
- Configure no n8n:
  - Credentials → New → Google PaLM API
  - Cole a API Key
  - Salve como "Google Gemini(PaLM) Api account"

### 2. Google Sheets OAuth2
- Configure OAuth2 para acessar planilhas
- Permissões necessárias: Leitura de planilhas
- Salve como "Google Sheets account"

### 3. Gmail OAuth2
- Configure OAuth2 para envio de e-mails
- Permissões necessárias: Envio de e-mails
- Salve como "Gmail account"

## 📊 Estrutura da Planilha Google Sheets

### Colunas Obrigatórias:

| Coluna | Tipo   | Exemplo | Descrição                    |
|--------|--------|---------|------------------------------|
| ticker | String | ITSA4   | Código da ação               |
| market | String | BR      | Mercado (BR ou US)           |

### Exemplo:

```
ticker | market
-------|-------
ITSA4  | BR
ITUB4  | BR
SEER3  | BR
LOGG3  | BR
AAPL   | US
GOOGL  | US
MSFT   | US
TSLA   | US
```

## 🚀 Como Usar

### 1. Importar Workflow

```bash
# No n8n, vá em:
Workflows → Import from File → Selecione financial-info-flow-updated.json
```

### 2. Configurar Credenciais

Após importar, você verá avisos de credenciais faltando. Configure:

1. **Google Gemini API**: Adicione sua API Key
2. **Google Sheets**: Conecte sua conta Google
3. **Gmail**: Conecte sua conta Gmail

### 3. Ajustar Configurações

**GetStockRows Node:**
- Atualize o `documentId` com o ID da sua planilha
- Ajuste o `sheetName` se necessário

**Send a message Node:**
- Altere o `sendTo` para seu e-mail

### 4. Testar Workflow

```
1. Clique em "Execute Workflow"
2. Aguarde a execução
3. Verifique o e-mail recebido
```

### 5. Ativar Agendamento

```
1. Toggle "Active" no workflow
2. O workflow rodará automaticamente toda segunda às 11h
```

## 📝 Formato da Planilha

### Detecção Automática de Mercado

Se sua planilha não tiver a coluna `market`, o código detecta automaticamente:

- **Ações Brasileiras**: Padrão `XXXX3`, `XXXX4`, `XXXX11` (ex: ITSA4, VALE3)
- **Ações Americanas**: Apenas letras (ex: AAPL, GOOGL)

### Variações de Nomes de Colunas

O código aceita:
- `ticker`, `Ticker`, `TICKER`
- `market`, `Market`, `MARKET`

## 🎨 Customizações

### Alterar Frequência

No nó `Schedule Trigger`:
```javascript
{
  "field": "days",     // ou "hours", "minutes"
  "triggerAtHour": 18  // Horário (0-23)
}
```

### Adicionar Mais Ações

Simplesmente adicione mais linhas na planilha Google Sheets.

### Customizar E-mail

No nó `Send a message`:
```javascript
{
  "sendTo": "seu-email@example.com",
  "subject": "Seu Assunto Customizado",
  "cc": "outro-email@example.com"  // opcional
}
```

### Modificar o Prompt

Edite o arquivo `src/prompt.md` e atualize o conteúdo no nó `prompt_text`.

## 🔧 Troubleshooting

### Problema: "Missing credentials"
**Solução**: Configure todas as 3 credenciais necessárias (Gemini, Sheets, Gmail)

### Problema: Planilha não encontrada
**Solução**: Verifique o `documentId` no nó GetStockRows

### Problema: E-mail não chega
**Solução**: 
1. Verifique permissões OAuth do Gmail
2. Verifique caixa de spam
3. Teste o nó Gmail separadamente

### Problema: Relatório com placeholders
**Solução**: 
1. O modelo Gemini pode estar sem acesso a dados em tempo real
2. Considere adicionar um nó HTTP para buscar cotações reais via API
3. Passe os dados como contexto para o modelo

## 📚 Melhorias Futuras

### 1. Buscar Cotações via API

Adicione um nó HTTP Request antes do Gemini:

```javascript
// Exemplo com Brapi
URL: https://brapi.dev/api/quote/{{ $json.ticker }}
Method: GET
```

### 2. Cache de Dados

Use um nó Redis ou banco de dados para cachear cotações.

### 3. Múltiplos Destinatários

Leia lista de e-mails de uma planilha e envie para todos.

### 4. Dashboard Web

Crie um endpoint webhook para visualizar o relatório no navegador.

## 📄 Arquivos do Projeto

```
n8n-financial-info/
├── README.md                          # Este arquivo
├── financial-info-flow-updated.json   # Workflow atualizado (BR + US)
├── financial-info-flow.json           # Workflow original (só BR)
└── src/
    └── prompt.md                      # Prompt otimizado
```

## 🤝 Contribuindo

Sugestões de melhoria:
1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/melhoria`)
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## ⚠️ Disclaimer

Este workflow é para fins informativos e educacionais. Não constitui recomendação de investimento. Consulte sempre um profissional habilitado antes de tomar decisões financeiras.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação do n8n
2. Consulte a documentação do Google Gemini
3. Abra uma issue no repositório

---

**Versão**: 2.0  
**Última atualização**: Novembro 2025  
**Compatibilidade**: n8n v1.0+

