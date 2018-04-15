import random
import game

cards = dict()
card_name = ["1.攻擊","2.防禦","3.治癒","4.補給","5.強奪","6.奇襲","7.交易","8.洞悉","9.妙策","10.掃射","11.加護","12.劇毒","13.詛咒","14.反制","15.狂亂","16.逆轉"]
unattackable = ['2','8','14','17','18']
unrobable = ['8','17','18']
for i in range(len(card_name)):
    cards[str(i+1)] = card_name[i] # initialize cards
# create default deck
# 攻擊*15 防禦*15 治癒*15 補給*10 強奪*10 奇襲*10 交易*10 洞悉*5 妙策*5 掃射*5 加護*5 劇毒*2 詛咒*2 反制*2 狂亂*2 逆轉*2
default_deck = ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '1', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '2', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '3', '4', '4', '4', '4', '4', '4', '4', '4', '4', '4', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '6', '6', '6', '6', '6', '6', '6', '6', '6', '6', '7', '7', '7', '7', '7', '7', '7', '7', '7', '7', '8', '8', '8', '8', '8', '9', '9', '9', '9', '9', '10', '10', '10', '10', '10', '11', '11', '11', '11', '11', '12', '12', '13', '13', '14', '14', '15', '15', '16', '16']
random.shuffle(default_deck) # wash

# card functions
# cur:current player
# ene:enemy
def attack(cur,ene):
    cur.attacking = True
    cur.damage = 2 # 給反制判斷的
    print("{} 攻擊 {}".format(cur.name,ene.name))
    if ene.defence():
        game.display(ene) # 顯示手牌
        while True:
            choice = input("請問要防禦嗎? 不使用請輸入0 ")
            if choice in ene.hand:
                if choice in unattackable:
                    skills[choice](cur,ene)
                    ene.remove_card(choice)
                    break
            elif choice == "0":
                print("{} 受到{}點傷害".format(ene.name,cur.damage))
                ene.life -= cur.damage
                break
    else:
        print("{} 受到{}點傷害".format(ene.name,cur.damage))
        ene.life -= cur.damage
    cur.attacking = False
    cur.damage = 0 # reset

def defend(cur,ene):
    if cur.attacking or cur.surprise:
        print("{} 防禦成功".format(ene.name))
    else:
        print("{} 沒什麼可以防禦的，回復一點生命".format(cur.name))
        cur.life += 1

def heal(cur,ene):
    print("{} 回復兩點生命".format(cur.name))
    cur.life += 2

def supply(cur,ene):
    print("{} 增加兩張手牌".format(cur.name))
    for _ in range(2):
        game.draw(cur)

def rob(cur,ene):
    cur.robbing = True
    print("{} 正在對 {} 行搶".format(cur.name,ene.name))
    if ene.keep():
        game.display(ene) # 顯示手牌
        while True:
            choice = input("請問要防禦嗎? 不使用請輸入0 ")
            if choice in ene.hand:
                if choice in unrobable:
                    skills[choice](cur,ene)
                    ene.remove_card(choice)
                    break
            elif choice == "0":
                break
    else:
        if len(ene.hand) == 0:
            print("可惜，{} 有夠窮，沒東西能搶".format(ene.name))
        else:
            game.display(ene)
            while True:
                swag = input("{} 要搶哪張? ".format(cur.name))
                if swag in ene.hand:
                    ene.robbed(swag)
                    cur.add_card(swag)
                    break
    cur.robbing = False

def surprise(cur,ene):
    cur.surprise = True
    cur.damage = 1 # 給反制判斷
    print("{} 發動奇襲".format(cur.name))
    if ene.defence():
        game.display(ene) # 顯示手牌
        while True:
            choice = input("請問要防禦嗎? 不使用請輸入0 ")
            if choice in ene.hand:
                if choice in unattackable:
                    skills[choice](cur,ene)
                    ene.remove_card(choice)
                    break
            elif choice == "0":
                print("{} 受到{}點傷害，而且掉了一張手牌".format(ene.name,cur.damage))
                ene.life -= cur.damage
                drop = random.choice(ene.hand)
                ene.remove_card(drop)
                break
    else:
        print("{} 受到{}點傷害，而且掉了一張手牌".format(ene.name,cur.damage))
        ene.life -= cur.damage
        drop = random.choice(ene.hand)
        ene.remove_card(drop)
    cur.surprise = False
    cur.damage = 0 # reset

def trade(cur,ene):
    print("{} 想與 {} 進行交易".format(cur.name,ene.name))
    cur.remove_card("7") # you can't trade the using card "trade"
    game.display(cur) # 顯示手牌
    while True:
        choice = input("選擇一張手牌以交換 ")
        if choice in cur.hand:
            cur_item = choice
            print("{} 選擇了 {}".format(cur.name,cards[choice]))
            break
    game.display(ene) # 顯示手牌
    while True:
        choice = input("選擇一張手牌以交換 ")
        if choice in ene.hand:
            ene_item = choice
            print(ene.name,"choose",cards[choice])
            break
    # current player part
    cur.hand.remove(cur_item)
    cur.display.remove(cards[cur_item])
    cur.hand.append(ene_item)
    cur.display.append(cards[ene_item])
    # enemy part
    ene.hand.remove(ene_item)
    ene.display.remove(cards[ene_item])
    ene.hand.append(cur_item)
    ene.display.append(cards[cur_item])

    cur.add_card("7") # add back the card. game system will remove this card right away

def aware(cur,ene):
    if cur.attacking:
        print("{} 洞悉了 {} 的攻擊，並抽取了一張手牌".format(ene.name,cur.name))
        game.draw(ene)
    elif cur.robbing:
        print("{} 洞悉了 {} 的強奪，並抽取了一張手牌".format(ene.name,cur.name))
        game.draw(ene)
    elif cur.surprise:
        print("{} 洞悉了 {} 的奇襲，並抽取了一張手牌".format(ene.name,cur.name))
        game.draw(ene)
    else:
        for _ in range(3):
            print("{} 增加三張手牌".format(cur.name))
            game.draw(cur)

def plan(cur,ene):
    print("{} 有個妙策".format(cur.name))
    options = random.sample(cur.deck,3)
    o_name = [] # names of cards in options
    for id in options:
        o_name.append(cards[id])
    print(o_name)
    while True:
        choice = input("選擇一張卡加入手牌 ")
        if choice in options:
            cur.add_card(choice)
            break

def sweep(cur,ene):
    cur.attacking = True
    cur.damage = random.randint(0,5)
    print("{} 對 {} 進行掃射，威力是 {}".format(cur.name,ene.name,cur.damage))
    if ene.defence():
        game.display(ene) # 顯示手牌
        while True:
            choice = input("請問要防禦嗎? 不使用請輸入0 ")
            if choice in ene.hand:
                if choice in unattackable:
                    skills[choice](cur,ene)
                    ene.remove_card(choice)
                    break
            elif choice == "0":
                print("{} 受到{}點傷害".format(ene.name,cur.damage))
                ene.life -= cur.damage
                break
    else:
        print("{} 受到{}點傷害".format(ene.name,cur.damage))
        ene.life -= cur.damage
    cur.attacking = False
    cur.damage = 0 # reset

def bless(cur,ene):
    print("{} 獲得加護，身上的毒素一掃而空，並回復三點生命，還抽取了兩張手牌".format(cur.name))
    cur.poison = 0 # 解毒
    cur.life += 3
    for _ in range(2):
        game.draw(cur)

def poison(cur,ene):
    if ene.poison != 0:
        s = "又"
    else:
        s = ""
    print("{} 在食物下毒，{} {}中毒了".format(cur.name,ene.name, s))
    ene.poison += 1

def curse(cur,ene):
    print("{} 詛咒了 {}，使其損失四點生命，並掉了一張手牌".format(cur.name,ene.name))
    ene.life -= 4
    drop = random.choice(ene.hand)
    ene.remove_card(drop)

def counter(cur,ene):
    if cur.attacking:
        print("{} 反制了 {} 的攻擊，反彈了{}點傷害".format(ene.name,cur.name,cur.damage))
        cur.life -= cur.damage
    elif cur.surprise:
        print("{} 反制了 {} 的奇襲，反彈了{}點傷害，並使其掉了一張手牌".format(ene.name,cur.name,cur.damage))
        cur -= cur.damage
        drop = random.choice(cur.hand)
        cur.remove_card(drop)
    else:
        print("{} 反制了敵手，使 {} 生命值減半了!".format(cur.name,ene.name))
        ene.life = ene.life//2

def chaos(cur,ene):
    print("{} 進入狂亂模式，回復三點生命，並對 {} 造成三點傷害".format(cur.name,ene.name))
    cur.life += 3
    ene.life -= 3

def reverse(cur,ene):
    print("{} 一口氣逆轉了情勢".format(cur.name))
    cur.life,ene.life = ene.life,cur.life

skills = dict()
skill_name = [attack,defend,heal,supply,rob,surprise,trade,aware,plan,sweep,bless,poison,curse,counter,chaos,reverse]
for i in range(len(skill_name)):
	skills[str(i+1)] = skill_name[i]
