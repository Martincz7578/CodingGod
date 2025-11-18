import { /*resumeGame,*/ frame } from "./game.js";

import { updatePrices, buildings, placedBuildings, buildingTypes, productionAmplifiers } from "./buildings.js";
import type { data, Building } from "./buildings.js";

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   U T I L S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 

interface resource  {name: string, price: number, k: number, minimum: number, growth: number, d: number, t0: number, tsat: number};

let resources = {
    raw: {
        coal: {name: "coal", price: 14, k: 0.20, minimum: 5, growth: 0, d: 0.2, t0: 100, tsat: 5000},
        iron: {name: "iron", price: 13, k: 0.15, minimum: 4, growth: 0, d: 0.4, t0: 200, tsat: 10000},
        stone: {name: "stone", price: 7, k: 0.03, minimum: 1, growth: 0, d: 0.1, t0: 50, tsat: 2500},
    },
    processed:{
        refinedCoal: {name: "refinedCoal", price: 27, k: 0.20, minimum: 18, growth: 0, d: 0.1, t0: 100, tsat: 5000},
        steel: {name: "steel", price: 55, k: 0.15, minimum: 46, growth: 0, d: 0.8, t0: 200, tsat: 10000},
        stoneBricks: {name: "stoneBricks", price: 13, k: 0.10, minimum: 4, growth: 0, d: 0.1, t0: 50, tsat: 2500},
    }
};

let playerStats= {
    raw: {
        total: 0,
        coal: 0,
        iron: 0,
        stone: 0
    },
    processed: {
        total: 0,
        refinedCoal: 0,
        steel: 0,
        stoneBricks: 0
    },
    money: 1000,
    food: 100
};

let populationData = {
    taxes: 0,
    morale: 100,
    hunger: false,
}

let demands = {
    raw: {
        coal: 0,
        iron: 0,
        stone: 0
    },
    processed: {
        refinedCoal: 0,
        steel: 0,
        stoneBricks: 0
    }
}

let shopsOpenned = false;

export function process(depots: number, foundries: number, shops: number, houses: number, farms: number, mines: number, masons: number) {
    if(frame % 15 === 0){ //every second
        demands.raw.coal = Math.floor(priceChange(resources.raw.coal, mines ? mines : 1, shopsOpenned && shops > 0 ? shopsOpenned : false));
        demands.raw.iron = Math.floor(priceChange(resources.raw.iron, mines ? mines : 1, shopsOpenned && shops > 0 ? shopsOpenned : false));
        demands.raw.stone = Math.floor(priceChange(resources.raw.stone, mines ? mines : 1, shopsOpenned && shops > 0 ? shopsOpenned : false));
        demands.processed.refinedCoal = Math.floor(priceChange(resources.processed.refinedCoal, foundries ? foundries : 1, shopsOpenned && shops > 0 ? shopsOpenned : false));
        demands.processed.steel = Math.floor(priceChange(resources.processed.steel, foundries ? foundries : 1, shopsOpenned && shops > 0 ? shopsOpenned : false));
        demands.processed.stoneBricks = Math.floor(priceChange(resources.processed.stoneBricks, masons ? masons : 1, shopsOpenned && shops > 0 ? shopsOpenned : false));

        console.log(demands);
        console.log(resources);

        //raw resource gathering
        playerStats.raw.coal += mines * buildings.mines.productionSpeed * productionAmplifiers.mines;
        playerStats.raw.iron += mines * buildings.mines.productionSpeed * productionAmplifiers.mines;
        playerStats.raw.stone += mines * buildings.mines.productionSpeed * productionAmplifiers.mines;

        //processing
        //coal to refined coal
        if(playerStats.raw.coal >= foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries){
            playerStats.processed.refinedCoal += foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries;
            playerStats.raw.coal -= foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries;
        }

        //iron to steel
        if(playerStats.raw.iron >= foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries &&
            playerStats.processed.refinedCoal >= foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries
        ){
            playerStats.processed.steel += foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries;
            playerStats.raw.iron -= foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries;
            playerStats.processed.refinedCoal -= foundries * buildings.foundry.productionSpeed * productionAmplifiers.foundries;
        }

        //stone to stone bricks
        if(playerStats.raw.stone >= masons * buildings.mason.productionSpeed * productionAmplifiers.masons){
            playerStats.processed.stoneBricks += masons * buildings.mason.productionSpeed * productionAmplifiers.masons;
            playerStats.raw.stone -= masons * buildings.mason.productionSpeed * productionAmplifiers.masons;
        }
        
        //cash flow
        if(shopsOpenned && shops > 0){
            if(playerStats.processed.steel > demands.processed.steel*shops){
                playerStats.money += demands.processed.steel * (resources.processed.steel.price*shops);
                playerStats.processed.steel -= demands.processed.steel*shops;
            }
            if(playerStats.processed.stoneBricks > demands.processed.stoneBricks*shops){
                playerStats.money += demands.processed.stoneBricks * (resources.processed.stoneBricks.price*shops);
                playerStats.processed.stoneBricks -= demands.processed.stoneBricks*shops;
            }
        }
        
        playerStats.money += (citizens.length ?? 1) * populationData.taxes / 100;

        //hunger process
        playerStats.food += farms * buildings.farm.productionSpeed;
        if(playerStats.food >= citizens.length){
            playerStats.food -= citizens.length;

        } else if (!populationData.hunger){
            mpop("You have run out of food to feed your population! Build farms to produce more food.", "Uh oh");
            populationData.hunger = true;
            playerStats.food = 0;
        }else{
            citizens.forEach((citizen, index) => {
                if(citizen.hunger <= 0){
                    citizens.splice(index, 1);
                }else{
                    citizen.happiness -= 10;
                }
                citizen.hunger -= 5;
                if(citizen.age >= Math.floor(Math.random() * 80) + 20){
                    removeCitizen(citizen);
                }
                if(citizen.happiness < Math.floor(Math.random() * 30)){
                    removeCitizen(citizen);
                }
            });
        }

        citizens.forEach(citizen => {
            if(frame % 255 === 0){
                citizen.age += 1;
            }
            if(populationData.taxes > 10){
                citizen.happiness -= populationData.taxes * 0.1;
            }
        });
        placedBuildings.forEach(building => {
            if(building.type === buildingTypes.HOUSE){
                if(building.householdMembers!.length < building.maxMembers! && building.householdMembers![0] != undefined){
                    Math.random() < 0.5 ? condicionedBirth(1, building.householdMembers![0]!.happiness, building.householdMembers![0]!.hunger,  building) : null     
                }
            }
        });

        popupData();
    }
    updateStatsDisplay();
    updatePrices(depots, foundries, shops, houses, farms, mines, masons);
}

export let citizens: citizen[] = [];

export class citizen{
    happiness: number;
    hunger: number;
    age: number;
    constructor(happiness: number, hunger: number){
        this.happiness = happiness;
        this.hunger = hunger;
        this.age = 0;
    }
}

export function birth(): citizen{
    const newCitizen = new citizen(100, 100);
    citizens.push(newCitizen);
    return newCitizen;
}

export function condicionedBirth(births: number, happiness: number, hunger: number, household: Building): void{
    if(household.householdMembers!.length >= 2 && happiness >= 70 && hunger >= 70){
        for(let i = 0; i < births; i++){
            const newCitizen = new citizen(100, 100);
            citizens.push(newCitizen);
            household.householdMembers?.push(newCitizen);   
        }
    }
}

export function reducePopulation(amount: number): void{
    for(let i = 0; i < amount; i++){
        removeCitizen(citizens.pop()!);
    }
}

function removeCitizen(citizen: citizen){
    placedBuildings.forEach((building, index) => {
        if(building.type === buildingTypes.HOUSE){
            building.householdMembers?.forEach((member, index) => {
                if(citizen === building.householdMembers![index]){
                    building.householdMembers!.splice(index, 1);
                }
            });
        }
    });
}

export function buyBuilding(data: data): boolean {
    if(playerStats.money >= data.price){
        playerStats.money -= data.price;
        updateStatsDisplay();
        return true;
    }else{
        mpop("You do not have enough money to build this building.", "Oh no");
        return false;
    }
}

export function mpop(content: string, closeText: string = "Close", build: boolean = false, title: string = "Notice") {
    const modal = document.querySelector('.modal') as HTMLDivElement;
    const modalContent = document.getElementById('content') as HTMLParagraphElement;
    const modalBuildContent = document.getElementById('buildcontent') as HTMLDivElement;
    const modalClose = document.getElementById('mclose') as HTMLButtonElement;

    const modalHeader = modal.querySelector('.mheader h3') as HTMLHeadingElement;
    modalHeader.innerText = title;

    modal.style.display = 'block';
    if(build){
        modalBuildContent.style.display = 'block';
        modalContent.style.display = 'none';
    } else {
        modalBuildContent.style.display = 'none';
        modalContent.style.display = 'block';
        modalContent.innerHTML = content;
    }
    modalClose.innerText = closeText;

    modalClose.focus();

    modalClose.onclick = function() {
        //resumeGame();
        mpopClose(modal);
    }
}

export function mpopClose(modal: HTMLDivElement) {
    modal.style.display = 'none';
}

//market functions
function getSupply(resource: resource) {
    switch(resource.name){
        case "coal":
            return playerStats.raw.coal;
        case "iron":
            return playerStats.raw.iron;
        case "stone":
            return playerStats.raw.stone;
        case "refinedCoal":
            return playerStats.processed.refinedCoal;
        case "steel":
            return playerStats.processed.steel;
        case "stoneBricks":
            return playerStats.processed.stoneBricks;
        default:
            return 0;
    }
}

function optimizeUnits(frames: number): number {
    let seconds = frames / 15;
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    let weeks = Math.floor(days / 7);
    let months = Math.floor(weeks / 4);
    let years = Math.floor(months / 12);
    if(years >= 1){
        return years;
    } else if(months >= 1){
        return months;
    } else if(weeks >= 1){
        return weeks;
    } else if(days >= 1){
        return days;
    } else if(hours >= 1){
        return hours;
    } else if(minutes >= 1){
        return minutes;
    } else if(seconds >= 1){
        return seconds;
    }else{
        return frames;
    }
}

function priceChange(resource: resource, productionBuildings: number, sell: boolean = false): number {
    if(resource.growth > 0){
        if(resource.growth > 100)resource.growth -= 100;
        else resource.growth = 0;
        resource.t0 += 30;
        resource.tsat += 60;
    }else if(resource.price <= resource.minimum && resource.t0 < frame){
        resource.growth = (Math.random() * (10 - 1) + 1) * 1000;
    }
    const supply = sell ? getSupply(resource) : 0;
    const maxDemand = ((citizens.length ?? 1) * 0.3);
    const logistic = maxDemand / (1 + Math.exp(-resource.k*(frame-resource.t0)));
    const decay = Math.exp(-resource.d*Math.max(0, optimizeUnits(frame) - optimizeUnits(resource.tsat)));
    const PreDemand = logistic * decay;
    const Demand = Math.min(PreDemand, maxDemand);
    const aF = 0.05 * (maxDemand / Math.max(1, productionBuildings));
    const newPrice = resource.price += aF * (Demand - supply);
    resource.price = Math.max(resource.minimum, newPrice);
    return Demand;  
}

//stats
const rawSpan = document.getElementById("raw") as HTMLSpanElement;
const processedSpan = document.getElementById("processed") as HTMLSpanElement;
const moneySpan = document.getElementById("money") as HTMLSpanElement;
const foodSpan = document.getElementById("food") as HTMLSpanElement;

function updateStatsDisplay() {
    playerStats.raw.total = playerStats.raw.coal + playerStats.raw.iron + playerStats.raw.stone;
    playerStats.processed.total = playerStats.processed.refinedCoal + playerStats.processed.steel + playerStats.processed.stoneBricks;
    rawSpan.innerText = `Raw: ${playerStats.raw.total.toFixed(0)}`;
    processedSpan.innerText = `Processed: ${playerStats.processed.total.toFixed(0)}`;
    moneySpan.innerText = `Money: ${playerStats.money.toFixed(2)}`;
    foodSpan.innerText = `Food: ${playerStats.food.toFixed(0)}`;
}

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P A G E   L O O K S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 

function setTheme(theme: 'light' | 'dark'){
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.cookie = "theme=" + theme + ";path=/;max-age=" + (3600*24*30);
}

function getCookie(name: string){
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

const savedTheme = getCookie('theme') as 'light' | 'dark' | null;
if(savedTheme) setTheme(savedTheme);
else setTheme('light');

document.getElementById('theme')?.addEventListener('change', (event) => {
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    setTheme(current === 'light' ? 'dark' : 'light');
});

/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P O P U P S                                        *
 *                                                                           *
 *---------------------------------------------------------------------------*/ 

const rawPopup = document.getElementById('raw') as HTMLDivElement;
const processedPopup = document.getElementById('processed') as HTMLDivElement;
const moneyPopup = document.getElementById('money') as HTMLDivElement;

const rawInfo = document.getElementById('rawdet') as HTMLDivElement;
const processedInfo = document.getElementById('procdet') as HTMLDivElement;
const moneyInfo = document.getElementById('incomes') as HTMLDivElement;

rawPopup.addEventListener('click', () => {
    if(rawInfo.style.display === 'block'){
        rawInfo.style.display = 'none';
    } else {
        rawInfo.style.display = 'block';
    }
});

processedPopup.addEventListener('click', () => {
    if(processedInfo.style.display === 'block'){
        processedInfo.style.display = 'none';
    } else {
        processedInfo.style.display = 'block';
    }
});

moneyPopup.addEventListener('click', () => {
    if(moneyInfo.style.display === 'block'){
        moneyInfo.style.display = 'none';
    } else {
        moneyInfo.style.display = 'block';
    }
});

function popupData(){
    rawInfo.innerHTML = `Raw:<br>
    Coal: ${playerStats.raw.coal.toFixed(0)}, Price: ${resources.raw.coal.price.toFixed(2)}<br>
    Iron: ${playerStats.raw.iron.toFixed(0)}, Price: ${resources.raw.iron.price.toFixed(2)}<br>
    Stone: ${playerStats.raw.stone.toFixed(0)}, Price: ${resources.raw.stone.price.toFixed(2)}<br>`;

    processedInfo.innerHTML = `Processed:<br>
    Refined Coal: ${playerStats.processed.refinedCoal.toFixed(0)}, Price: ${resources.processed.refinedCoal.price.toFixed(2)}<br>
    Steel: ${playerStats.processed.steel.toFixed(0)}, Price: ${resources.processed.steel.price.toFixed(2)}<br>
    Stone Bricks: ${playerStats.processed.stoneBricks.toFixed(0)}, Price: ${resources.processed.stoneBricks.price.toFixed(2)}<br>`;

    moneyInfo.innerHTML = `Money:<br>
    Current Balance: $${playerStats.money.toFixed(2)}<br>
    Income:`;
}   

//terminals
const productionTerminalButton = document.getElementById('productionTerminal') as HTMLButtonElement;
productionTerminalButton.addEventListener('click', () => {
    const content = `
    <h3>Production Terminal</h3>
    <label for="MinAmp" id="MinAmpLabel">Set Mines Production Rate (%): </label>
    <input type="range" id="MinAmp" name="productionRate" min="0" max="200" value="${productionAmplifiers.mines * 100}"><br>
    <label for="FouAmp" id="FouAmpLabel">Set Foundries Production Rate (%): </label>
    <input type="range" id="FouAmp" name="productionRate" min="0" max="200" value="${productionAmplifiers.foundries * 100}"><br>
    <button id="setProductionRate">Set Rate</button>
    <button id="dumbResources">Dump Resources</button>
    <h3>Taxes</h3>
    <label for="taxRate" id="taxRateLabel">Set Tax Rate (%): </label>
    <input type="range" id="taxRate" name="taxRate" min="0" max="50" value="${populationData.taxes}"><br>
    <button id="setTaxRate">Set Tax Rate</button><br>
    <button id="toggleShops">Toggle Shops</button><p>Current Status: ${shopsOpenned ? "Open" : "Closed"}</p>
    `;
    mpop(content, "Close", false, "Production Terminal");
    const setButton = document.getElementById('setProductionRate') as HTMLButtonElement;
    const FauAmp = document.getElementById('FouAmp') as HTMLInputElement;
    const MinAmp = document.getElementById('MinAmp') as HTMLInputElement;
    const dumpButton = document.getElementById('dumbResources') as HTMLButtonElement;
    setButton.addEventListener('click', () => {
        const ParsedMinAmp = parseInt(MinAmp.value);
        productionAmplifiers.mines = ParsedMinAmp / 100;
        const ParsedFacAmp = parseInt(FauAmp.value);
        productionAmplifiers.foundries = ParsedFacAmp / 100;
        mpopClose(document.querySelector('.modal') as HTMLDivElement);
        //resumeGame();
    });
    dumpButton.addEventListener('click', () => {
        playerStats.raw.coal = 0;
        playerStats.raw.iron = 0;
        playerStats.raw.stone = 0;
        playerStats.processed.refinedCoal = 0;
        playerStats.processed.steel = 0;
        playerStats.processed.stoneBricks = 0;
        mpopClose(document.querySelector('.modal') as HTMLDivElement);
        //resumeGame();
    });
    FauAmp.addEventListener('input', () => {
        document.getElementById('FouAmpLabel')!.innerText = `Set Production Rate (%): ${FauAmp.value}%`;
    });
    MinAmp.addEventListener('input', () => {
        document.getElementById('MinAmpLabel')!.innerText = `Set Production Rate (%): ${MinAmp.value}%`;
    });

    const taxRateInput = document.getElementById('taxRate') as HTMLInputElement;
    const taxRateLabel = document.getElementById('taxRateLabel') as HTMLLabelElement;
    const setTaxButton = document.getElementById('setTaxRate') as HTMLButtonElement;

    taxRateInput.addEventListener('input', () => {
        taxRateLabel.innerText = `Set Tax Rate (%): ${taxRateInput.value}%`;
    });
    
    setTaxButton.addEventListener('click', () => {
        const taxRate = parseInt(taxRateInput.value);
        populationData.taxes = taxRate;
        mpopClose(document.querySelector('.modal') as HTMLDivElement);
        //resumeGame();
    });

    const toggleShopsButton = document.getElementById('toggleShops') as HTMLButtonElement;
    toggleShopsButton.addEventListener('click', () => {
        shopsOpenned = !shopsOpenned;
        mpopClose(document.querySelector('.modal') as HTMLDivElement);
        //resumeGame();
    });
});