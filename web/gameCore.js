/*  System Variable */
var time,timer;
var MouseOn = false;
var now = null; // to store whose turn is this. value: "player" or "enemy"
var socketReady = false;
var lock = true;
var debugMode = false;
let dialogDisplay = false;
var playerChooseStatus = false;
var curName = "";
var eneName = "";
var drawID = "";
var poisonDamage = "";
var tradeChoose = "";
var handCards = [];

/* DOM Objects */
var cardContainer = $('.cards.container')[0];
var $dialog = $('#modal');
var log = $('#log')[0];
var $gameStatus = $('#status');

/* text */
// cards
const cards = {'1': '攻擊', '2': '防禦', '3': '治癒', '4': '補給', '5': '強奪', '6': '奇襲', '7': '交易', '8': '洞悉', '9': '妙策', '10': '掃射', '11': '加護', '12': '劇毒', '13': '詛咒', '14': '反制', '15': '狂亂', '16': '逆轉'};
const cardsDescription = {"1":"對敵方造成兩點傷害","2":"回復一點生命<br>被動:抵擋攻擊類卡片","3":"回復兩點生命","4":"抽取兩張手牌","5":"從敵方手牌中選擇一張加入自己的手牌","6":"對敵方造成一點傷害，並使其隨機損失一張手牌","7":"選取一張手牌與敵方交換","8":"抽取三張手牌<br>被動:抵擋攻擊類卡片，並抽取一張手牌、抵擋強奪的效果","9":"從牌庫中隨機挑出三張卡片，選擇一張加入手牌","10":"對敵方造成零～五點傷害","11":"回復三點生命，並解除中毒","12":"使敵方中毒：每個回合，玩家會損失一點生命","13":"使其損失四點生命，並隨機損失一張手牌","14":"使敵方生命減半<br>被動:抵擋攻擊類卡片，並反彈其傷害和效果","15":"回復三點生命，並對敵方造成三點傷害","16":"使自己與敵方的生命交換"}

const characters = {'1': '安', '2': '圭月', '3': '梅', '4': '小兔', '5': '銀', '6': '正作', '7': 'W', '8': '桑德', '9': '海爾', '10': '雪村'};

// templates
const cardTemplate = `<a class="ts card" data-id="{{ id }}"><div class="content"><div class="header">{{ name }}</div><div class="meta">{{ id }}</div><div class="description">{{ description }}</div></div></a>`;
const listCardTemplate = `<div class="disabled item" data-id="{{ id }}"><div class="ts header">{{ name }}<div class="sub header">{{ description }}</div></div></div>`;
const logTemplate = `<div class="{{ isSelf }} speech"><div class="content">{{ content }}</div></div>`;
const logDivider = `<div class="ts horizontal divider">{{ player }} Turn {{ turn }}</div>`;

// messages
const messages = {
	"attack": "{} 攻擊 {}",
	"damaged": "{} 受到{}點傷害",
	"defended": "{} 防禦成功",
	"defend": "{} 沒什麼可以防禦的，回復一點生命",
	"heal": "{} 回復兩點生命",
	"supply": "{} 增加兩張手牌",
	"rob": "{} 正在對 {} 行搶",
	"cantRob": "{}沒有搶到任何東西",
	"robbed": "{} 搶到了 {}",
	"surprise": "{} 發動奇襲",
	"surprised": "{} 受到{}點傷害，而且掉了一張手牌",
	"surNoCard": "{} 受到{}點傷害",
	"trade": "{} 想與 {} 進行交易",
	"tradeChoose": "{} 選擇了 {}",
	"tradeNoCard": "{} 沒有卡片可以交易",
	"awared": "{} 洞悉了 {} 的{}，並抽取了一張手牌",
	"aware": "{} 增加三張手牌",
	"plan": "{} 有個妙策",
	"sweep": "{} 對 {} 進行掃射，威力是 {}",
	"bless": "{} 獲得加護，身上的毒素一掃而空，並回復三點生命，還抽取了兩張手牌",
	"poison": "{} 在食物下毒，{}中毒了",
	"curse": "{} 詛咒了 {}，使其損失四點生命，並掉了一張手牌",
	"curseNoCard": "{} 詛咒了 {}，使其損失四點生命",
	"countered": "{} 反制了 {} 的攻擊，反彈了{}點傷害",
	"counteredSur": "{} 反制了 {} 的攻擊，反彈了{}點傷害，並使其掉了一張手牌",
	"counter": "{} 反制了敵手，使 {} 生命值減半了!",
	"chaos": "{} 進入狂亂模式，回復三點生命，並對 {} 造成三點傷害",
	"reverse": "{} 一口氣逆轉了情勢",
	"noCard": "{} 抽到了死神",
	"poisonDamaged": "{} 受到了劇毒的侵蝕，損失{}點生命",
	"surrender": "{}投降",
	"firstAttack": "{}先攻",
	"win": "{}獲勝",
	"draw": "{}抽到了{}",
	"drawEne": "{}抽了一張卡片",
	"use": "{}使用了{}",
	"eneDisconn": "因敵方斷線，所以{}獲勝"
};
/* text end */

// handler
function wsHandler(dataJson) {
    if (debugMode) { // debugging data
        rawLog(dataJson);
    }
    // define the current player and update player status
    if (dataJson.now === "player") {
        now = "player";
        gameUpdate(dataJson);
        $('#skip').removeClass('disabled');
    } else if (dataJson.now === "enemy") {
        now = "enemy";
        gameUpdate(dataJson);
        $('#skip').addClass('disabled');
    }
    /* special cases */
    if (dataJson.toString().match(/^[0-9]{1,5}$/)) { // contains only number => room id
        id = dataJson.toString();
        gameUpdate({ "room": id });
        return null;
    }
    if (dataJson.room) { // game start
        curName = dataJson['cur'];
        eneName = dataJson['ene'];
        setPlayerName(curName);
        setEnemyName(eneName);
        $('#enemy .icon').css('opacity','1'); // show enemy avatar
        return null;
    }
    if (dataJson.action) { // time for users to do more action!
        // Received: {"msg": "rob", "data": ["W", "\u96ea\u6751"], "action": "toRob", "value": {"enemy_card": ["5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5", "5"]}}
        statusInitialize();
        lock = false;
        switch (dataJson.action) {
            case "toDefend":
                askGuard(dataJson.value);
                break;
            case "toRob":
                chooseRob(dataJson.value['enemy_card']);
                break;
            case "toBeRobbed":
                askDefendRob();
                break;
            case "toTrade":
                if (dataJson.value)　{
                    chooseTrade(dataJson.value['hand'])
                } else {
                    chooseTrade(handCards,tradeChoose); 
                }
                break;
            case "toAdd":
                choosePlan(dataJson.value['cards']);
                break;
            default:
                break;
        }
    }

    // normal situation
    if (dataJson.msg) {
        switch (dataJson.msg) {
            case "draw":
                drawID = dataJson.data[1]; // card ID
                break;
            case "use":
                useID = dataJson.data[1]; // card ID
                dataJson.data[1] = cards[useID]; // edit data
                Log(dataJson);
                break;
            case "robbed":
                LogPlayerChoose("robbed",dataJson.data);
                break;
            case "tradeChoose":
                tradeChoose = dataJson.data[1] // set system variable, cardID
                LogPlayerChoose("tradeChoose",dataJson.data);
                break;
            case "poisonDamaged":
                poisonDamage = dataJson.data[1]; // posion level
                break;
            case "win":
                if (dataJson.data[0] === "player") {
                    playerWin();
                    dataJson.data[0] = '你';
                    Log(dataJson);
                } else if (dataJson.data[0] === "enemy") {
                    playerLose();
                }
                break;
            case "eneDisconn":
                playerWin();
                Log(dataJson);
                break;
            default:
                Log(dataJson);
                break;
        }
    }
    
}

function wsOnClose() {
    console.log("Disconnected");
    ts('.snackbar').snackbar({
        content: '已中斷連線',
    });
    statusInitialize();
    $gameStatus.html('連線已中斷');
    $gameStatus.addClass('warning');
    $('#skip').addClass('disabled');
    $('#giveup').addClass('disabled');
    unsetCardListener();
    socketReady = false;
}

function wsOnOpen(status) {
    console.log("Connected! Status:" + status);
    ts('.snackbar').snackbar({
        content: '連線成功!'
    });
    socketReady = true;
}

function wsOnError(except) {
    ts('.snackbar').snackbar({
        content: '連線失敗!',
        action: '重試',
        actionEmphasis: 'negative',
        onAction: () => {
            init();
        }
    });
    console.log(except);
} // https://stackoverflow.com/questions/25779831/how-to-catch-websocket-connection-to-ws-xxxnn-failed-connection-closed-be

// listener
function setCardListener() {
    $('.cards.container').on("click", 'a.ts.card', (e) => {
        let el = e.currentTarget;
        useCard(el.dataset.id);
    });
}

function unsetCardListener() {
    $('.cards.container').off("click");
}

function setModalCardListListener() {
    $('#modal .ts.list').on("click", '.item', (e) => {
        let el = e.currentTarget;
        useCard(el.dataset.id);
        setModalState(false);
    });
}

function setModalSkipButtonListener() {
    $('#modal #modalSkipBtn').click(function() {
        send(0);
        setModalState(false);
    });
}

function setModalContent(header, content, actions) {
    $dialog.children('.header').html(header);
    $dialog.children('.content').html(content);
    $dialog.children('.actions').html(actions)
}

$('#skip').click(function() {
    if (!$(this).hasClass('disabled')) {
        send(0);
    }
});

$('#giveup').click(function() {
    setModalContent(
        "你放棄人生了，SAD",
        `<div style="display: flex; justify-content: center;"><img src="./thinking.png" style="max-height: 60vh"></div>'`,
        `<button id="close" class="ts button">關閉視窗</button><button id="restart" class="ts primary button">重啟對戰</button><button id="returnIndex" class="ts positive button">返回主畫面</button>`
    );
    timerInitialize(); // also remember to stop the timer
    setModalState(true);
    resultListener();
    quit();
});

function resultListener() {
    $('#returnIndex').click(function() {
        location.href = './index.html';
    });
    $('#restart').click(function() {
        location.reload();
    });
    $('#close').click(function() {
        setModalState(false);
    });
}

// log
log.addEventListener("mouseover", function() { MouseOn = true; }); // if mouse is over the div, don't scroll to bottom
log.addEventListener("mouseleave", function() { MouseOn = false; });

function Log(msgJson) {
    let node = logTemplate;
    node = (now === "player") ? node.replace("{{ isSelf }}","right") : node.replace("{{ isSelf }}",""); // to distinguish if this is self log or enemy log
    node = node.replace("{{ content }}",messages[msgJson['msg']].format(msgJson['data']));
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
}

function LogPlayerDraw() {
    let node = logTemplate.replace("{{ isSelf }}","right");
    node = node.replace("{{ content }}",messages['draw'].format([curName,cards[drawID]])); // msgJson['data'][0] player name, msgJson['data'][1] card id
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
    drawID = "";
}

function LogPlayerChoose(type,data) {
    let node = logTemplate;
    let name = data[0];
    let chooseID = data[1];
    if (playerChooseStatus || type === "robbed") {
        node = (now === "player") ? node.replace("{{ isSelf }}","right") : node.replace("{{ isSelf }}",""); // to distinguish if this is self log or enemy log
    } else {
        node = (now === "player") ? node.replace("{{ isSelf }}","") : node.replace("{{ isSelf }}","right"); // if this is the second one playerChoose message, then this is another one's choice
    }
    
    node = node.replace("{{ content }}",messages[type].format([name,cards[chooseID]])); // msgJson['data'][0] player name, msgJson['data'][1] card id
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
    playerChooseStatus = (playerChooseStatus && type !== "robbed") ? false : true; // to count this is first playerChoose message or second one in the turn
}

function LogPlayerPoisonDamaged() {
    let node = logTemplate;
    let tmpName = "";
    if(now === "player") { // to distinguish if this is self log or enemy log
        node = node.replace("{{ isSelf }}","right");
        tmpName = curName;
    } else if (now === "enemy") {
        node = node.replace("{{ isSelf }}","");
        tmpName = eneName;
    }
    node = node.replace("{{ content }}",messages['poisonDamaged'].format([tmpName,poisonDamage])); // msgJson['data'][0] player name, msgJson['data'][1] card id
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
    poisonDamage = "";
}

function rawLog(msg) {
    console.log(JSON.stringify(msg));
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
}

function logTurn(playerName,playerTurn) {
    let node = logDivider;
    node = node.replace("{{ player }}",playerName);
    node = node.replace("{{ turn }}",playerTurn);
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
}

// game status updater
function gameUpdate(data) {
    if (data.room) {
        document.querySelector('.statistic > .value').textContent = data.room.padStart(5,'0');
    } else if (data.now) {
        let turn = document.querySelector('#turn');
        if (data.now === "player") {
            turn.innerHTML = curName+" Turn "+data.player.turn;
            logTurn(curName,data.player.turn);
            if (drawID !== "") {
                LogPlayerDraw(data);
            }
            statusInitialize();
            lock = false; // unlock the cards
            $gameStatus.addClass('primary');
            $gameStatus.text('輪到你出牌');
            timerSetup(28);
        } else if (data.now === "enemy") {
            turn.innerHTML = eneName+" Turn "+data.enemy.turn;
            logTurn(eneName,data.enemy.turn);
            statusInitialize();
            $gameStatus.text('等待對手出牌');
        }
        if (poisonDamage !== "") {
            LogPlayerPoisonDamaged();
        }
        playerUpdate(data['player']);
        enemyUpdate(data['enemy']);
        setModalState(false);
    }
}

function statusInitialize() {
    $gameStatus.removeClass('info negative warninfo negative warning pulsing primary inverted'); // initailize the status
    timerInitialize();
}

// player status updater
function setPlayerName(name) {
    let $selfNameHeader = $('#myself > .profile > .name > .header');
    $selfNameHeader.html(name);
}

function setEnemyName(name) {
    let $eneNameHeader = $('#enemy > .profile > .name > .header');
    $eneNameHeader.html(name);
}

function playerUpdate(data) {
    handCards = data['hand'];
    setCard(data['hand']);
    let $selfHand = $('#selfHand'); // 手牌數
    let $selfDeck = $('#selfDeck');
    let $selfLifeBar = $('#myself > .profile > .life.progress > .bar');
    let $selfLifeText = $selfLifeBar.children();
    let $selfStatus = $('#myself > .profile > .status');
    let barWidth = (parseInt(data['life'])/20)*100 // %
    $selfHand.html(data['hand'].length);
    $selfDeck.html(data['deck_left']);
    $selfLifeBar.css('width',barWidth+'%');
    $selfLifeBar.attr('data-life',data['life']);
    $selfLifeText.html(data['life']);
    if (parseInt(data['poison']) > 0){
        $selfStatus.html('<p class="poison"><i class="theme icon"></i> 中毒 lv.'+data['poison']+'</p>');
        $selfLifeBar.addClass('poison');
    } else if (parseInt(data['poison']) == 0) {
        $selfLifeBar.toggleClass('poison', false);
        $selfStatus.html('清新');
    }

    if (parseInt(data['life']) <= 0) { // dead
        $selfLifeBar.toggleClass('poison', false);
        selfLifeBar.addClass('negative');
    }
}

function enemyUpdate(data) {
    let $eneHand = $('#eneHand'); // 手牌數
    let $eneDeck = $('#eneDeck');
    let $eneLifeBar = $('#enemy > .profile > .life.progress > .bar');
    let $eneLifeText = $eneLifeBar.children();
    let $eneStatus = $('#enemy > .profile > .status');
    let barWidth = (parseInt(data['life'])/20)*100 // %
    $eneHand.html(data['hand']);
    $eneDeck.html(data['deck_left']);
    $eneLifeBar.css('width',barWidth+'%');
    $eneLifeBar.attr('data-life',data['life']);
    $eneLifeText.html(data['life']);
    if (parseInt(data['poison']) > 0){
        $eneStatus.html('<p class="poison"><i class="theme icon"></i> 中毒 lv.'+data['poison']+'</p>');
        $eneLifeBar.toggleClass('poison', true);
    } else if (parseInt(data['poison']) == 0) {
        $eneLifeBar.toggleClass('poison', false)
        $eneStatus.html('清新');
    }

    if (parseInt(data['life']) <= 0) { // dead
        $eneLifeBar.toggleClass('poison', false);
        $eneLifeBar.addClass('negative');
    }
    
}

// card
function useCard(id) {
    if (!lock) {
        statusInitialize();
        send(id);
        lock = true;
    }
}

function setCard(cardsArray) {
    $(cardContainer).empty();
    let node = "";
    cardsArray.forEach((id) => {
        let tmp = cardTemplate;
        tmp = tmp.replace(/{{ id }}/g,id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        node += tmp;
    });
    $(cardContainer).append(node);
    setCardListener();
    resize(); // special case
}

// modals
function chooseRob(data) {
    let list = `<div class="ts selection segmented list">`;
    data.forEach((id) => {
        let tmp = listCardTemplate;
        tmp = tmp.replace('disabled','').replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    setModalContent('請問要搶哪張?', list, '');
    setModalCardListListener();
    setModalState(true);
}

function chooseTrade(data,tradeID=null) {
    if (data.length == 0) {
        send(0);
        return;
    }
    if (tradeID) {
        var text = "<p>對手選擇了"+cards[tradeID]+"</p>";
    } else {
        var text = "<p>選擇一張卡與對手交換</p>";
    }
    let list = `<div class="ts selection segmented list">`;
    data.forEach((id) => {
        let tmp = listCardTemplate;
        tmp = tmp.replace('disabled','').replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    setModalContent('交易', text+list, '');
    setModalCardListListener();
    setModalState(true);
    tradeChoose = ""; // reset value
}

function choosePlan(data) {
    let text = `<p>請從三張卡中選擇一張加入手牌</p>`;
    let list = `<div class="ts selection segmented list">`;
    data.forEach((id) => {
        let tmp = listCardTemplate;
        tmp = tmp.replace('disabled','').replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]); // not need to be disabled
        list+=tmp;
    });
    list+='</div>';
    setModalContent('妙策', text+list, '');
    setModalCardListListener();
    setModalState(true);
}

function askGuard(data) {
    let attackType = data['type'];
    let attackName = {"attack": "攻擊","surprise": "奇襲","sweep": "掃射"};
    let damage = data['damage'];
    let text = `對手使用了 `+attackName[attackType]+`，傷害為 `+damage;
    let list = `<div class="ts selection segmented list">`;
    handCards.forEach((id) => {
        let tmp = listCardTemplate;
        tmp = tmp.replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    setModalContent('防禦', text+list, '<button id="modalSkipBtn" class="ts primary button">不使用卡片</button>');
    setModalCardListListener();
    setModalSkipButtonListener();
    $('#modal .ts.list .item').each((i,e) => {
        if (e.dataset.id == "2" || e.dataset.id == "8" || e.dataset.id == "14") {
            $(e).removeClass('disabled');
        }
    });
    setModalState(true);
}

function askDefendRob() {
    let list = `<div class="ts selection segmented list">`;
    handCards.forEach((id) => {
        let tmp = listCardTemplate;
        tmp = tmp.replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    setModalContent('防禦強奪', list, '<button id="modalSkipBtn" class="ts primary button">不使用卡片</button>')
    setModalCardListListener();
    setModalSkipButtonListener();
    $('#modal .ts.list .item').each((i,e) => {
        if (e.dataset.id == "8") {
            $(e).removeClass('disabled');
        }
    });
    setModalState(true);
}

function playerWin() {
    setModalContent(
        '你贏了！',
        `<img src="./won.png"><p class="result enemy name">${eneName}</p><p class="result player name">${curName}</p>`,
        '<button id="close" class="ts button">關閉視窗</button><button id="restart" class="ts primary button">重啟對戰</button><button id="returnIndex" class="ts positive button">返回主畫面</button>'
    );
    timerInitialize(); // also remember to stop the timer
    setModalState(true);
    resultListener();
}

function playerLose() {
    setModalContent(
        '你輸爆了，SAD',
        `<img src="./lose.png"><p class="result enemy name">${eneName}</p><p class="result player name">${curName}</p>`,
        '<button id="close" class="ts button">關閉視窗</button><button id="restart" class="ts primary button">重啟對戰</button><button id="returnIndex" class="ts positive button">返回主畫面</button>'
    );
    timerInitialize(); // also remember to stop the timer
    setModalState(true);
    resultListener();
}

function setModalState(state) {
    if (dialogDisplay != state) {
        let mode = state ? 'show' : 'hide';
        ts('#modal').modal(mode);
        dialogDisplay = state;
    }
}

// countdown timer for each turn
function timing() {
    if (time == 0) {
        clearInterval(timer); // unset the timer
        $gameStatus.removeClass('warning pulsing');
        $gameStatus.addClass('negative');
        $gameStatus.text('時間到!');
        return null;
    }
    if (time <= 10) {
        $gameStatus.toggleClass('pulsing', true); // pulsing animation
        $gameStatus.text('輪到你出牌 '+time);
        if (time <= 5) {
            $gameStatus.toggleClass('info', false);
            $gameStatus.toggleClass('warning', true);
        }
    } else {
        $gameStatus.removeClass('negative pulsing');
        $gameStatus.addClass('info');
        $gameStatus.text('輪到你出牌');
    }
    time--;
}

function timerSetup(t) {
    time = t;
    timer = setInterval(timing,1000);
}

function timerInitialize() {
    clearInterval(timer);
    $gameStatus.addClass('inverted');
    $gameStatus.html('等待中');
}

// resize
function resize() {
    requestAnimationFrame(function () {
        let h = cardContainer.offsetHeight;
        let height = `calc(100vh - ${h}px)`;
        document.querySelectorAll('.grid, .column').forEach((e, _i) => {
            e.style.height = height;
        });
    });
}

resize();
window.addEventListener("resize", resize);

// game initailize
$(document).ready(() => {
    let roomID = localStorage.getItem('room');
    let characterID = localStorage.getItem('character');
    if(!roomID || !characterID){
        roomID = "n";
        characterID = Math.floor(Math.random()*10 + 1).toString(); // randomly choose a player
    }
    curName = characters[characterID];
    setPlayerName(characters[characterID]);
    init();
    var retry = setInterval(() => {
        if(socketReady) { // send the charactor id and room id until the connected 
            send(characterID);
            send(roomID);
            clearInterval(retry);
        }
    }, 300); // try every 0.3s
});

/* https://stackoverflow.com/questions/11700927/horizontal-scrolling-with-mouse-wheel-in-a-div */
function scrollHorizontally(e) {
    e = window.event || e;
    let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    cardContainer.scrollLeft -= (delta*40); // Multiplied by 40
    e.preventDefault();
}
cardContainer.addEventListener("mousewheel", scrollHorizontally, false);
cardContainer.addEventListener("DOMMouseScroll", scrollHorizontally, false); // Firefox