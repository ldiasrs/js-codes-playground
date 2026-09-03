const BASE_URL = "https://cd.web.bancointer.com.br";
const ORIGIN = "https://contadigital.inter.co";

export type InterRequestOptions = {
  accept?: string;
  extraHeaders?: Record<string, string>;
};

export class InterHttpClient {
  constructor(private readonly token: string) {}

  async getJson(path: string, options: InterRequestOptions = {}): Promise<unknown> {
    const body = await this.getBody(path, options.accept ?? "*/*", options.extraHeaders);
    return JSON.parse(body.toString("utf8")) as unknown;
  }

  async getBytes(path: string, options: InterRequestOptions = {}): Promise<Buffer> {
    return this.getBody(path, options.accept ?? "*/*", options.extraHeaders);
  }

  private async getBody(
    path: string,
    accept: string,
    extraHeaders: Record<string, string> = {}
  ): Promise<Buffer> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: {
        accept,
        "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        authorization: `Bearer ${this.token}`,
        origin: ORIGIN,
        ...extraHeaders,
      },
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    if (!response.ok) {
      throw new Error(
        `GET ${path} failed (${response.status} ${response.statusText}): ${buffer.toString("utf8").slice(0, 500)}`
      );
    }

    return buffer;
  }
}
