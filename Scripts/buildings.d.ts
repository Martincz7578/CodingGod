import type { citizen } from './economy.js';
export interface buildingData {
    price: number;
    koeficient: number;
    size: {
        width: number;
        height: number;
    };
    productionSpeed?: number;
    requirements?: {
        [key: string]: number;
    };
}
export declare let buildings: {
    house: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
    };
    foundry: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
        productionSpeed: number;
        requirements: {
            coal: number;
            iron: number;
        };
    };
    shop: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
        productionSpeed: number;
    };
    farm: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
        productionSpeed: number;
    };
    depot: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
    };
    path: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
    };
    mines: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
        productionSpeed: number;
    };
    mason: {
        price: number;
        koeficient: number;
        size: {
            width: number;
            height: number;
        };
        productionSpeed: number;
    };
};
export declare let productionAmplifiers: {
    mines: number;
    foundries: number;
    farms: number;
    masons: number;
};
interface size {
    width: number;
    height: number;
}
interface position {
    x: number;
    y: number;
}
interface preBuildMark {
    type: buildingTypes;
    size: size;
    position: position;
    snap: position;
    valid: boolean;
}
export interface data {
    price: number;
    size: size;
}
export declare enum buildingTypes {
    HOUSE = 0,
    FOUNDRY = 1,
    SHOP = 2,
    FARM = 3,
    PATH = 4,
    DEPOT = 5,
    MINES = 6,
    MASON = 7
}
export declare function updatePrices(depots: number, foundries: number, shops: number, houses: number, farms: number, mines: number, masons: number): void;
export declare let buildingInProgress: boolean;
export declare class Building {
    type: buildingTypes;
    size: size;
    position: position;
    householdMembers?: citizen[];
    maxMembers?: number;
    constructor(type: buildingTypes, position: position);
}
export declare let placedBuildings: Building[];
export declare let preBuild: preBuildMark;
export declare function checkBuildingPosition(type: buildingTypes): boolean | null;
export declare function placeBuilding(type: buildingTypes): boolean;
export declare function removeBuildingAtPosition(position: position): void;
export declare function setBuildingState(set: boolean): void;
export {};
//# sourceMappingURL=buildings.d.ts.map