interface Window {
    exports: {
        [k in string]: object;
    };
    require: any;
    define: unknown;
}
