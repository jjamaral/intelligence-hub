declare module "node:fs/promises" {
  export function readFile(path: string, encoding: "utf8"): Promise<string>;
  export function writeFile(path: string, data: string, encoding: "utf8"): Promise<void>;
  export function mkdtemp(prefix: string): Promise<string>;
  export function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
}

declare module "node:path" {
  export function join(...paths: string[]): string;
}

declare module "node:os" {
  export function tmpdir(): string;
}

declare module "node:crypto" {
  export function createHash(algorithm: string): {
    update(data: string): { digest(encoding: "hex"): string };
  };
  export function randomUUID(): string;
}

declare module "node:test" {
  type TestFn = () => void | Promise<void>;
  export function test(name: string, fn: TestFn): void;
}

declare module "node:assert/strict" {
  interface AssertStrict {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): asserts value;
    rejects(block: () => Promise<unknown>, error?: RegExp | { message?: RegExp }): Promise<void>;
    throws(block: () => unknown, error?: RegExp | { message?: RegExp }): void;
  }
  const assert: AssertStrict;
  export default assert;
}

declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
  exitCode?: number;
  on(event: "SIGTERM" | "SIGINT", listener: () => void): void;
};

declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    close(): void;
    prepare(sql: string): {
      run(...params: readonly (string | number | null)[]): { changes: number | bigint; lastInsertRowid: number | bigint };
      get(...params: readonly (string | number | null)[]): Record<string, unknown> | undefined;
      all(...params: readonly (string | number | null)[]): readonly Record<string, unknown>[];
    };
  }
}

declare module "node:http" {
  export interface IncomingMessage { readonly method?: string; readonly url?: string; on(event:"data", listener:(chunk:unknown)=>void):void; on(event:"end", listener:()=>void):void; }
  export interface ServerResponse { statusCode:number; setHeader(name:string,value:string):void; end(data?:string):void; }
  export interface Server { listen(port:number, host:string, callback:()=>void):void; close(callback?:()=>void):void; }
  export function createServer(handler:(req:IncomingMessage,res:ServerResponse)=>void|Promise<void>):Server;
}
declare const console: { log(...values: readonly unknown[]): void; error(...values: readonly unknown[]): void; };
declare function setInterval(handler: () => void, timeout: number): unknown;
declare function clearInterval(handle: unknown): void;
