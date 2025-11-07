import { process, mpop } from './economy.js';

export function pauseGame(){
    paused = true;
}
export function resumeGame(){
    paused = false;
    requestAnimationFrame(UpdateGame);
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        C A N V A S   S E T   U P                          *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 
let sizeReduction = 1;

const fg = document.getElementById("fg") as HTMLCanvasElement;
const pbg = document.getElementById("pbg") as HTMLCanvasElement;
const bg = document.getElementById("bg") as HTMLCanvasElement;
const fgCtx = fg.getContext("2d") as CanvasRenderingContext2D;
const pbgCtx = pbg.getContext("2d") as CanvasRenderingContext2D;
const bgCtx = bg.getContext("2d") as CanvasRenderingContext2D;

fg.width = screen.width/sizeReduction;
fg.height = screen.height/sizeReduction;
pbg.width = screen.width/sizeReduction;
pbg.height = screen.height/sizeReduction;
bg.width = screen.width/sizeReduction;
bg.height = screen.height/sizeReduction;

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   U T I L S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 
let frame = 0;
let gameInterval: number;
let started = false;
let paused = false;

let mouse = {x: 0, y: 0};

//frames
let LFT = 0;
const targetFPS = 15;
const frameDuration = 1000 / targetFPS;

//Building types
enum buildingTypes {
    HOUSE,
    FACTORY,
    SHOP,
    FARM,
    PATH,
    DEPOT
}

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        T H E   G R I D                                    *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 
const gridWidth = Math.floor(bg.width / (50/sizeReduction));
const gridHeight = Math.floor(bg.height / (50/sizeReduction));
const grid: (Building | null)[][] = [];

for(let y = 0; y < gridHeight; y++) {
    grid[y] = new Array(gridWidth).fill(null);
}

let blockSize = 50/sizeReduction;

//General interfaces

interface size{
    width: number;
    height: number;
}

interface position{
    x: number;
    y: number;
}

interface speed{
    x: number;
    y: number;
}

interface preBuildMark{
    type: buildingTypes;
    size: size;
    position: position;
    snap: position;
    valid: boolean;
}

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        B U I L D I N G S                                  *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 

let buildingInProgress = false;

class Building {
    type: buildingTypes;
    size: size;
    position: position;
    constructor(type: buildingTypes, position: position) {
        this.type = type;
        this.position = position;
        this.size = getBuildingSize(type);
        for(let y = this.position.y; y < this.position.y + this.size.height; y += blockSize) {
            for(let x = this.position.x; x < this.position.x + this.size.width; x += blockSize) {
                const gy = Math.floor(y / blockSize);
                const gx = Math.floor(x / blockSize);
                if (gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) continue;
                if (!grid[gy]) grid[gy] = new Array(gridWidth).fill(null);
                grid[gy][gx] = this;
            }
        }
    }
}

let placedBuildings: Building[] = [];


function getBuildingSize(type: buildingTypes): size {
    switch(type) {
            case buildingTypes.HOUSE:
                return {width: blockSize * 2, height: blockSize * 2};
            case buildingTypes.FACTORY:
                return {width: blockSize * 3, height: blockSize * 3};
            case buildingTypes.SHOP:
                return {width: blockSize * 2, height: blockSize * 2};
            case buildingTypes.FARM:
                return {width: blockSize * 4, height: blockSize * 4};
            case buildingTypes.PATH:
                return {width: blockSize, height: blockSize};
            case buildingTypes.DEPOT:
                return {width: blockSize * 2, height: blockSize * 3};
            default:
                return {width: blockSize, height: blockSize};
        }
}

function renderBuildings() {
    for(let building of placedBuildings) {
        switch(building.type) {
            case buildingTypes.HOUSE:
                bgCtx.fillStyle = "cyan";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.FACTORY:
                bgCtx.fillStyle = "black";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.SHOP:
                bgCtx.fillStyle = "crimson";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.FARM:
                bgCtx.fillStyle = "brown";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.PATH:
                bgCtx.fillStyle = "gray";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.DEPOT:
                bgCtx.fillStyle = "purple";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            default:
                break;
        }
    }
}

function snapToGrid(position: position): position {
    return {
        x: Math.floor(position.x / blockSize) * blockSize,
        y: Math.floor(position.y / blockSize) * blockSize
    };
}

let preBuild: preBuildMark = {
    type: buildingTypes.HOUSE,
    position: {x: mouse.x, y: mouse.y},
    size: {width: blockSize, height: blockSize},
    snap: {x: 0, y: 0},
    valid: false
};

function renderPreBuild(preBuild: preBuildMark, color: string = "#0000FF") {
    pbgCtx.save();
    pbgCtx.globalAlpha = 0.5;
    pbgCtx.fillStyle = color;
    pbgCtx.fillRect(preBuild.snap.x, preBuild.snap.y, preBuild.size.width, preBuild.size.height);
    const sx = Math.max(0, preBuild.snap.x);
    const sy = Math.max(0, preBuild.snap.y);
    const sw = Math.max(0, preBuild.size.width);
    const sh = Math.max(0, preBuild.size.height);

    if (sy > 0) pbgCtx.clearRect(0, 0, pbg.width, sy);
    const bottomY = sy + sh;
    if (bottomY < pbg.height) pbgCtx.clearRect(0, bottomY, pbg.width, pbg.height - bottomY);
    if (sx > 0) pbgCtx.clearRect(0, sy, sx, sh);
    const rightX = sx + sw;
    if (rightX < pbg.width) pbgCtx.clearRect(rightX, sy, pbg.width - rightX, sh);

    let clearArea = {x: 0, y: 0, width: 0, height: 0};
    pbgCtx.clearRect(clearArea.x, clearArea.y, clearArea.width, clearArea.height);
    pbgCtx.restore();
}

function checkBuildingPosition(type: buildingTypes): boolean | null {
    let size: size = getBuildingSize(type);

    preBuild.type = type;
    preBuild.size = size;
    preBuild.snap = snapToGrid({x: mouse.x, y: mouse.y});

    if(buildingInProgress) {
        preBuild.position = preBuild.snap;
    }else{
        pbgCtx.clearRect(preBuild.snap.x, preBuild.snap.y, preBuild.size.width, preBuild.size.height);
    }

    if(preBuild.snap.x < 0 || preBuild.snap.y < 0 || preBuild.snap.x + size.width > bg.width || preBuild.snap.y + size.height > bg.height) {
        if(buildingInProgress) {
            renderPreBuild(preBuild, "#FFFF00");
            return null;
        }else{
            return true;
        }
    }

    for(let placedBuilding of placedBuildings) {
        if(!(preBuild.snap.x + size.width <= placedBuilding.position.x ||
             preBuild.snap.x >= placedBuilding.position.x + placedBuilding.size.width ||
             preBuild.snap.y + size.height <= placedBuilding.position.y ||
             preBuild.snap.y >= placedBuilding.position.y + placedBuilding.size.height)) {
            if(buildingInProgress) {
                preBuild.valid = false;
                renderPreBuild(preBuild, "#FF0000");
                return null;
            }
            return true;
        }
    }

    if(!(preBuild.snap.x + size.width <= player.location.x ||
            preBuild.snap.x >= player.location.x + player.size.width ||
            preBuild.snap.y + size.height <= player.location.y ||
            preBuild.snap.y >= player.location.y + player.size.height)) {
        if(buildingInProgress) {
            preBuild.valid = false;
            renderPreBuild(preBuild, "#FFFF00");
            return null;
        }
        return true;
    }

    for(let y = preBuild.snap.y; y < preBuild.snap.y + size.height; y += blockSize) {
        for(let x = preBuild.snap.x; x < preBuild.snap.x + size.width; x += blockSize) {
            const gy = Math.floor(y / blockSize);
            const gx = Math.floor(x / blockSize);
            if(gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) {
                if(buildingInProgress) {
                    preBuild.valid = false;
                    renderPreBuild(preBuild, "#FF0000");
                    return null;
                }else{
                    return true;
                }
            }
            if (grid[gy]?.[gx] != null) {
                if(buildingInProgress) {
                    preBuild.valid = false;
                    renderPreBuild(preBuild, "#FF0000");
                    return null;
                }else{
                    return true;
                }
            }
        }
    }

    if(buildingInProgress) {
        preBuild.valid = true;
        renderPreBuild(preBuild);
        return null;
    }
    return false;
}


function placeBuilding(type: buildingTypes): boolean {
    let status = checkBuildingPosition(type);
    if(status == null) return false;
    if(!status) {
        let newBuilding = new Building(type, preBuild.snap);
        placedBuildings.push(newBuilding);
        renderBuildings();
        return true;
    }else{
        if(!buildingInProgress) mpop("Cannot place building here!");
        return false;
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

function UpdateGame(timeStamp: number) {
    if(paused) return;
    if(buildingInProgress){
        checkBuildingPosition(preBuild.type);
        console.log("Building in progress", mouse);
    }
    frame++;
    const delta = timeStamp - LFT;
    if(delta >= frameDuration) {
        LFT = timeStamp - (delta % frameDuration);
        Render();
        process(
            placedBuildings.filter(b => b.type === buildingTypes.DEPOT).length,
            placedBuildings.filter(b => b.type === buildingTypes.FACTORY).length,
            placedBuildings.filter(b => b.type === buildingTypes.SHOP).length,
            placedBuildings.filter(b => b.type === buildingTypes.HOUSE).length,
            frame
        );
    }
    if(frame == 3000) mpop('Thx for playing Coding God! Please consider supporting me on Pateron <br> <a href="https://patreon.com/RUN1_IT"><img src="https://c5.patreon.com/external/favicon/rebrand/pwa-192.png" alt="Patreon" height="16" width="16">Support Me!</a>')
    requestAnimationFrame(UpdateGame);
}

function Render() {
    //player
    if(player.moved) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
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
    speed: 5/sizeReduction,
    location: {x: fg.width / 2, y: fg.height / 2},
    size: {width: blockSize / 2, height: blockSize / 2},
    moved: false
};

function movePlayerFromBuilding(building: buildingTypes) {
    if(!playerBuildingCollision({x: player.location.x+getBuildingSize(building).width+blockSize, y: player.location.y})) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location.x += getBuildingSize(building).width;
        player.moved = true;
    }else if(!playerBuildingCollision({x: player.location.x-blockSize, y: player.location.y})) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location.x -= blockSize;
        player.moved = true;
    }else if(!playerBuildingCollision({x: player.location.x, y: player.location.y+getBuildingSize(building).height+blockSize})) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        player.location.y += getBuildingSize(building).height;
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
}

addEventListener("mousemove", function(event) {
    const rect = fg.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / (rect.right - rect.left) * fg.width;
    const mouseY = (event.clientY - rect.top) / (rect.bottom - rect.top) * fg.height;
    mouse = {x: mouseX, y: mouseY};
});

addEventListener("keydown", function(event) {
    let pos: position = {x: (Math.floor(player.location.x / blockSize) * blockSize), y: (Math.floor(player.location.y / blockSize) * blockSize)};
    if(event.key === "b") {
        buildingInProgress = true;
        if(placeBuilding(buildingTypes.HOUSE))movePlayerFromBuilding(buildingTypes.HOUSE);
    }
    if(event.key === "p") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.PATH);
    }
    if(event.key === "f") {
        buildingInProgress = true;
        if(placeBuilding(buildingTypes.FACTORY))movePlayerFromBuilding(buildingTypes.FACTORY);
    }
    if(event.key === "t") {
        buildingInProgress = true;
        if(placeBuilding(buildingTypes.SHOP))movePlayerFromBuilding(buildingTypes.SHOP);
    }
    if(event.key === "r") {
        buildingInProgress = true;
        placeBuilding(buildingTypes.FARM);
    }
    if(event.key === "g") {
        buildingInProgress = true;
        if(placeBuilding(buildingTypes.DEPOT))movePlayerFromBuilding(buildingTypes.DEPOT);
    }


    //movement
    if(event.key === "ArrowUp" || event.key === "w" && 
         !playerBuildingCollision({x: player.location.x, y: player.location.y - player.speed})) {
        player.location.y -= player.speed;
        player.moved = true;
    }
    if(event.key === "ArrowDown" || event.key === "s" &&
         !playerBuildingCollision({x: player.location.x, y: player.location.y + player.speed})) {
        player.location.y += player.speed;
        player.moved = true;
    }
    if(event.key === "ArrowLeft" || event.key === "a" &&
         !playerBuildingCollision({x: player.location.x - player.speed, y: player.location.y})) {
        player.location.x -= player.speed;
        player.moved = true;
    }
    if(event.key === "ArrowRight" || event.key === "d" &&
         !playerBuildingCollision({x: player.location.x + player.speed, y: player.location.y})) {
        player.location.x += player.speed;
        player.moved = true;
    }
    if(event.key === " ") {
        if(buildingInProgress){
            buildingInProgress = false;
            placeBuilding(preBuild.type);
            if(preBuild.type == buildingTypes.PATH) buildingInProgress = true;
            pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
        }
    }
    if(event.key === "Escape") {
        if(buildingInProgress){
            buildingInProgress = false;
            pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
        }
    }
});

function playerBuildingCollision(player: position ): boolean {
    let playerSize: size = {width: blockSize / 2, height: blockSize / 2};
    for(let building of placedBuildings) {
        if(building.type === buildingTypes.PATH || building.type === buildingTypes.FARM) continue;
        if(!(player.x + playerSize.width <= building.position.x ||
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

addEventListener("visibilitychange", function() {
    if (document.hidden){
        paused = true;
    } else {
        requestAnimationFrame(UpdateGame);
        paused = false;
    }
});

StartGame();