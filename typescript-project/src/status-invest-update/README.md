# 📊 Status Invest Update

CLI that reads a Status Invest transactions export, groups the operations by
`categoryId` (ordered by `referenceDate` ascending), and writes **one
color-themed, timestamped tab per category** into the Google Spreadsheet
configured under `update_invest_spread_sheet`. Optionally, a CDB export file
creates an extra `CDB-<timestamp>` tab.

## 🚀 How to execute

From the `typescript-project` root:

```bash
# transactions only
npm run status-invest-update -- -f data/investimentos/transactions/transactions-2026-07-13.json

# transactions + CDB file (extra CDB tab)
npm run status-invest-update -- \
  -f data/investimentos/transactions/transactions-2026-07-13.json \
  -c data/investimentos/transactions/CDBS-transactions-2026-07-13
```

| Option | Required | Description |
| --- | --- | --- |
| `-f, --file <path>` | yes | Transactions JSON export (records under `[0].walletPositionHistoryModels`) |
| `-c, --cdb <path>` | no | CDB export (flat JSON array; the file may have no extension) |

The console prints one line per created tab with its row count and direct URL.

## 🔑 Prerequisites

`config/global-config.prod.json` must contain the `update_invest_spread_sheet`
block with `spread_sheet_id` and the `google_json_key` service-account
credentials (same config used by `npm run update-spreadsheet`).

## 📄 Output

Each tab is named `<group>-YYYY-MM-DD-HHhMMmSSs` (e.g. `Acoes-2026-07-13-10h11m30s`,
`CDB-2026-07-13-10h11m31s`). Old tabs are never deleted — every run adds new
timestamped tabs.

**Transaction tabs** (one per `categoryId`: `Acoes`, `Stocks`, `FundosImobiliarios`,
`FundosInvestimento`, `TesouroDireto`, `ETF`, `Criptomoedas`, ...):

`referenceDate, brokerId, broker, code, name, operationType, quantity, lineStatus, unitValue, totalValue`

**CDB tab** (only when `--cdb` is given):

`referenceDate, brokerId, brokerName, emissorId, emissorName, investimentType, firstDate, expiredate, displayName, rateType, indexerType, rate, currentValue, initalValue, ganhoBruto, withdrawalValue`

Formatting: each group has its own color (tab color = header color), bold white
header on a frozen first row, zebra row banding in the group's hue, numbers
right-aligned and dates (`DD/MM/YYYY`) centered.

## 🏗️ Architecture (hexagonal)

"Sheet" is an adapter-only concept — the inner layers speak a neutral
`ExportDefinition` / `ExportWriter` contract, so the output target could be
swapped (CSV, Excel, ...) without touching domain or application code.

```
index.ts                        CLI + composition root (commander, wiring)
domain/
  model/                        Transaction, CdbPosition, ExportDefinition
  service/                      TransactionGrouper, TransactionRowMapper, CdbRowMapper (pure)
application/
  port/                         TransactionSource, CdbSource, ExportWriter (interfaces)
  UpdateStatusInvestUseCase.ts  load -> group -> map -> write each ExportDefinition
adapter/
  config/                       loads update_invest_spread_sheet credentials
  file/                         JSON file sources (transactions + extensionless CDB)
  sheet/                        GoogleSheetExporter, SheetNamer, sheetThemes
```

## 🧪 Tests

```bash
npm test -- status-invest-update
```
