import random
import card
from room import sendTo
from json import dumps

class Player:
    def __init__(self,name,deck):
        self.name = name
        self.deck = deck[:] # to pass by value instead of by reference
        self.hand = []
        self.display = [] # names of cards in hand
        self.life = 20
        self.poison = 0
        self.damage = 0 # 因為反制要拿來判斷掃射
        self.playing = False
        self.attacking = False
        self.robbing = False
        self.surprise = False # 又是因為反制要判斷奇襲
        self.turn = 0

    def poison_check(self):
        if self.poison != 0:
            self.life -= self.poison
            return True
        else:
            return False

    def add_card(self,id):
        self.hand.append(id)
        self.display.append(card.cards[id])
        self.deck.remove(id)

    def remove_card(self,id):
        self.hand.remove(id)
        self.display.remove(card.cards[id])
        self.deck.append(id)

    def robbed(self,id): # be robbed
        self.hand.remove(id)
        self.display.remove(card.cards[id])
    
    def defence(self): # to decide if player is able to defend or not
        for c in self.hand:
            if c in card.unattackable:
                return True
        return False

    def keep(self): # to decide if player is able to be robbed or not
        for c in self.hand:
            if c in card.unrobable:
                return True
        return False
    def surrender(self):
        self.life = 0

# game functions


def health(p1,p2):
    return "{} 的生命: {}\n{} 的生命: {}".format(p1.name,p1.life, p2.name, p2.life)

def display(player):
    return "這是 {} 的手牌\n{}".format(player.name, player.display)

def draw(player): # 抽卡
    if len(player.deck) == 0:
        player.life = -99999999 # 牌抽乾了就讓他死
        return dumps({"msg": "noCard", "data": [player.name]})
    new = random.choice(player.deck) 
    player.add_card(new)
    
    return dumps({"msg": "draw", "data": [player.name, new]})
# turn control
# cur:current player
# ene:enemy
async def turn(wsp1,wsp2):
    p1, p2 = wsp1.player, wsp2.player
    wscur, wsene = (wsp1, wsp2) if p1.playing == True else (wsp2, wsp1)

    cur, ene = wscur.player, wsene.player
    
    cur.turn += 1
    
    await wscur.send("{} 的第{}回合".format(cur.name,cur.turn))
    if cur.poison_check():
        await wscur.send("{} 受到了劇毒的侵蝕".format(cur.name))
        await wscur.send("{} 損失{}點生命".format(cur.name,cur.poison))
    if cur.life <= 0:
        return
    await sendTo(health(p1,p2), wsp1, wsp2)
    await sendTo(draw(cur), wsp1, wsp2) # 抽卡
    await sendTo(display(cur), wscur) # 顯示手牌
    while True:
        await sendTo("請問要使用手牌嗎? 若不使用請輸入0", wscur)
        print("Wait receive")
        choice = await wscur.recv()
        print("Received")
        if choice in cur.hand:
            card.skills[choice](wscur, wsene)
            cur.remove_card(choice)
            break
        elif choice == "0":
            break
        elif choice == "-1":
            cur.surrender()
            await sendTo("{}投降".format(cur.name), wsp1, wsp2)
            break
        del choice # prevent reading old data
    p1.playing,p2.playing = p2.playing,p1.playing # switch!
