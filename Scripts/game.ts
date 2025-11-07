/*----------------------------------------------------------------------------
 *                                                                           *
 *                        C A N V A S   S E T   U P                          *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 
let sizeReduction = 1;

const fg = document.getElementById("fg") as HTMLCanvasElement;
const bg = document.getElementById("bg") as HTMLCanvasElement;
const fgCtx = fg.getContext("2d") as CanvasRenderingContext2D;
const bgCtx = bg.getContext("2d") as CanvasRenderingContext2D;

fg.width = screen.width/sizeReduction;
fg.height = screen.height/sizeReduction;
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
    PATH
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
    grid[y] = [];
    for(let x = 0; x < gridWidth; x++) {
        grid[y][x] = null;
    }
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

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        B U I L D I N G S                                  *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 

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
                grid[y / blockSize][x / blockSize] = this;
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
            default:
                return {width: blockSize, height: blockSize};
        }
}

function renderBuildings() {
    for(let building of placedBuildings) {
        switch(building.type) {
            case buildingTypes.HOUSE:
                bgCtx.fillStyle = "blue";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.FACTORY:
                bgCtx.fillStyle = "black";
                bgCtx.fillRect(building.position.x, building.position.y, building.size.width, building.size.height);
                break;
            case buildingTypes.SHOP:
                bgCtx.fillStyle = "yellow";
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
            default:
                break;
        }
    }
}

function checkBuildingPosition(playerPos: position, type: buildingTypes): boolean{
    let size: size = getBuildingSize(type);

    if(playerPos.x < 0 || playerPos.y < 0 || playerPos.x + size.width > bg.width || playerPos.y + size.height > bg.height) {
        return true;
    }

    for(let placedBuilding of placedBuildings) {
        if(!(playerPos.x + size.width <= placedBuilding.position.x ||
             playerPos.x >= placedBuilding.position.x + placedBuilding.size.width ||
             playerPos.y + size.height <= placedBuilding.position.y ||
             playerPos.y >= placedBuilding.position.y + placedBuilding.size.height)) {
            return true;
        }
    }

    for(let y = playerPos.y; y < playerPos.y + size.height; y += blockSize) {
        for(let x = playerPos.x; x < playerPos.x + size.width; x += blockSize) {
            const gy = Math.floor(y / blockSize);
            const gx = Math.floor(x / blockSize);
            if(gy < 0 || gx < 0 || gy >= gridHeight || gx >= gridWidth) {
                return true;
            }
            if(grid[gy][gx] !== null) {
                return true;
            }
        }
    }

    return false;
}


function placeBuilding(type: buildingTypes, position: position): boolean {
    if(!checkBuildingPosition(position, type)) {
        let newBuilding = new Building(type, position);
        placedBuildings.push(newBuilding);
        renderBuildings();
        return true;
    }else{
        alert("Cannot place building here!");
        return false;
    }
}

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   L O G I C                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 

function StartGame() {
    fgCtx.fillStyle = "orange";
    fgCtx.fillRect(player.location.x, player.location.y, blockSize / 2, blockSize / 2); 
    requestAnimationFrame(UpdateGame);
}

function UpdateGame(timeStamp: number) {
    if(paused) return;
    frame++;
    const delta = timeStamp - LFT;
    if(delta >= frameDuration) {
        LFT = timeStamp - (delta % frameDuration);
        DrawGame();
    }
    requestAnimationFrame(UpdateGame);
}

function DrawGame() {
    //player
    if(player.moved) {
        fgCtx.clearRect(player.location.x-blockSize*2, player.location.y-blockSize*2, blockSize*4, blockSize*4);
        fgCtx.fillStyle = "orange";
        fgCtx.fillRect(player.location.x, player.location.y, blockSize / 2, blockSize / 2);
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

addEventListener("keydown", function(event) {
    let pos: position = {x: (Math.floor(player.location.x / blockSize) * blockSize), y: (Math.floor(player.location.y / blockSize) * blockSize)};
    if(event.key === "b") {
        if(placeBuilding(buildingTypes.HOUSE, pos))movePlayerFromBuilding(buildingTypes.HOUSE);
    }
    if(event.key === "p") {
        placeBuilding(buildingTypes.PATH, pos);
    }
    if(event.key === "f") {
        if(placeBuilding(buildingTypes.FACTORY, pos))movePlayerFromBuilding(buildingTypes.FACTORY);
    }
    if(event.key === "t") {
        if(placeBuilding(buildingTypes.SHOP, pos))movePlayerFromBuilding(buildingTypes.SHOP);
    }
    if(event.key === "r") {
        placeBuilding(buildingTypes.FARM, pos)
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
        if(!started) {
            StartGame();
            started = true;
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