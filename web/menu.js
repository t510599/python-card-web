// short name
function $(selector) {
    return (document.querySelectorAll(selector).length > 1) ? document.querySelectorAll(selector) : document.querySelector(selector);
}

// value setter
var data = {
    _roomID : null,
    _characterID : null,
    get roomID() {
        return this._roomID;
    },
    set roomID(id) {
        this._roomID = id;
        if (this._roomID && this._characterID) {
            localStorage.setItem('character', this._characterID);
            localStorage.setItem('room', this._roomID);
        }
    },
    get characterID() {
        return this._characterID;
    },
    set characterID(id) {
        this._characterID = id;
    }
}

// listener
var enterBtn = $('.ts.primary.button:not(#random)'); // enter game
enterBtn.addEventListener('click', () => {
    enterBtn.classList.remove('fadeInDown');
    enterBtn.style.animationDelay = "0s";
    enterBtn.classList.add('fadeOutUp');
    setTimeout(() => { displayCharacter(); }, 800)
});

var characterMenu = $('.ts.centered.menu'),
    characters = Array.from(characterMenu.children),
    nextBtn = $('#next'),
    firstStep = $('#firstStep');

characterMenu.addEventListener('click', (e) => {
    let id = e.target.dataset.id;
    nextBtn.classList.remove('disabled');
    if (id) {
        characters.forEach(e => {
            e.classList.remove('active');
        });
        data.characterID = id;
        e.target.classList.add('active');
    }
});

nextBtn.addEventListener('click', () => {
    if (data.characterID) {
        displayRoom();
    }
});

firstStep.addEventListener('click', () => { displayCharacter() });

var roomNum = $('#roomNum'),
    roomBtn = $('#roomBtn');
roomBtn.addEventListener('click',() => {
    let regex = new RegExp('^[0-9]{1,5}$');
    if (roomNum.value != null && regex.test(roomNum.value)) {
        data.roomID = roomNum.value;
        location.href = './cards.html';
    } else {
        ts('.snackbar').snackbar({
            content: '請輸入正確的房號!',
        });
        console.log("room number error");
    }
});

roomNum.addEventListener('keypress', (e) => {
    if (e.keyCode == '13') {
        roomBtn.click();
    }
})

var randomBtn = $('#random');
randomBtn.addEventListener('click', () => {
    data.roomID = "n";
    location.href = './cards.html';
});

// animation
var steps = $('.ts.steps'),
    container = $('.ts.fluid.container'),
    title = $('h1'),
    characterDialog = $('#character'),
    roomDialog = $('#room');

function displayCharacter() {
    enterBtn.style.display = "none";
    steps.style.display = "flex";
    container.classList.remove('title', 'fluid');
    container.classList.add('dialog');
    characterDialog.style.display = "block";
    roomDialog.style.display = "none";
    characterDialog.classList.add('animated', 'fadeIn');
    title.style.marginTop = "1em";
    steps.children[0].classList.add('active');
    steps.children[0].classList.remove('completed');
    steps.children[1].classList.remove('active');
}

function displayRoom() {
    steps.children[0].classList.remove('active');
    steps.children[0].classList.add('completed');
    steps.children[1].classList.add('active');
    characterDialog.style.display = "none";
    roomDialog.style.display = "block";
    roomDialog.classList.add('animated', 'fadeIn');
}