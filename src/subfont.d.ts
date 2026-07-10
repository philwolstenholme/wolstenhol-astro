declare module "subfont" {
  type SubfontConsole = {
    error: (...args: unknown[]) => void;
    info?: (...args: unknown[]) => void;
    log?: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
  };

  type SubfontOptions = {
    canonicalRoot?: string;
    inPlace?: boolean;
    inputFiles?: string[];
    root?: string;
  };

  const subfont: (options: SubfontOptions, console?: SubfontConsole) => Promise<void>;
  export default subfont;
}
