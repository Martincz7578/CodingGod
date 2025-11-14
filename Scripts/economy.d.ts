import type { data, Building } from "./buildings.js";
export declare function process(depots: number, foundries: number, shops: number, houses: number, farms: number, mines: number, masons: number): void;
export declare let citizens: citizen[];
export declare class citizen {
    happiness: number;
    hunger: number;
    age: number;
    constructor(happiness: number, hunger: number);
}
export declare function birth(): citizen;
export declare function condicionedBirth(births: number, happiness: number, hunger: number, household: Building): void;
export declare function reducePopulation(amount: number): void;
export declare function buyBuilding(data: data): boolean;
export declare function mpop(content: string, closeText?: string, build?: boolean, title?: string): void;
export declare function mpopClose(modal: HTMLDivElement): void;
//# sourceMappingURL=economy.d.ts.map