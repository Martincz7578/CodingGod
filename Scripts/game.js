import { process, mpop, buyBuilding } from './economy.js';
export function pauseGame() {
    paused = true;
}
export function resumeGame() {
    paused = false;
    requestAnimationFrame(UpdateGame);
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        C A N V A S   S E T   U P                          *
 *                                                                           *
 *---------------------------------------------------------------------------*/
let sizeReduction = 1;
const fg = document.getElementById("fg");
const pbg = document.getElementById("pbg");
const bg = document.getElementById("bg");
const fgCtx = fg.getContext("2d");
const pbgCtx = pbg.getContext("2d");
const bgCtx = bg.getContext("2d");
fg.width = screen.width / sizeReduction;
fg.height = screen.height / sizeReduction;
pbg.width = screen.width / sizeReduction;
pbg.height = screen.height / sizeReduction;
bg.width = screen.width / sizeReduction;
bg.height = screen.height / sizeReduction;
const depotImg = document.getElementById("depot");
const factoryImg = document.getElementById("factory");
const farmImg = document.getElementById("farm");
const houseImg = document.getElementById("house");
const storeImg = document.getElementById("store");
depotImg.style.display = "none";
factoryImg.style.display = "none";
farmImg.style.display = "none";
houseImg.style.display = "none";
storeImg.style.display = "none";
depotImg.height = 150 / sizeReduction;
factoryImg.height = 150 / sizeReduction;
farmImg.height = 200 / sizeReduction;
houseImg.height = 100 / sizeReduction;
storeImg.height = 100 / sizeReduction;
depotImg.width = 100 / sizeReduction;
factoryImg.width = 150 / sizeReduction;
farmImg.width = 200 / sizeReduction;
houseImg.width = 100 / sizeReduction;
storeImg.width = 100 / sizeReduction;
const priceTag = document.getElementById("priceTag");
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   U T I L S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/
let frame = 0;
let gameInterval;
let started = false;
let paused = false;
let mouse = { x: 0, y: 0 };
//frames
let LFT = 0;
const targetFPS = 15;
const frameDuration = 1000 / targetFPS;
//Building types
var buildingTypes;
(function (buildingTypes) {
    buildingTypes[buildingTypes["HOUSE"] = 0] = "HOUSE";
    buildingTypes[buildingTypes["FACTORY"] = 1] = "FACTORY";
    buildingTypes[buildingTypes["SHOP"] = 2] = "SHOP";
    buildingTypes[buildingTypes["FARM"] = 3] = "FARM";
    buildingTypes[buildingTypes["PATH"] = 4] = "PATH";
    buildingTypes[buildingTypes["DEPOT"] = 5] = "DEPOT";
})(buildingTypes || (buildingTypes = {}));
let blockSize = 50 / sizeReduction;
let buildings = {
    house: { price: 0, koeficient: 1.5, size: { width: 2 * blockSize, height: 2 * blockSize } },
    factory: { price: 0, koeficient: 3, size: { width: 3 * blockSize, height: 3 * blockSize } },
    shop: { price: 0, koeficient: 2, size: { width: 2 * blockSize, height: 2 * blockSize } },
    farm: { price: 0, koeficient: 2, size: { width: 4 * blockSize, height: 4 * blockSize } },
    depot: { price: 0, koeficient: 2.5, size: { width: 2 * blockSize, height: 3 * blockSize } },
    path: { price: 0, koeficient: 1, size: { width: 1 * blockSize, height: 1 * blockSize } }
};
export function updatePrices(depots, factories, shops, houses, farms) {
    buildings.house.price = Math.floor(100 * Math.pow(buildings.house.koeficient, houses)) - 100;
    buildings.factory.price = Math.floor(500 * Math.pow(buildings.factory.koeficient, factories)) - 500;
    buildings.shop.price = Math.floor(300 * Math.pow(buildings.shop.koeficient, shops)) - 300;
    buildings.farm.price = Math.floor(400 * Math.pow(buildings.farm.koeficient, farms)) - 400;
    buildings.depot.price = Math.floor(600 * Math.pow(buildings.depot.koeficient, depots)) - 600;
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        T H E   G R I D                                    *
 *                                                                           *
 *---------------------------------------------------------------------------*/
const gridWidth = Math.floor(bg.width / (50 / sizeReduction));
const gridHeight = Math.floor(bg.height / (50 / sizeReduction));
const grid = [];
for (let y = 0; y < gridHeight; y++) {
    grid[y] = new Array(gridWidth).fill(null);
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        B U I L D I N G S                                  *
 *                                                                           *
 *---------------------------------------------------------------------------*/
let buildingInProgress = false;
class Building {
    constructor(type, position) {
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
    }
}
let placedBuildings = [];
function getBuildingData(type) {
    switch (type) {
        case buildingTypes.HOUSE:
            return buildings.house;
        case buildingTypes.FACTORY:
            return buildings.factory;
        case buildingTypes.SHOP:
            return buildings.shop;
        case buildingTypes.FARM:
            return buildings.farm;
        case buildingTypes.PATH:
            return buildings.path;
        case buildingTypes.DEPOT:
            return buildings.depot;
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
            case buildingTypes.FACTORY:
                //bgCtx.fillStyle = "black";
                //bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                bgCtx.drawImage(factoryImg, building.position.x, building.position.y, building.size.width, building.size.height);
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
let preBuild = {
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
function checkBuildingPosition(type) {
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
    if (!(preBuild.snap.x + size.width <= player.location.x ||
        preBuild.snap.x >= player.location.x + player.size.width ||
        preBuild.snap.y + size.height <= player.location.y ||
        preBuild.snap.y >= player.location.y + player.size.height)) {
        if (buildingInProgress) {
            preBuild.valid = false;
            renderPreBuild(preBuild, "#FFFF00");
            return null;
        }
        return true;
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
function placeBuilding(type) {
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
function removeBuildingAtPosition(position) {
    var _a;
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
        bgCtx.clearRect(0, 0, bg.width, bg.height);
        renderBuildings();
    }
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   L O G I C                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/
function StartGame() {
    started = true;
    fgCtx.fillStyle = "orange";
    fgCtx.fillRect(player.location.x, player.location.y, blockSize / 2, blockSize / 2);
    requestAnimationFrame(UpdateGame);
}
function UpdateGame(timeStamp) {
    if (paused)
        return;
    if (buildingInProgress) {
        checkBuildingPosition(preBuild.type);
    }
    frame++;
    const delta = timeStamp - LFT;
    if (delta >= frameDuration) {
        LFT = timeStamp - (delta % frameDuration);
        Render();
        process(placedBuildings.filter(b => b.type === buildingTypes.DEPOT).length, placedBuildings.filter(b => b.type === buildingTypes.FACTORY).length, placedBuildings.filter(b => b.type === buildingTypes.SHOP).length, placedBuildings.filter(b => b.type === buildingTypes.HOUSE).length, placedBuildings.filter(b => b.type === buildingTypes.FARM).length, frame);
    }
    if (frame == 3000)
        mpop('Thx for playing Coding God! Please consider supporting me on Pateron <br> <a href="https://patreon.com/RUN1_IT"><img src="https://c5.patreon.com/external/favicon/rebrand/pwa-192.png" alt="Patreon" height="16" width="16">Support Me!</a>');
    requestAnimationFrame(UpdateGame);
}
function Render() {
    //player
    if (player.moved) {
        fgCtx.clearRect(player.location.x - blockSize * 2, player.location.y - blockSize * 2, blockSize * 4, blockSize * 4);
        fgCtx.fillStyle = "orange";
        fgCtx.fillRect(player.location.x, player.location.y, player.size.width, player.size.height);
        player.moved = false;
    }
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P L A Y E R                                        *
 *                                                                           *
 *---------------------------------------------------------------------------*/
let player = {
    speed: 5 / sizeReduction,
    location: { x: fg.width / 2, y: fg.height / 2 },
    size: { width: blockSize / 2, height: blockSize / 2 },
    moved: false
};
/*function movePlayerFromBuilding(building: buildingTypes) {
    if(!playerBuildingCollision({x: player.location.x+getBuildingData(building).size.width+blockSize, y: player.location.y})) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location.x += getBuildingData(building).size.width;
        player.moved = true;
    }else if(!playerBuildingCollision({x: player.location.x-blockSize, y: player.location.y})) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location.x -= blockSize;
        player.moved = true;
    }else if(!playerBuildingCollision({x: player.location.x, y: player.location.y+getBuildingData(building).size.height+blockSize})) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location.y += getBuildingData(building).size.height;
        player.moved = true;
    }else if(!playerBuildingCollision({x: player.location.x, y: player.location.y-blockSize})) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location.y -= blockSize;
        player.moved = true;
    }else{
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location = {x: fg.width / 2, y: fg.height / 2};
        player.moved = true;
    }
}*/
addEventListener("mousemove", function (event) {
    const rect = fg.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / (rect.right - rect.left) * fg.width;
    const mouseY = (event.clientY - rect.top) / (rect.bottom - rect.top) * fg.height;
    mouse = { x: mouseX, y: mouseY };
});
addEventListener("keydown", function (event) {
    let pos = { x: (Math.floor(player.location.x / blockSize) * blockSize), y: (Math.floor(player.location.y / blockSize) * blockSize) };
    if (event.key === "b") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.HOUSE);
        //if(placeBuilding(buildingTypes.HOUSE))movePlayerFromBuilding(buildingTypes.HOUSE);
    }
    if (event.key === "p") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.PATH);
    }
    if (event.key === "f") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.FACTORY);
        //if(placeBuilding(buildingTypes.FACTORY))movePlayerFromBuilding(buildingTypes.FACTORY);
    }
    if (event.key === "t") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.SHOP);
        //if(placeBuilding(buildingTypes.SHOP))movePlayerFromBuilding(buildingTypes.SHOP);
    }
    if (event.key === "r") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.FARM);
    }
    if (event.key === "g") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.DEPOT);
        //if(placeBuilding(buildingTypes.DEPOT))movePlayerFromBuilding(buildingTypes.DEPOT);
    }
    if (event.key === "c") {
        buildingInProgress = false;
        priceTag.innerText = ``;
        removeBuildingAtPosition(mouse);
        pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
    }
    //movement
    if (event.key === "ArrowUp" || event.key === "w" &&
        !playerBuildingCollision({ x: player.location.x, y: player.location.y - player.speed })) {
        player.location.y -= player.speed;
        player.moved = true;
    }
    if (event.key === "ArrowDown" || event.key === "s" &&
        !playerBuildingCollision({ x: player.location.x, y: player.location.y + player.speed })) {
        player.location.y += player.speed;
        player.moved = true;
    }
    if (event.key === "ArrowLeft" || event.key === "a" &&
        !playerBuildingCollision({ x: player.location.x - player.speed, y: player.location.y })) {
        player.location.x -= player.speed;
        player.moved = true;
    }
    if (event.key === "ArrowRight" || event.key === "d" &&
        !playerBuildingCollision({ x: player.location.x + player.speed, y: player.location.y })) {
        player.location.x += player.speed;
        player.moved = true;
    }
    if (event.key === " ") {
        if (buildingInProgress) {
            buildingInProgress = false;
            placeBuilding(preBuild.type);
            if (preBuild.type == buildingTypes.PATH)
                buildingInProgress = true;
            pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
        }
        priceTag.innerText = ``;
    }
    if (event.key === "Escape") {
        if (buildingInProgress) {
            buildingInProgress = false;
            pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
            priceTag.innerText = ``;
        }
    }
});
function playerBuildingCollision(player) {
    let playerSize = { width: blockSize / 2, height: blockSize / 2 };
    for (let building of placedBuildings) {
        if (building.type === buildingTypes.PATH || building.type === buildingTypes.FARM)
            continue;
        if (!(player.x + playerSize.width <= building.position.x ||
            player.x >= building.position.x + building.size.width ||
            player.y + playerSize.height <= building.position.y ||
            player.y >= building.position.y + building.size.height)) {
            return true;
        }
    }
    return false;
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        T E C H N I C A L                                  *
 *                                                                           *
 *---------------------------------------------------------------------------*/
addEventListener("visibilitychange", function () {
    if (document.hidden) {
        paused = true;
    }
    else {
        requestAnimationFrame(UpdateGame);
        paused = false;
    }
});
StartGame();
//# sourceMappingURL=game.js.map