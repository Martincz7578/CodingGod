var _a;
import { pauseGame, resumeGame, updatePrices } from "./game.js";
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        G A M E   U T I L S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/
export function process(depots, factories, shops, houses, farms, frames) {
    if (frames % 15 === 0) { //every second
        //depot process
        playerStats.raw += depots * IPS;
        //factory process
        if (playerStats.raw >= factories * 2 * PPS) {
            playerStats.processed += factories * PPS;
            playerStats.raw -= factories * PPS * 2;
        }
        //shop process
        if (playerStats.processed >= shops && playerStats.processed >= houses) {
            for (let i = 0; i < shops; i++) {
                let housePurchase = Math.random() > 0.5 ? 1 : 2;
                playerStats.money += 10 * housePurchase;
                playerStats.processed -= housePurchase;
            }
        }
        //hunger process
        playerStats.food += farms * 5;
        if (playerStats.food >= houses) {
            playerStats.food -= houses;
        }
        else {
            mpop("You have run out of food to feed your population! Build farms to produce more food.", "Uh oh");
        }
    }
    updateStatsDisplay();
    updatePrices(depots, factories, shops, houses, farms);
}
export function buyBuilding(data) {
    if (playerStats.money >= data.price) {
        playerStats.money -= data.price;
        updateStatsDisplay();
        return true;
    }
    else {
        mpop("You do not have enough money to build this building.", "Oh no");
        return false;
    }
}
export function mpop(content, closeText = "Close") {
    const modal = document.querySelector('.modal');
    const modalContent = document.getElementById('content');
    const modalClose = document.getElementById('mclose');
    pauseGame();
    modal.style.display = 'block';
    modalContent.innerHTML = content;
    modalClose.innerText = closeText;
    modalClose.focus();
    modalClose.onclick = function () {
        modal.style.display = 'none';
        resumeGame();
    };
}
//stats
const rawSpan = document.getElementById("raw");
const processedSpan = document.getElementById("processed");
const moneySpan = document.getElementById("money");
const foodSpan = document.getElementById("food");
let playerStats = { raw: 0, processed: 0, money: 1000, food: 100 };
function updateStatsDisplay() {
    rawSpan.innerText = `Raw: ${playerStats.raw}`;
    processedSpan.innerText = `Processed: ${playerStats.processed}`;
    moneySpan.innerText = `Money: ${playerStats.money}`;
    foodSpan.innerText = `Food: ${playerStats.food}`;
}
const IPS = 60; //import per second
const PPS = 10; //processed per second
/*----------------------------------------------------------------------------
 *                                                                           *
 *                        P A G E   L O O K S                                *
 *                                                                           *
 *---------------------------------------------------------------------------*/
function setTheme(theme) {
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    document.cookie = "theme=" + theme + ";path=/;max-age=" + (3600 * 24 * 30);
}
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}
const savedTheme = getCookie('theme');
if (savedTheme)
    setTheme(savedTheme);
else
    setTheme('light');
(_a = document.getElementById('theme')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (event) => {
    const current = document.body.classList.contains('light') ? 'light' : 'dark';
    setTheme(current === 'light' ? 'dark' : 'light');
});
//# sourceMappingURL=economy.js.map