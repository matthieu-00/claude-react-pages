declare global {
  interface Window {
    Babel?: {
      transform: (code: string, options: { presets: string[]; filename: string }) => { code: string };
    };
    lucide?: Record<string, React.ComponentType<any>>;
    lucideReact?: Record<string, React.ComponentType<any>>;
    prettier?: {
      format: (code: string, options: any) => string;
    };
    prettierPlugins?: {
      babel?: any;
      html?: any;
      css?: any;
    };
  }
}

export {};
