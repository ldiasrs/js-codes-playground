// Client: Starts a portfolio analysis workflow with sample B3 stocks

import { Client, Connection } from '@temporalio/client';
import { portfolioAnalysisWorkflow } from './workflows/portfolio-analysis.workflow';
import { PortfolioInput } from './domain/types/portfolio';
import { TASK_QUEUE, WORKFLOW_ID_PREFIX } from './shared/constants';
import { todayISO } from './shared/utils/date';

// Sample portfolio: 3 major B3 stocks
const sampleInput: PortfolioInput = {
  stocks: [
    {
      ticker: 'PETR4',
      units: 200,
      purchasePrice: 32.50,
      purchaseDate: '2025-06-15',
    },
    {
      ticker: 'VALE3',
      units: 150,
      purchasePrice: 58.00,
      purchaseDate: '2025-03-20',
    },
    {
      ticker: 'ITUB4',
      units: 300,
      purchasePrice: 30.80,
      purchaseDate: '2025-09-10',
    },
  ],
  referenceDate: todayISO(),
  operationCost: 45.90,
};

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const workflowId = `${WORKFLOW_ID_PREFIX}-${Date.now()}`;

  console.log('Starting portfolio analysis workflow...');
  console.log(`Workflow ID: ${workflowId}`);
  console.log(`Task Queue: ${TASK_QUEUE}`);
  console.log(`Tickers: ${sampleInput.stocks.map((s) => s.ticker).join(', ')}`);
  console.log(`Reference Date: ${sampleInput.referenceDate}`);
  console.log('---');

  const handle = await client.workflow.start(portfolioAnalysisWorkflow, {
    args: [sampleInput],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  console.log(`Workflow started. Waiting for result...`);

  const result = await handle.result();

  console.log('\n========================================');
  console.log('   PORTFOLIO ANALYSIS REPORT');
  console.log('========================================\n');

  // Print summary
  const s = result.summary;
  console.log('--- SUMMARY ---');
  console.log(`Reference Date:        ${s.referenceDate}`);
  console.log(`Number of Stocks:      ${s.numberOfStocks}`);
  console.log(`Total Invested:        R$ ${s.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`Total Current Value:   R$ ${s.totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`Total P/L:             R$ ${s.totalProfitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${s.totalProfitLossPercent.toFixed(2)}%)`);
  console.log(`Operation Cost:        R$ ${s.operationCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`Net P/L:               R$ ${s.netProfitLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${s.netProfitLossPercent.toFixed(2)}%)`);

  // Print per-stock breakdown
  console.log('\n--- STOCK BREAKDOWN ---');
  for (const stock of result.stocks) {
    const a = stock.analysis;
    const f = stock.financials;
    console.log(`\n  ${a.ticker}`);
    console.log(`    Units:              ${a.units}`);
    console.log(`    Purchase Price:     R$ ${a.purchasePrice.toFixed(2)}`);
    console.log(`    Current Price:      R$ ${a.currentPrice.toFixed(2)}`);
    console.log(`    Total Invested:     R$ ${a.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`    Current Value:      R$ ${a.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`    P/L:                R$ ${a.profitLoss.absoluteProfitLoss.toFixed(2)} (${a.profitLoss.percentageProfitLoss.toFixed(2)}%)`);
    console.log(`    Holding Period:     ${a.returnMetrics.holdingMonths} months`);
    console.log(`    Monthly Return:     ${a.returnMetrics.monthlyReturnPercent.toFixed(2)}%`);
    console.log(`    Annualized Return:  ${a.returnMetrics.annualizedReturnPercent.toFixed(2)}%`);
    console.log(`    P/E Ratio:          ${f.peRatio}`);
    console.log(`    Dividend Yield:     ${f.dividendYield}%`);

    if (stock.news.length > 0) {
      console.log(`    Recent News:`);
      for (const n of stock.news) {
        console.log(`      - ${n.headline} (${n.source})`);
      }
    }
  }

  console.log('\n========================================');
  console.log(`Report generated at: ${result.generatedAt}`);
  console.log('========================================\n');

  // Also print raw JSON for programmatic use
  console.log('--- RAW JSON ---');
  console.log(JSON.stringify(result, null, 2));
}

run().catch((err) => {
  console.error('Client failed:', err);
  process.exit(1);
});
