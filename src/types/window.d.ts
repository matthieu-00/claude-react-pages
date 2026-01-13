declare global {
  interface Window {
    Babel?: {
      transform: (code: string, options: { presets: string[]; filename: string }) => { code: string };
    };
    lucide?: Record<string, React.ComponentType<any>>;
    lucideReact?: Record<string, React.ComponentType<any>>;
  }
}

export {};
