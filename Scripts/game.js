var _a, _b, _c, _d, _e, _f;
import { process, mpop, mpopClose, citizens } from './economy.js';
import { buildingInProgress, checkBuildingPosition, preBuild, placedBuildings, buildingTypes, placeBuilding, setBuildingState, removeBuildingAtPosition } from './buildings.js';
/*
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
const fg = document.getElementById("fg");
const pbg = document.getElementById("pbg");
const bg = document.getElementById("bg");
const fgCtx = fg.getContext("2d");
const pbgCtx = pbg.getContext("2d");
const bgCtx = bg.getContext("2d");
export const priceTag = document.getElementById("priceTag");
const populationSpan = document.getElementById("population");
fg.width = screen.width;
fg.height = screen.height - ((_b = (_a = document.getElementById("head")) === null || _a === void 0 ? void 0 : _a.offsetHeight) !== null && _b !== void 0 ? _b : 0);
pbg.width = screen.width;
pbg.height = screen.height - ((_d = (_c = document.getElementById("head")) === null || _c === void 0 ? void 0 : _c.offsetHeight) !== null && _d !== void 0 ? _d : 0);
bg.width = screen.width;
bg.height = screen.height - ((_f = (_e = document.getElementById("head")) === null || _e === void 0 ? void 0 : _e.offsetHeight) !== null && _f !== void 0 ? _f : 0);
window.dispatchEvent(new Event('canvas set-up'));
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   U T I L S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/
export let frame = 0;
//let gameInterval: number;
let started = false;
//let paused = false;
let mouse = { x: 0, y: 0 };
//frames
let LFT = 0;
const targetFPS = 15;
const frameDuration = 1000 / targetFPS;
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   L O G I C                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/
function StartGame() {
    started = true;
    requestAnimationFrame(UpdateGame);
}
function UpdateGame(timeStamp) {
    if (buildingInProgress) {
        checkBuildingPosition(preBuild.type);
    }
    frame++;
    const delta = timeStamp - LFT;
    if (delta >= frameDuration) {
        LFT = timeStamp - (delta % frameDuration);
        Render();
        process(placedBuildings.filter(b => b.type === buildingTypes.DEPOT).length, placedBuildings.filter(b => b.type === buildingTypes.FOUNDRY).length, placedBuildings.filter(b => b.type === buildingTypes.SHOP).length, placedBuildings.filter(b => b.type === buildingTypes.HOUSE).length, placedBuildings.filter(b => b.type === buildingTypes.FARM).length, placedBuildings.filter(b => b.type === buildingTypes.MINES).length, placedBuildings.filter(b => b.type === buildingTypes.MASON).length);
    }
    populationSpan.innerText = `Population: ${citizens.length}`;
    if (frame == 3000)
        mpop('Thx for playing Coding God! Please consider supporting me on Pateron <br> <a href="https://patreon.com/RUN1_IT"><img src="https://c5.patreon.com/external/favicon/rebrand/pwa-192.png" alt="Patreon" height="16" width="16">Support Me!</a>');
    requestAnimationFrame(UpdateGame);
}
function Render() { }
export function cancelBuilding() {
    pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
    setBuildingState(false);
}
function contruction(type) {
    setBuildingState(true);
    placeBuilding(type);
    mpopClose(modal);
}
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P L A Y E R                                        *
 *                                                                           *
 *---------------------------------------------------------------------------*/
const buildButtons = document.querySelectorAll('.build');
const modal = document.querySelector('.modal');
buildButtons.forEach(button => {
    button.addEventListener('click', () => {
        switch (button.value) {
            case 'house':
                contruction(buildingTypes.HOUSE);
                break;
            case 'foundry':
                contruction(buildingTypes.FOUNDRY);
                break;
            case 'shop':
                contruction(buildingTypes.SHOP);
                break;
            case 'farm':
                contruction(buildingTypes.FARM);
                break;
            case 'depot':
                contruction(buildingTypes.DEPOT);
                break;
            case 'mines':
                contruction(buildingTypes.MINES);
                break;
            case 'path':
                contruction(buildingTypes.PATH);
                break;
            case 'mason':
                contruction(buildingTypes.MASON);
            default:
                break;
        }
    });
});
addEventListener("mousemove", function (event) {
    const rect = fg.getBoundingClientRect();
    const mouseX = (event.clientX - rect.left) / (rect.right - rect.left) * fg.width;
    const mouseY = (event.clientY - rect.top) / (rect.bottom - rect.top) * fg.height;
    mouse = { x: mouseX, y: mouseY };
});
addEventListener("keydown", function (event) {
    if (event.key === "b") {
        mpop("content", "Cancel", true, "Build Menu");
        //resumeGame();
    }
    if (event.key === "c") {
        setBuildingState(false);
        priceTag.innerText = ``;
        removeBuildingAtPosition(mouse);
        pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
    }
    if (event.key === " ") {
        if (buildingInProgress) {
            setBuildingState(false);
            placeBuilding(preBuild.type);
            if (preBuild.type == buildingTypes.PATH)
                setBuildingState(true);
            pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
        }
        priceTag.innerText = ``;
    }
    if (event.key === "Escape") {
        if (buildingInProgress) {
            setBuildingState(false);
            pbgCtx.clearRect(0, 0, pbg.width, pbg.height);
            priceTag.innerText = ``;
        }
        //resumeGame();
        mpopClose(modal);
    }
});
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        T E C H N I C A L                                  *
 *                                                                           *
 *---------------------------------------------------------------------------*/
/*addEventListener("visibilitychange", function() {
    if (document.hidden){
        paused = true;
    } else {
        requestAnimationFrame(UpdateGame);
        paused = false;
    }
});*/
StartGame();
//# sourceMappingURL=game.js.map