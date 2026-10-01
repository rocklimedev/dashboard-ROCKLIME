declare const _default: () => {
    env: string;
    port: number;
    app: {
        name: string;
        apiUrl: string | undefined;
        clientUrl: string;
    };
    database: {
        url: string | undefined;
        host: string | undefined;
        port: number;
        name: string | undefined;
        user: string | undefined;
        password: string | undefined;
    };
    mongo: {
        uri: string | undefined;
    };
    redis: {
        host: string;
        port: number;
    };
    jwt: {
        secret: string | undefined;
        accessExpiresIn: string;
        refreshSecret: string | undefined;
        refreshExpiresIn: string;
    };
    mail: {
        resendApiKey: string | undefined;
        from: string | undefined;
    };
    corsOrigins: string[];
};
export default _default;
