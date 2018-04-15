import random
import card

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
    print("{} 的生命: {}".format(p1.name,p1.life))
    print("{} 的生命: {}".format(p2.name,p2.life))

def display(player):
    print("這是 {} 的手牌".format(player.name))
    print(player.display)

def draw(player): # 抽卡
    if len(player.deck) == 0:
        player.life = -99999999 # 牌抽乾了就讓他死
        print("你抽到了死神")
        return None
    new = random.choice(player.deck)
    print("{} 抽到了 {}".format(player.name,card.cards[new]))
    player.add_card(new)
    print("牌組剩餘: {} 張".format(len(player.deck)))

# turn control
# cur:current player
# ene:enemy
def turn(p1,p2):
    if p1.playing == True:
        cur = p1
        ene = p2
    elif p2.playing == True:
        cur = p2
        ene = p1
    cur.turn += 1
    print("") # change line
    print("{} 的第{}回合".format(cur.name,cur.turn))
    if cur.poison_check():
        print("{} 受到了劇毒的侵蝕".format(cur.name))
        print("{} 損失{}點生命".format(cur.name,cur.poison))
    if cur.life <= 0:
        return
    health(p1,p2)
    draw(cur) # 抽卡
    display(cur) # 顯示手牌
    while True:
        choice = input("請問要使用手牌嗎? 若不使用請輸入0 ")
        if choice in cur.hand:
            card.skills[choice](cur,ene)
            cur.remove_card(choice)
            break
        elif choice == "0":
            break
        elif choice == "-1":
            cur.surrender()
            print("{}投降".format(cur.name))
            break
        del choice # prevent reading old data
    p1.playing,p2.playing = p2.playing,p1.playing # switch!
