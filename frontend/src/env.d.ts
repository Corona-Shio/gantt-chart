interface GoogleScriptRun {
  withSuccessHandler: (callback: (result: unknown) => void) => GoogleScriptRun;
  withFailureHandler: (callback: (error: unknown) => void) => GoogleScriptRun;
  rpc: (action: string, payload: Record<string, unknown>, requestId: string) => void;
}

interface Window {
  __APP_CONFIG__?: {
    apiBaseUrl?: string;
  };
  google?: {
    script?: {
      run: GoogleScriptRun;
    };
  };
}
