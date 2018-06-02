import random
import card
from room import sendTo
from json import dumps

class Player:
    def __init__(self,name,deck):
        self.name = name
        self.deck = deck[:] # to pass by value instead of by reference
        self.hand = []
        self.status = -1
        self.life = 15
        self.poison = 0
        self.damage = 0 # 因為反制要拿來判斷掃射
        self.playing = False
        self.attacking = False
        self.robbing = "0"
        self.planning = [] # data temp for plan
        self.trading = "0" # data temp for trade
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
        self.deck.remove(id)

    def remove_card(self,id):
        self.hand.remove(id)
    
    def rob(self, id):
        self.hand.append(id)

    def robbed(self,id): # be robbed
        try:
            self.hand.remove(id)
        except:
            print("rob except:", id, self.hand)
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


def draw(player): # 抽卡
    if len(player.deck) == 0:
        player.life = -99999999 # 牌抽乾了就讓他死
        return False
    new = random.choice(player.deck) 
    player.add_card(new)
    
    return dumps({"msg": "draw", "data": [player.name, new]})
# turn control
# cur:current player
# ene:enemy
