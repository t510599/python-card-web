// value setter
var roomID = null,
    characterID = null;

function setter() {
    if(characterID && roomID){
        localStorage.setItem('character',characterID);
        localStorage.setItem('room',roomID);
    }
}
// listener
var btn = document.querySelector('.ts.primary.button');
btn.addEventListener('click',() => {
    btn.classList.remove('fadeInDown');
    btn.style.animationDelay = "0s";
    btn.classList.add('fadeOutUp');
    setTimeout(() => {displayCharacter();},800)
});

var characterMenu = document.querySelector('.ts.centered.menu');
var characters = Array.from(characterMenu.children);
characterMenu.addEventListener('click', (e) => {
    var id = e.target.dataset.id;
    console.log("charactor:"+id);
    if(id) {
        characters.forEach(e => {
            e.classList.remove('active');
        });
        characterID = id;
        e.target.classList.add('active');
    }
});

var nextBtn = document.querySelector('#next');
nextBtn.addEventListener('click',() => { displayRoom() });

var firstStep = document.querySelector('#firstStep');
firstStep.addEventListener('click',() => { displayCharacter() });

var roomNum = document.querySelector('#roomNum');
var roomBtn = document.querySelector('#roomBtn');
roomBtn.addEventListener('click',() => {
    if(roomNum.value != null && 0 <= parseInt(roomNum.value) && 99999 >= parseInt(roomNum.value)){
        console.log('room:'+roomNum.value)
        roomID = roomNum.value;
        setter();
        location.href = './cards.html';
    } else {
        console.log("room number error");
    }
});

var randomBtn = document.querySelector('#random');
randomBtn.addEventListener('click',() => {
    roomID = "n"
    setter();
    location.href = './cards.html';
});

// animation
var steps = document.querySelector('.ts.steps');
var step = document.querySelectorAll('.ts.steps .step');
var container = document.querySelector('.ts.fluid.container');
var title = document.querySelector('h1');
var characterDialog = document.querySelector('#character');
var roomDialog = document.querySelector('#room');

function displayCharacter() {
    btn.style.display = "none";
    steps.style.display = "flex";
    container.classList.remove('title');
    container.classList.remove('fluid');
    container.classList.add('dialog');
    characterDialog.style.display = "block";
    roomDialog.style.display = "none";
    characterDialog.classList.add('animated');
    characterDialog.classList.add('fadeIn');
    title.style.marginTop = "1em";
    step[0].classList.add('active');
    step[0].classList.remove('completed');
    step[1].classList.remove('active');
}

function displayRoom() {
    step[0].classList.remove('active');
    step[0].classList.add('completed');
    step[1].classList.add('active');
    characterDialog.style.display = "none";
    roomDialog.style.display = "block";
    roomDialog.classList.add('animated');
    roomDialog.classList.add('fadeIn');
}