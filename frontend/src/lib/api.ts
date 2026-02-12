import type { ApiResponse, RpcRequest } from '../types';

const createRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const resolveApiEndpoint = (): string => {
  const fromRuntime = window.__APP_CONFIG__?.apiBaseUrl;
  if (fromRuntime && fromRuntime.trim() !== '') {
    return fromRuntime;
  }

  const fromVite = import.meta.env.VITE_API_URL;
  if (fromVite && fromVite.trim() !== '') {
    return fromVite;
  }

  return window.location.href;
};

const hasGasBridge = (): boolean => {
  return Boolean(window.google?.script?.run?.rpc);
};

export class RpcError extends Error {
  code: string;

  fields?: string[];

  constructor(code: string, message: string, fields?: string[]) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

const callViaGasBridge = <T>(req: RpcRequest): Promise<ApiResponse<T>> => {
  return new Promise((resolve, reject) => {
    const runner = window.google?.script?.run;
    if (!runner) {
      reject(new RpcError('INTERNAL', 'Google Script bridge is not available'));
      return;
    }

    runner
      .withSuccessHandler((result: unknown) => {
        resolve(result as ApiResponse<T>);
      })
      .withFailureHandler((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        reject(new RpcError('INTERNAL', `GAS実行エラー: ${message}`));
      })
      .rpc(req.action, req.payload, req.requestId);
  });
};

export const rpc = async <T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> => {
  const req: RpcRequest = {
    action,
    payload,
    requestId: createRequestId()
  };

  let body: ApiResponse<T>;
  if (hasGasBridge()) {
    body = await callViaGasBridge<T>(req);
  } else {
    const response = await fetch(resolveApiEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req)
    });

    const rawText = await response.text();
    try {
      body = JSON.parse(rawText) as ApiResponse<T>;
    } catch (_err) {
      const preview = rawText.slice(0, 120).replace(/\s+/g, ' ');
      throw new RpcError(
        'INTERNAL',
        `APIレスポンスのJSON解析に失敗しました (status=${response.status}): ${preview}`
      );
    }

    if (!response.ok) {
      const error = body.error;
      throw new RpcError(error?.code ?? 'INTERNAL', error?.message ?? 'Request failed', error?.fields);
    }
  }

  if (!body.ok) {
    const error = body.error;
    throw new RpcError(error?.code ?? 'INTERNAL', error?.message ?? 'Request failed', error?.fields);
  }

  if (body.data === undefined) {
    throw new RpcError('INTERNAL', 'Missing response data');
  }

  return body.data;
};
