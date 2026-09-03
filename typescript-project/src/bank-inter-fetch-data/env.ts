const ENV_HELP = `
Missing required environment variable(s): __MISSING__

TOKEN (authorization Bearer UUID)
  1. Open https://contadigital.inter.co and stay logged in.
  2. DevTools (F12) → Network → Fetch/XHR.
  3. Click any cd.web.bancointer.com.br request.
  4. Headers → authorization → copy the UUID after "Bearer".

INTER_CONTA_CORRENTE (header x-inter-conta-corrente)
  Same Network panel, checking/account or credit-card request.

INTER_CARD_ACCOUNT (header cardaccount)
INTER_CPF (header cpfcnpj)
  Network → .../invoices/OPEN/transactions → Request Headers.

Run:

  TOKEN=... INTER_CONTA_CORRENTE=... INTER_CARD_ACCOUNT=... INTER_CPF=... npm run bank-inter-fetch

Or put them in a local .env file (do not commit it).
`.trim();

function requiredEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export type BankInterEnv = {
  token: string;
  contaCorrente: string;
  cardAccount: string;
  cpfCnpj: string;
  cardProduct: string;
};

export function readBankInterEnv(): BankInterEnv {
  const token = requiredEnv("TOKEN")?.replace(/^Bearer\s+/i, "");
  const contaCorrente = requiredEnv("INTER_CONTA_CORRENTE");
  const cardAccount = requiredEnv("INTER_CARD_ACCOUNT");
  const cpfCnpj = requiredEnv("INTER_CPF");
  const missing = [
    !token && "TOKEN",
    !contaCorrente && "INTER_CONTA_CORRENTE",
    !cardAccount && "INTER_CARD_ACCOUNT",
    !cpfCnpj && "INTER_CPF",
  ].filter(Boolean) as string[];

  if (missing.length > 0 || !token || !contaCorrente || !cardAccount || !cpfCnpj) {
    console.error(ENV_HELP.replace("__MISSING__", missing.join(", ")));
    process.exit(1);
  }

  return {
    token,
    contaCorrente,
    cardAccount,
    cpfCnpj,
    cardProduct: requiredEnv("INTER_CARD_PRODUCT") ?? "23",
  };
}
