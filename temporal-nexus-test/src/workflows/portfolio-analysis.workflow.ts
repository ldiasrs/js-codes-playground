// Workflow: Portfolio Analysis
// Orchestrates the 4-step financial analysis pipeline for Brazilian stocks.
//
// This workflow is deterministic: it uses only proxyActivities to interact
// with the outside world. All side effects happen inside activities.

import { proxyActivities, log } from '@temporalio/workflow';
import type { Activities } from '../activities';
import type { PortfolioInput } from '../domain/types/portfolio';
import type { PortfolioReport } from '../domain/types/report';

// Configure activity proxies with retry policies and timeouts
const {
  fetchFinancialData,
  fetchNews,
  calculateFinancials,
  aggregateReport,
} = proxyActivities<Activities>({
  startToCloseTimeout: '30s',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '10s',
  },
});

/**
 * Main portfolio analysis workflow.
 *
 * Steps:
 * 1. Fetch financial data + news in parallel (independent external calls)
 * 2. Calculate financial metrics for each stock (depends on step 1)
 * 3. Aggregate into final report (depends on steps 1 + 2)
 */
export async function portfolioAnalysisWorkflow(
  input: PortfolioInput
): Promise<PortfolioReport> {
  const tickers = input.stocks.map((s) => s.ticker);
  const referenceDate = input.referenceDate;

  log.info('Starting portfolio analysis', {
    tickers,
    referenceDate,
    stockCount: tickers.length,
  });

  // Step 1: Fetch financial data and news in parallel
  log.info('Step 1: Fetching financial data and news in parallel');
  const [stockDataList, newsList] = await Promise.all([
    fetchFinancialData(tickers, referenceDate),
    fetchNews(tickers),
  ]);

  log.info('Step 1 complete', {
    stockDataCount: stockDataList.length,
    newsCount: newsList.length,
  });

  // Step 2: Calculate financial metrics for each stock
  log.info('Step 2: Calculating financial metrics');
  const analyses = await calculateFinancials(
    input.stocks,
    stockDataList,
    referenceDate
  );

  log.info('Step 2 complete', { analysesCount: analyses.length });

  // Step 3: Aggregate final report
  log.info('Step 3: Aggregating final report');
  const report = await aggregateReport(
    analyses,
    stockDataList,
    newsList,
    input.operationCost,
    referenceDate
  );

  log.info('Portfolio analysis complete', {
    totalInvested: report.summary.totalInvested,
    totalCurrentValue: report.summary.totalCurrentValue,
    netProfitLoss: report.summary.netProfitLoss,
  });

  return report;
}
