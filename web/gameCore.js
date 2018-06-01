/*  System Variable */
var time,timer;
var MouseOn = false;
var now = null; // to store whose turn is this. value: "player" or "enemy"
var socketReady = false;
var lock = true;
var debugMode = false;
var dialogDisplay = false;
var curName = "";
var eneName = "";
var drawID = "";
var poisonDamage = "";
var tradeChoose = "";
var handCards = [];

/* DOM Objects */
var cardContainer = $('.cards.container')[0];
var dialog = $('#modal');
var grid = $('#grid')[0];
var column = $('.column');
var log = $('#log')[0];
var gameStatus = $('#status');
var turn = $('#turn')[0];
var roomNum = $('.statistic > .value')[0];

var enemy = $('#enemy');
var myself = $('#myself');

/* text */
// cards
var cards = {'1': '攻擊', '2': '防禦', '3': '治癒', '4': '補給', '5': '強奪', '6': '奇襲', '7': '交易', '8': '洞悉', '9': '妙策', '10': '掃射', '11': '加護', '12': '劇毒', '13': '詛咒', '14': '反制', '15': '狂亂', '16': '逆轉'};
var cardsDescription = {"1":"對敵方造成兩點傷害","2":"回復一點生命<br>被動:抵擋攻擊類卡片","3":"回復兩點生命","4":"抽取兩張手牌","5":"從敵方手牌中選擇一張加入自己的手牌","6":"對敵方造成兩點傷害，並使其隨機損失一張手牌","7":"選取一張手牌與敵方交換","8":"抽取三張手牌<br>被動:抵擋攻擊類卡片，並抽取一張手牌、抵擋強奪的效果","9":"從牌庫中隨機挑出三張卡片，選擇一張加入手牌","10":"對敵方造成零～五點傷害","11":"回復三點生命，並解除中毒","12":"使敵方中毒：每個回合，玩家會損失一點生命","13":"使其損失四點生命，並隨機損失一張手牌","14":"使敵方生命減半<br>被動:抵擋攻擊類卡片，並反彈其傷害和效果","15":"回復三點生命，並對敵方造成三點傷害","16":"使自己與敵方的生命交換"}

var characters = {'1': '安', '2': '圭月', '3': '梅', '4': '小兔', '5': '銀', '6': '正作', '7': 'W', '8': '桑德', '9': '海爾', '10': '雪村'};

// templates
var cardTemplate = `<a class="ts card" data-id="{{ id }}"><div class="content"><div class="header">{{ name }}</div><div class="meta">{{ id }}</div><div class="description">{{ description }}</div></div></a>`;
var listCardTemplate = `<div class="disabled item" data-id="{{ id }}"><div class="ts header">{{ name }}<div class="sub header">{{ description }}</div></div></div>`;
var logTemplate = `<div class="{{ isSelf }} speech"><div class="content">{{ content }}</div></div>`;
var logDivider = `<div class="ts horizontal divider">{{ player }} Turn {{ turn }}</div>`;

// messages
var messages = {
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
                robbedCard = dataJson.data[1]; // card ID
                LogPlayerChoose("robbed",robbedCard);
                break;
            case "tradeChoose":
                tradeChoose = dataJson.data[1]; // card ID
                LogPlayerChoose("tradeChoose",tradeChoose);
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
    gameStatus.html('連線已中斷');
    gameStatus.addClass('warning');
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
    $('.cards.container a.ts.card').each((i,e) => {
        $(e).click(function() {
            useCard(this.dataset.id);
        });
    });
}

function unsetCardListener() {
    $('.cards.container a.ts.card').each((i,e) => {
        $(e).off("click");
    });
}

function setModalCardListListener() {
    $('#modal .ts.list .item').each((i,e) => {
        $(e).click(function() {
            useCard(this.dataset.id);
            modalClose();
        });
    });
}

function setModalSkipButtonListener() {
    $('#modal #modalSkipBtn').click(function() {
        send(0);
        modalClose();
    });
}

$('#skip').click(function() {
    if (!$(this).hasClass('disabled')) {
        send(0);
    }
});

$('#giveup').click(function() {
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
        modalClose();
    });
}

// log
log.addEventListener("mouseover", function() { MouseOn = true; }); // if mouse is over the div, don't scroll to bottom
log.addEventListener("mouseleave", function() { MouseOn = false; });

function Log(msgJson) {
    var node = logTemplate;
    if(now === "player") { // to distinguish if this is self log or enemy log
        node = node.replace("{{ isSelf }}","right");
    } else if (now === "enemy") {
        node = node.replace("{{ isSelf }}","");
    }

    node = node.replace("{{ content }}",messages[msgJson['msg']].format(msgJson['data']));
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
}

function LogPlayerDraw() {
    var node = logTemplate.replace("{{ isSelf }}","right");
    node = node.replace("{{ content }}",messages['draw'].format([curName,cards[drawID]])); // msgJson['data'][0] player name, msgJson['data'][1] card id
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
    drawID = "";
}

function LogPlayerChoose(type,dataID) {
    var node = logTemplate.replace("{{ isSelf }}","right");
    var tmpName = "";
    if(now === "player") { // to distinguish if this is self log or enemy log
        node = node.replace("{{ isSelf }}","right");
        tmpName = curName;
    } else if (now === "enemy") {
        node = node.replace("{{ isSelf }}","");
        tmpName = eneName;
    }
    node = node.replace("{{ content }}",messages[type].format([tmpName,cards[dataID]])); // msgJson['data'][0] player name, msgJson['data'][1] card id
    log.insertAdjacentHTML("beforeend",node); // insert to log
    if (!MouseOn) { // if mouse isn't over the div, scroll to bottom
        log.scrollTop = log.scrollHeight; // scroll to bottom
    }
}

function LogPlayerPoisonDamaged() {
    var node = logTemplate;
    var tmpName = "";
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
    var node = logDivider;
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
        roomNum.innerHTML = data.room.padStart(5,'0');
    } else if (data.now) {
        if (data.now === "player") {
            turn.innerHTML = curName+" Turn "+data.player.turn;
            logTurn(curName,data.player.turn);
            if (drawID !== "") {
                LogPlayerDraw(data);
            }
            statusInitialize();
            lock = false; // unlock the cards
            gameStatus.addClass('primary');
            gameStatus.html('輪到你出牌');
            timerSetup(28);
        } else if (data.now === "enemy") {
            turn.innerHTML = eneName+" Turn "+data.enemy.turn;
            logTurn(eneName,data.enemy.turn);
            statusInitialize();
            gameStatus.html('等待對手出牌');
        }
        if (poisonDamage !== "") {
            LogPlayerPoisonDamaged();
        }
        playerUpdate(data['player']);
        enemyUpdate(data['enemy']);
        modalClose();
    }
}

function statusInitialize() {
    gameStatus.removeClass('info negative warning pulsing primary inverted'); // initailize the status
    timerInitialize();
}

// player status updater
function setPlayerName(name) {
    var selfNameHeader = $('#myself > .profile > .name > .header');
    selfNameHeader.html(name);
}

function setEnemyName(name) {
    var eneNameHeader = $('#enemy > .profile > .name > .header');
    eneNameHeader.html(name);
}

function playerUpdate(data) {
    handCards = data['hand'];
    setCard(data['hand']);
    var selfHand = $('#selfHand'); // 手牌數
    var selfDeck = $('#selfDeck');
    var selfLifeBar = $('#myself > .profile > .life.progress > .bar');
    var selfLifeText = selfLifeBar.children();
    var selfStatus = $('#myself > .profile > .status');
    var barWidth = (parseInt(data['life'])/20)*100 // %
    selfHand.html(data['hand'].length);
    selfDeck.html(data['deck_left']);
    selfLifeBar.css('width',barWidth+'%');
    selfLifeBar.attr('data-life',data['life']);
    selfLifeText.html(data['life']);
    if (parseInt(data['poison']) > 0){
        selfStatus.html('<p class="poison"><i class="theme icon"></i> 中毒 lv.'+data['poison']+'</p>');
        selfLifeBar.addClass('poison');
    } else if (parseInt(data['poison']) == 0) {
        if (selfLifeBar.hasClass('poison')) {
            selfLifeBar.removeClass('poison');
        }
        selfStatus.html('清新');
    }

    if (parseInt(data['life']) <= 0) { // dead
        if (selfLifeBar.hasClass('poison')) {
            selfLifeBar.removeClass('poison');
        }
        selfLifeBar.addClass('negative');
    }
}

function enemyUpdate(data) {
    var eneHand = $('#eneHand'); // 手牌數
    var eneDeck = $('#eneDeck');
    var eneLifeBar = $('#enemy > .profile > .life.progress > .bar');
    var eneLifeText = eneLifeBar.children();
    var eneStatus = $('#enemy > .profile > .status');
    var barWidth = (parseInt(data['life'])/20)*100 // %
    eneHand.html(data['hand']);
    eneDeck.html(data['deck_left']);
    eneLifeBar.css('width',barWidth+'%');
    eneLifeBar.attr('data-life',data['life']);
    eneLifeText.html(data['life']);
    if (parseInt(data['poison']) > 0){
        eneStatus.html('<p class="poison"><i class="theme icon"></i> 中毒 lv.'+data['poison']+'</p>');
        eneLifeBar.addClass('poison');
    } else if (parseInt(data['poison']) == 0) {
        if (eneLifeBar.hasClass('poison')) {
            eneLifeBar.removeClass('poison');
        }
        eneStatus.html('清新');
    }

    if (parseInt(data['life']) <= 0) { // dead
        if (eneLifeBar.hasClass('poison')) {
            eneLifeBar.removeClass('poison');
        }
        eneLifeBar.addClass('negative');
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
    var node = "";
    cardsArray.forEach((id) => {
        var tmp = cardTemplate;
        tmp = tmp.replace(/{{ id }}/g,id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        node += tmp;
    });
    $(cardContainer).append(node);
    setCardListener();
    resize(); // special case
}

// modals
function chooseRob(data) {
    var list = `<div class="ts selection segmented list">`;
    data.forEach((id) => {
        var tmp = listCardTemplate;
        tmp = tmp.replace('disabled','').replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    dialog.children(".header").html('請問要搶哪張?');
    dialog.children(".content").html(list);
    dialog.children(".actions").html('');
    setModalCardListListener();
    modalOpen();
}

function chooseTrade(data,tradeID=null) {
    console.log(tradeChoose);
    if (tradeID) {
        var text = "<p>對手選擇了"+cards[tradeID]+"</p>";
    } else {
        var text = "<p>選擇一張卡與對手交換</p>";
    }
    var list = `<div class="ts selection segmented list">`;
    data.forEach((id) => {
        var tmp = listCardTemplate;
        tmp = tmp.replace('disabled','').replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    dialog.children(".header").html('交易')
    dialog.children(".content").html(text+list);
    dialog.children(".actions").html('');
    setModalCardListListener();
    modalOpen();
    tradeChoose = ""; // reset value
}

function choosePlan(data) {
    var text = `<p>請從三張卡中選擇一張加入手牌</p>`;
    var list = `<div class="ts selection segmented list">`;
    data.forEach((id) => {
        var tmp = listCardTemplate;
        tmp = tmp.replace('disabled','').replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]); // not need to be disabled
        list+=tmp;
    });
    list+='</div>';
    dialog.children(".header").html('妙策');
    dialog.children(".content").html(text+list);
    dialog.children(".actions").html('');
    setModalCardListListener();
    modalOpen();
}

function askGuard(data) {
    var attackType = data['type'];
    var attackName = {"attack": "攻擊","surprise": "奇襲","sweep": "掃射"};
    var damage = data['damage'];
    var text = `對手使用了 `+attackName[attackType]+`，傷害為 `+damage;
    var list = `<div class="ts selection segmented list">`;
    handCards.forEach((id) => {
        var tmp = listCardTemplate;
        tmp = tmp.replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    dialog.children(".header").html('防禦');
    dialog.children(".content").html(text+list);
    dialog.children(".actions").html('<button id="modalSkipBtn" class="ts primary button">不使用卡片</button>');
    setModalCardListListener();
    setModalSkipButtonListener();
    $('#modal .ts.list .item').each((i,e) => {
        if (e.dataset.id == "2" || e.dataset.id == "8" || e.dataset.id == "14") {
            $(e).removeClass('disabled');
        }
    });
    modalOpen();
}

function askDefendRob() {
    var list = `<div class="ts selection segmented list">`;
    handCards.forEach((id) => {
        var tmp = listCardTemplate;
        tmp = tmp.replace('{{ id }}',id).replace("{{ name }}",cards[id]).replace("{{ description }}",cardsDescription[id]);
        list+=tmp;
    });
    list+='</div>';
    dialog.children(".header").html('防禦強奪');
    dialog.children(".content").html(list);
    dialog.children(".actions").html('<button id="modalSkipBtn" class="ts primary button">不使用卡片</button>');
    setModalCardListListener();
    setModalSkipButtonListener();
    $('#modal .ts.list .item').each((i,e) => {
        if (e.dataset.id == "8") {
            $(e).removeClass('disabled');
        }
    });
    modalOpen();
}

function playerWin() {
    dialog.children(".header").html('你贏了！');
    dialog.children(".content").html('<img src="./won.png"><p class="result enemy name">'+eneName+'</p><p class="result player name">'+curName+'</p>');
    dialog.children(".actions").html('<button id="close" class="ts button">關閉視窗</button><button id="restart" class="ts primary button">重啟對戰</button><button id="returnIndex" class="ts positive button">返回主畫面</button>');
    timerInitialize(); // also remember to stop the timer
    modalOpen();
    resultListener();
}

function playerLose() {
    dialog.children(".header").html('你輸爆了，SAD');
    dialog.children(".content").html('<img src="./lose.png"><p class="result enemy name">'+eneName+'</p><p class="result player name">'+curName+'</p>');
    dialog.children(".actions").html('<button id="close" class="ts button">關閉視窗</button><button id="restart" class="ts primary button">重啟對戰</button><button id="returnIndex" class="ts positive button">返回主畫面</button>');
    timerInitialize(); // also remember to stop the timer
    modalOpen();
    resultListener();
}

function modalClose() {
    if (dialogDisplay) {
        ts('#modal').modal('hide');
        console.log('close');
        dialogDisplay = false;
    }
}

function modalOpen() {
    if (!dialogDisplay) {
        ts('#modal').modal('show');
        console.log('open');
        dialogDisplay = true;
    }
}

// countdown timer for each turn
function timing() {
    if (time == 0) {
        clearInterval(timer); // unset the timer
        gameStatus.removeClass('warning pulsing');
        gameStatus.addClass('negative');
        gameStatus.text('時間到!');
        return null;
    }
    if (time <= 5) {
        if(!gameStatus.hasClass('pulsing')) {
            gameStatus.addClass('pulsing'); // pulsing animation
        }
        gameStatus.removeClass('info');
        gameStatus.addClass('warning');
        gameStatus.text('輪到你出牌 '+time);
    } else if (time <= 10) {
        if(!gameStatus.hasClass('pulsing')) {
            gameStatus.addClass('pulsing'); // pulsing animation
        }
        gameStatus.text('輪到你出牌 '+time);
    } else {
        gameStatus.removeClass('negative pulsing');
        gameStatus.addClass('info');
        gameStatus.text('輪到你出牌');
    }
    time--;
}

function timerSetup(t) {
    time = t;
    timer = setInterval(timing,1000);
}

function timerInitialize() {
    clearInterval(timer);
    gameStatus.addClass('inverted');
    gameStatus.html('等待中');
}

// resize
function resize() {
    var h = cardContainer.offsetHeight;
    grid.style.height='calc(100vh - ' + h + 'px)';
    column.css('height','calc(100vh - ' + h + 'px)');
}

resize();
window.addEventListener("resize",resize);

// game initailize
$(document).ready(() => {
    var roomID = localStorage.getItem('room');
    var characterID = localStorage.getItem('character');
    if(!roomID || !characterID){
        roomID = "n";
        characterID = "1"; // default charactor
    }
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
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    cardContainer.scrollLeft -= (delta*40); // Multiplied by 40
    e.preventDefault();
}
cardContainer.addEventListener("mousewheel", scrollHorizontally, false);
cardContainer.addEventListener("DOMMouseScroll", scrollHorizontally, false); //Firefox