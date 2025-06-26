import pino from "pino";

// Google Cloud Logging は特定のJSONフィールドを認識します
// severity, message フィールドなどが自動的に解釈されます
// https://cloud.google.com/logging/docs/structured-logging#special-payload-fields
const pinoOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label: string) => {
      // pino のレベル名を Google Cloud Logging の Severity に変換
      // https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
      switch (label) {
        case "trace":
          return { severity: "DEBUG" };
        case "debug":
          return { severity: "DEBUG" };
        case "info":
          return { severity: "INFO" };
        case "warn":
          return { severity: "WARNING" };
        case "error":
          return { severity: "ERROR" };
        case "fatal":
          return { severity: "CRITICAL" };
        default:
          return { severity: "DEFAULT" };
      }
    },
    // 必要に応じて他のフォーマッタも追加可能
    // bindings: (bindings) => {
    //   return { pid: bindings.pid, hostname: bindings.hostname };
    // },
  },
  // Google Cloud Logging では timestamp は自動で付与されることが多いが、
  // 明示的にISO形式で出力することも可能
  timestamp: pino.stdTimeFunctions.isoTime,
  // messageKey を 'message' に設定 (Google Cloud Logging の標準フィールド)
  messageKey: "message",
  // エラーオブジェクトを適切にシリアライズ
  errorKey: "error",
  // ... 他に必要な pino オプション
};

let loggerInstance: pino.Logger;

if (process.env.NODE_ENV === 'production') {
  loggerInstance = pino.default(pinoOptions);
} else {
  // 本番環境以外では pino-pretty で見やすくする
  const transport = pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
    },
  });
  loggerInstance = pino.default(pinoOptions, transport);
}

export const logger = loggerInstance;
