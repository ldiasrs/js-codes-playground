// Infrastructure: Mock news provider with realistic B3 stock news
// Replace this with a real news API by implementing the NewsProvider interface

import { NewsProvider } from '../../application/ports/news-provider';
import { StockNews } from '../../domain/types/stock';

const MOCK_NEWS: Record<string, StockNews[]> = {
  PETR4: [
    {
      ticker: 'PETR4',
      headline: 'Petrobras anuncia aumento de dividendos para o 2º trimestre',
      source: 'InfoMoney',
      publishedAt: '2026-04-10T14:30:00Z',
      summary:
        'A Petrobras anunciou um aumento significativo nos dividendos, refletindo os fortes resultados operacionais do trimestre anterior e a política de distribuição de lucros da empresa.',
      url: 'https://example.com/petr4-dividendos',
    },
    {
      ticker: 'PETR4',
      headline: 'Petrobras inicia nova fase de exploração no pré-sal',
      source: 'Valor Econômico',
      publishedAt: '2026-04-09T10:15:00Z',
      summary:
        'A estatal brasileira de petróleo iniciou operações em um novo bloco do pré-sal, com expectativa de aumentar a produção em 200 mil barris por dia até 2027.',
      url: 'https://example.com/petr4-pre-sal',
    },
  ],
  VALE3: [
    {
      ticker: 'VALE3',
      headline: 'Vale reporta crescimento de 15% na produção de minério de ferro',
      source: 'Bloomberg Línea',
      publishedAt: '2026-04-10T16:00:00Z',
      summary:
        'A Vale divulgou relatório de produção do 1T26 mostrando crescimento expressivo na produção de minério de ferro, impulsionado pela operação de S11D.',
      url: 'https://example.com/vale3-producao',
    },
    {
      ticker: 'VALE3',
      headline: 'Preço do minério de ferro atinge US$ 120 na bolsa de Dalian',
      source: 'Reuters',
      publishedAt: '2026-04-08T08:45:00Z',
      summary:
        'O preço do minério de ferro subiu para US$ 120 por tonelada, beneficiando mineradoras brasileiras como a Vale.',
      url: 'https://example.com/vale3-minerio',
    },
  ],
  ITUB4: [
    {
      ticker: 'ITUB4',
      headline: 'Itaú Unibanco registra lucro líquido recorde no 1T26',
      source: 'Exame',
      publishedAt: '2026-04-10T09:00:00Z',
      summary:
        'O maior banco privado do Brasil reportou lucro líquido recorde de R$ 10,2 bilhões no primeiro trimestre de 2026, superando as estimativas dos analistas.',
      url: 'https://example.com/itub4-lucro',
    },
  ],
  BBDC4: [
    {
      ticker: 'BBDC4',
      headline: 'Bradesco acelera transformação digital com investimento bilionário',
      source: 'Folha de São Paulo',
      publishedAt: '2026-04-09T11:30:00Z',
      summary:
        'O Bradesco anunciou investimento de R$ 5 bilhões em tecnologia e transformação digital para 2026, visando melhorar a experiência do cliente e reduzir custos operacionais.',
      url: 'https://example.com/bbdc4-digital',
    },
  ],
  WEGE3: [
    {
      ticker: 'WEGE3',
      headline: 'WEG expande operações de energia solar na América Latina',
      source: 'Canal Energia',
      publishedAt: '2026-04-10T13:00:00Z',
      summary:
        'A WEG anunciou expansão de suas operações de energia solar com nova fábrica no México e contratos de fornecimento em toda a América Latina.',
      url: 'https://example.com/wege3-solar',
    },
  ],
};

export class MockNewsProvider implements NewsProvider {
  async fetchNews(tickers: string[]): Promise<StockNews[]> {
    // Simulate network latency
    await delay(80);

    const allNews: StockNews[] = [];
    for (const ticker of tickers) {
      const tickerNews = MOCK_NEWS[ticker.toUpperCase()];
      if (tickerNews) {
        allNews.push(...tickerNews);
      } else {
        // Generate a generic news item for unknown tickers
        allNews.push({
          ticker,
          headline: `${ticker}: Análise de mercado indica estabilidade`,
          source: 'Mercado Genérico',
          publishedAt: new Date().toISOString(),
          summary: `Analistas consideram o cenário atual para ${ticker} como estável, sem grandes variações esperadas no curto prazo.`,
          url: `https://example.com/${ticker.toLowerCase()}-analise`,
        });
      }
    }

    return allNews;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
