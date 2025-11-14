var _a, _b, _c, _d, _e, _f;
import { birth, buyBuilding, mpop, reducePopulation } from './economy.js';
import { priceTag } from './game.js';
const fg = document.getElementById("fg");
const pbg = document.getElementById("pbg");
const bg = document.getElementById("bg");
const fgCtx = fg.getContext("2d");
const pbgCtx = pbg.getContext("2d");
const bgCtx = bg.getContext("2d");
fg.width = screen.width;
fg.height = screen.height - ((_b = (_a = document.getElementById("head")) === null || _a === void 0 ? void 0 : _a.offsetHeight) !== null && _b !== void 0 ? _b : 0);
pbg.width = screen.width;
pbg.height = screen.height - ((_d = (_c = document.getElementById("head")) === null || _c === void 0 ? void 0 : _c.offsetHeight) !== null && _d !== void 0 ? _d : 0);
bg.width = screen.width;
bg.height = screen.height - ((_f = (_e = document.getElementById("head")) === null || _e === void 0 ? void 0 : _e.offsetHeight) !== null && _f !== void 0 ? _f : 0);
let blockSize = 50;
const depotImg = document.getElementById("depot");
const foundryImg = document.getElementById("foundry");
const farmImg = document.getElementById("farm");
const houseImg = document.getElementById("house");
const storeImg = document.getElementById("store");
const mineImg = document.getElementById("mine");
const masonImg = document.getElementById("mason");
depotImg.style.display = "none";
foundryImg.style.display = "none";
farmImg.style.display = "none";
houseImg.style.display = "none";
storeImg.style.display = "none";
mineImg.style.display = "none";
masonImg.style.display = "none";
depotImg.height = 150;
foundryImg.height = 150;
farmImg.height = 200;
houseImg.height = 100;
storeImg.height = 100;
mineImg.height = 150;
masonImg.height = 100;
depotImg.width = 100;
foundryImg.width = 150;
farmImg.width = 200;
houseImg.width = 100;
storeImg.width = 100;
mineImg.width = 150;
masonImg.width = 100;
let mouse = { x: 0, y: 0 };
addEventListener("mousemove", function (event) {
    const rect = fg.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / (rect.right - rect.left) * fg.width;
    const mouseY = (event.clientY - rect.top) / (rect.bottom - rect.top) * fg.height;
    mouse = { x: mouseX, y: mouseY };
});
export let buildings = {
    house: { price: 0, koeficient: 1.5, size: { width: 2 * blockSize, height: 2 * blockSize } },
    foundry: { price: 0, koeficient: 3, size: { width: 3 * blockSize, height: 3 * blockSize }, productionSpeed: 2, requirements: { coal: 2, iron: 1 } },
    shop: { price: 0, koeficient: 2, size: { width: 2 * blockSize, height: 2 * blockSize }, productionSpeed: 2 },
    farm: { price: 0, koeficient: 2, size: { width: 4 * blockSize, height: 4 * blockSize }, productionSpeed: 5 },
    depot: { price: 0, koeficient: 2.5, size: { width: 2 * blockSize, height: 3 * blockSize } },
    path: { price: 0, koeficient: 1, size: { width: 1 * blockSize, height: 1 * blockSize } },
    mines: { price: 0, koeficient: 3, size: { width: 3 * blockSize, height: 3 * blockSize }, productionSpeed: 3 },
    mason: { price: 0, koeficient: 2, size: { width: 2 * blockSize, height: 2 * blockSize }, productionSpeed: 4 }
};
export let productionAmplifiers = {
    mines: 1,
    foundries: 1,
    farms: 1,
    masons: 1,
};
const gridWidth = Math.floor(bg.width / 50);
const gridHeight = Math.floor(bg.height / 50);
const grid = [];
for (let y = 0; y < gridHeight; y++) {
    grid[y] = new Array(gridWidth).fill(null);
}
//Building types
export var buildingTypes;
(function (buildingTypes) {
    buildingTypes[buildingTypes["HOUSE"] = 0] = "HOUSE";
    buildingTypes[buildingTypes["FOUNDRY"] = 1] = "FOUNDRY";
    buildingTypes[buildingTypes["SHOP"] = 2] = "SHOP";
    buildingTypes[buildingTypes["FARM"] = 3] = "FARM";
    buildingTypes[buildingTypes["PATH"] = 4] = "PATH";
    buildingTypes[buildingTypes["DEPOT"] = 5] = "DEPOT";
    buildingTypes[buildingTypes["MINES"] = 6] = "MINES";
    buildingTypes[buildingTypes["MASON"] = 7] = "MASON";
})(buildingTypes || (buildingTypes = {}));
export function updatePrices(depots, foundries, shops, houses, farms, mines, masons) {
    buildings.house.price = Math.floor(100 * Math.pow(buildings.house.koeficient, houses)) - 100;
    buildings.foundry.price = Math.floor(500 * Math.pow(buildings.foundry.koeficient, foundries)) - 500;
    buildings.shop.price = Math.floor(300 * Math.pow(buildings.shop.koeficient, shops)) - 300;
    buildings.farm.price = Math.floor(400 * Math.pow(buildings.farm.koeficient, farms)) - 400;
    buildings.depot.price = Math.floor(600 * Math.pow(buildings.depot.koeficient, depots)) - 600;
    buildings.mines.price = Math.floor(700 * Math.pow(buildings.mines.koeficient, mines)) - 700;
    buildings.mason.price = Math.floor(600 * Math.pow(buildings.mason.koeficient, masons)) - 600;
}
export let buildingInProgress = false;
export class Building {
    constructor(type, position) {
        var _a;
        this.householdMembers = [];
        this.maxMembers = 5;
        this.type = type;
        this.position = position;
        this.size = getBuildingData(type).size;
        for (let y = this.position.y; y < this.position.y + this.size.height; y += blockSize) {
            for (let x = this.position.x; x < this.position.x + this.size.width; x += blockSize) {
                const gy = Math.floor(y / blockSize);
                const gx = Math.floor(x / blockSize);
                if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth)
                    continue;
                if (!grid[gy])
                    grid[gy] = new Array(gridWidth).fill(null);
                grid[gy][gx] = this;
            }
        }
        if (type === buildingTypes.HOUSE) {
            for (let i = 0; i < Math.floor(Math.random() * 5 + 1); i++) {
                (_a = this.householdMembers) === null || _a === void 0 ? void 0 : _a.push(birth());
            }
        }
    }
}
export let placedBuildings = [];
function getBuildingData(type) {
    switch (type) {
        case buildingTypes.HOUSE:
            return buildings.house;
        case buildingTypes.FOUNDRY:
            return buildings.foundry;
        case buildingTypes.SHOP:
            return buildings.shop;
        case buildingTypes.FARM:
            return buildings.farm;
        case buildingTypes.PATH:
            return buildings.path;
        case buildingTypes.DEPOT:
            return buildings.depot;
        case buildingTypes.MINES:
            return buildings.mines;
        case buildingTypes.MASON:
            return buildings.mason;
        default:
            return { price: 0, size: { width: blockSize, height: blockSize } };
    }
}
function renderBuildings() {
    for (let building of placedBuildings) {
        switch (building.type) {
            case buildingTypes.HOUSE:
                //bgCtx.fillStyle = "cyan";
                //bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(houseImg, building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.FOUNDRY:
                //bgCtx.fillStyle = "black";
                //bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(foundryImg, building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.SHOP:
                //bgCtx.fillStyle = "crimson";
                //bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(storeImg, building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.FARM:
                //bgCtx.fillStyle = "brown";
                //bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(farmImg, building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.PATH:
                bgCtx.fillStyle = "gray";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.DEPOT:
                //bgCtx.fillStyle = "purple";
                //bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(depotImg, building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.MINES:
                //bgCtx.fillStyle = "darkgray";
                //bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(mineImg, building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.MASON:
                //bgCtx.fillstyle = "lightgray";
                //bgCtx.fillRect(building.postion.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(masonImg, building.position.x, building.position.y, building.size.width, building.size.height);
            default:
                break;
        }
    }
}
function snapToGrid(position) {
    return {
        x: Math.floor(position.x / blockSize) * blockSize,
        y: Math.floor(position.y / blockSize) * blockSize
    };
}
export let preBuild = {
    type: buildingTypes.HOUSE,
    position: { x: mouse.x, y: mouse.y },
    size: { width: blockSize, height: blockSize },
    snap: { x: 0, y: 0 },
    valid: false
};
function renderPreBuild(preBuild, color = "#0000FF") {
    pbgCtx.save();
    pbgCtx.globalAlpha = 0.5;
    pbgCtx.fillStyle = color;
    pbgCtx.fillRect(preBuild.snap.x, preBuild.snap.y, preBuild.size.width, preBuild.size.height);
    const sx = Math.max(0, preBuild.snap.x);
    const sy = Math.max(0, preBuild.snap.y);
    const sw = Math.max(0, preBuild.size.width);
    const sh = Math.max(0, preBuild.size.height);
    priceTag.innerText = `Price: ${getBuildingData(preBuild.type).price} Money`;
    if (sy > 0)
        pbgCtx.clearRect(0, 0, pbg.width, sy);
    const bottomY = sy + sh;
    if (bottomY < pbg.height)
        pbgCtx.clearRect(0, bottomY, pbg.width, pbg.height - bottomY);
    if (sx > 0)
        pbgCtx.clearRect(0, sy, sx, sh);
    const rightX = sx + sw;
    if (rightX < pbg.width)
        pbgCtx.clearRect(rightX, sy, pbg.width - rightX, sh);
    let clearArea = { x: 0, y: 0, width: 0, height: 0 };
    pbgCtx.clearRect(clearArea.x, clearArea.y, clearArea.width, clearArea.height);
    pbgCtx.restore();
}
export function checkBuildingPosition(type) {
    var _a;
    let size = getBuildingData(type).size;
    preBuild.type = type;
    preBuild.size = size;
    preBuild.snap = snapToGrid({ x: mouse.x, y: mouse.y });
    if (buildingInProgress) {
        preBuild.position = preBuild.snap;
    }
    else {
        pbgCtx.clearRect(preBuild.snap.x, preBuild.snap.y, preBuild.size.width, preBuild.size.height);
    }
    if (preBuild.snap.x < 0 || preBuild.snap.y < 0 || preBuild.snap.x + size.width > bg.width || preBuild.snap.y + size.height > bg.height) {
        if (buildingInProgress) {
            renderPreBuild(preBuild, "#FFFF00");
            return null;
        }
        else {
            return true;
        }
    }
    for (let placedBuilding of placedBuildings) {
        if (!(preBuild.snap.x + size.width <= placedBuilding.position.x ||
            preBuild.snap.x >= placedBuilding.position.x + placedBuilding.size.width ||
            preBuild.snap.y + size.height <= placedBuilding.position.y ||
            preBuild.snap.y >= placedBuilding.position.y + placedBuilding.size.height)) {
            if (buildingInProgress) {
                preBuild.valid = false;
                renderPreBuild(preBuild, "#FF0000");
                return null;
            }
            return true;
        }
    }
    for (let y = preBuild.snap.y; y < preBuild.snap.y + size.height; y += blockSize) {
        for (let x = preBuild.snap.x; x < preBuild.snap.x + size.width; x += blockSize) {
            const gy = Math.floor(y / blockSize);
            const gx = Math.floor(x / blockSize);
            if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) {
                if (buildingInProgress) {
                    preBuild.valid = false;
                    renderPreBuild(preBuild, "#FF0000");
                    return null;
                }
                else {
                    return true;
                }
            }
            if (((_a = grid[gy]) === null || _a === void 0 ? void 0 : _a[gx]) != null) {
                if (buildingInProgress) {
                    preBuild.valid = false;
                    renderPreBuild(preBuild, "#FF0000");
                    return null;
                }
                else {
                    return true;
                }
            }
        }
    }
    if (buildingInProgress) {
        preBuild.valid = true;
        renderPreBuild(preBuild);
        return null;
    }
    return false;
}
export function placeBuilding(type) {
    let status = checkBuildingPosition(type);
    if (status == null)
        return false;
    if (!buyBuilding(getBuildingData(type)))
        return false;
    if (!status) {
        let newBuilding = new Building(type, preBuild.snap);
        placedBuildings.push(newBuilding);
        renderBuildings();
        return true;
    }
    else {
        if (!buildingInProgress)
            mpop("Cannot place building here!");
        return false;
    }
}
export function removeBuildingAtPosition(position) {
    var _a, _b, _c;
    const snappedPos = snapToGrid(position);
    const gridX = Math.floor(snappedPos.x / blockSize);
    const gridY = Math.floor(snappedPos.y / blockSize);
    const building = (_a = grid[gridY]) === null || _a === void 0 ? void 0 : _a[gridX];
    if (building != null) {
        for (let i = 0; i < placedBuildings.length; i++) {
            if (placedBuildings[i] === building) {
                placedBuildings.splice(i, 1);
                break;
            }
        }
        for (let y = building.position.y; y < building.position.y + building.size.height; y += blockSize) {
            for (let x = building.position.x; x < building.position.x + building.size.width; x += blockSize) {
                const gy = Math.floor(y / blockSize);
                const gx = Math.floor(x / blockSize);
                if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth)
                    continue;
                if (grid[gy]) {
                    grid[gy][gx] = null;
                }
            }
        }
        if (building.type === buildingTypes.HOUSE) {
            reducePopulation((_c = (_b = building.householdMembers) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0);
        }
        bgCtx.clearRect(0, 0, bg.width, bg.height);
        renderBuildings();
    }
}
export function setBuildingState(set) {
    buildingInProgress = set;
}
//# sourceMappingURL=buildings.js.map