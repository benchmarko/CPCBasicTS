interface Window {
    exports: Record<string, object>;
    require: (id: string) => any;
    define: unknown;
}
