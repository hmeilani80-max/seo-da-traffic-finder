export type AiProviderName = "openai" | "lovable";

export type AiJsonRequest = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
};

export type AiJsonResult<T> = {
  data: T | null;
  error: string | null;
  provider: AiProviderName;
};

export interface AiProvider {
  readonly name: AiProviderName;
  isConfigured(): boolean;
  json<T>(request: AiJsonRequest): Promise<Omit<AiJsonResult<T>, "provider">>;
}
