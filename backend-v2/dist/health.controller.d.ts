import { Response } from 'express';
import { Sequelize } from 'sequelize-typescript';
export declare class HealthController {
    private readonly sequelize;
    constructor(sequelize: Sequelize);
    basicHealth(): {
        status: string;
        uptime: number;
    };
    dbHealth(res: Response): Promise<Response<any, Record<string, any>>>;
}
