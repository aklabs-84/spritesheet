export class ProviderError extends Error {
  constructor(
    public provider: "gemini" | "openai",
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
