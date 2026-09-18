# 📊 Status Invest Update

Publishes one **snapshot** of an investment wallet as dated Google Spreadsheet
tabs. Snapshot-update is the only mode: point it at an exported history folder
and it creates four tabs — `acoes-br`, `fundos`, `renda-fixa` and a `resumo`
that consolidates them.

```bash
npm run status-invest-update -- --folder data/investimentos/historico-investimentos/2026-09-17-12h53m13

# check the formulas and the number/date normalisation without writing anything
npm run status-invest-update -- --folder <path> --dry-run
```

| Option | Required | Description |
| --- | --- | --- |
| `-f, --folder <path>` | unless configured | Snapshot folder, e.g. `…/2026-09-17-12h53m13` |
| `--dry-run` | no | Print the tabs instead of publishing them |

With no `--folder`, `update_invest_spread_sheet.snapshot_update.source_folder`
in `config/global-config.prod.json` is used.

## 📑 What it produces

Tabs are named `<asset-class>-YYYY-MM-DD-HHhMMm` from the **run** time, so each
run adds tabs and never collides with an earlier one:
`acoes-br-2026-09-28-18h00m`. The `resumo` tab is published last and its
formulas point at the three tabs from the same run.

Every cell is a real value, never a pre-formatted string: money is numeric with
a `R$ #.##0,00` format, dates are date serials shown as `dd/MM/yyyy`, and
percentages are fractions shown as `0,00%`. So `SUM`, sorting and date
arithmetic all work in the sheet. `numeroNota` is the exception — it is written
as text, because it is an identifier and must not lose a digit to numeric
formatting.

The export mixes two date spellings: most products date in ISO, while
`CDB LIQUIDEZ DIARIA`, `CDB PORQUINHO OBJETIVO` and `LCI PRE 180 DIAS` use
`dd/MM/yyyy`. Both are read.

`renda-fixa` is **one row per nota**, with its product repeated across its
notes, so each note keeps its own `dataOperacao`. The product-level totals
(`valorAplicadoTotal` and friends) are left out on purpose: repeated across a
product's notes they would double-count under a column sum. Sum the per-note
`valorOperacao` / `valorBruto` instead — which is what `resumo` does.

## 📈 How the profit columns are computed

Every tab leads with its profit columns, and they are spreadsheet **formulas**
rather than numbers, so they recalculate and can be audited in place.

| Tab | Columns | Why |
| --- | --- | --- |
| `renda-fixa` | `%-mes`, `%-ano` | Each nota has a `dataOperacao`, so a real holding period exists |
| `acoes-br`, `fundos` | `%-total` | ⚠️ No purchase date in the export — nothing to annualise over |
| `resumo` | `%-total` | One category holds positions bought on different dates |

**`renda-fixa` — compounded over the period actually held:**

```
%-ano = IF(H2=""; ""; IFERROR((K2/J2)^(365/(DATE(2026; 9; 17)-H2))-1; ""))
%-mes = IF(B2=""; ""; B2/12)
```

This reproduces each nota's contracted `indexador` to within 0.04pp, which is a
good check that the arithmetic is right.

**`acoes-br` and `fundos` — total return since inception.** `fundos` carries
only `dataCotacao` (the date the quota was *priced*, a day before the snapshot)
and `acoes-br` carries no date at all. With no holding period to compound over,
the column is named `%-total` rather than pretending to be annual, and there is
no `%-mes`:

```
%-total = IFERROR((G2/F2)-1; "")
```

Formulas guard against a blank dependency, so a missing `dataOperacao` or a zero
invested value (`acoes-br` holds one such position, `HGRE12`) reads blank
instead of `#VALUE!` or `#DIV/0!`.

### Per-product exceptions

`CDB LIQUIDEZ DIARIA` is drawn down in parts rather than held to maturity, so a
rate compounded from its operation date says nothing useful. Its return is what
is left over what is still in:

```
%-ano = IFERROR((Q51/(J51-M51))-1; "")     valorLiquido / (valorOperacao - valorRetirada) - 1
```

Exceptions like this are declared as a `BasisOverride` on the asset class
contract — a column, a value to match, and the basis to use instead — so adding
another is data, not a new branch. See `domain/model/AssetClassContract.ts`.

### Row order

Every tab is sorted **ascending by its headline return column**, worst first.
The ordering is decided before the formulas are written, because each formula
addresses the row it sits on. `domain/service/PositionReturn.ts` evaluates the
same basis numerically purely to rank the rows — what the sheet *displays*
always comes from the formula. Positions whose return would read blank sort
last. `resumo` keeps category order with `Total` at the bottom.

### Formula dialect

Formulas are spelled for a **Brazilian-locale** sheet, which separates arguments
with `;`. That is one decision in `domain/service/FormulaDialect.ts` —
construct it with `", "` if the target spreadsheet wants commas.

## 🏗️ Architecture (hexagonal)

The inner layers know nothing about spreadsheets or about Status Invest. A
snapshot is a set of **canonical tables**, one per asset class, whose columns
carry a *kind* (`money`, `date`, `percent`, `identifier`, …). The domain turns
those into `SheetDefinition`s; adapters decide what a `money` column looks like
and where the tab goes.

```
index.ts                          CLI + composition root
domain/
  model/    AssetClass, AssetClassContract, Column, Position, PositionTable, ReturnBasis, ReturnColumns, Snapshot, SheetDefinition
  service/  ColumnReference, FormulaDialect, ReturnFormulas, PositionReturn, InvestmentSheetFactory, SummarySheetFactory, SheetTitle
application/
  port/     SnapshotSource (in), SheetPublisher (out)
  PublishSnapshotUseCase
adapter/
  config/                  loads credentials + default snapshot folder
  provider/status-invest/  raw export files -> canonical tables
  sheet/                   GoogleSheetPublisher, ConsoleSheetPublisher (dry run), formats, themes
```

## ➕ Adding another provider

Only the `adapter/provider/` layer changes:

1. Write one `AssetTableMapper` per asset class you cover. Declare its canonical
   `Column[]` and build positions with `project(columns, raw)`, which coerces
   values by column kind.
2. Satisfy the asset class contract — supply the invested, current and (where
   you have them) withdrawn and start-date columns from
   `domain/model/AssetClassContract.ts`, plus any column an override switches
   on. `createPositionTable` enforces all of it, so a missing column fails at
   load rather than producing a tab of `#REF!`. Any extra columns you add are
   carried through untouched.
3. Implement `SnapshotSource` for the provider and wire it in `index.ts`.

Domain, application and the sheet adapter stay untouched. The canonical column
names borrow the Status Invest vocabulary (`valorOperacao`, `valorBruto`, …)
because that is the wallet this started from; map onto them from any provider.

## 🧪 Tests

```bash
npm test -- status-invest-update
```
