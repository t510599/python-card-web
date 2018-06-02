import random
import game
from room import Room
from json import dumps

unattackable = ['2','8','14']
unrobable = ['8','17']

# create default deck
"""
攻擊*7 防禦*7 治癒*7
補給*4 強奪*4 奇襲*4 交易*4
洞悉*2 妙策*2 掃射*2 加護*2
劇毒*1 詛咒*1 反制*1 狂亂*1 逆轉*1
"""
default_deck = ['1', '2', '3'] * 7 + ['4', '5', '6', '7'] * 4 + ['8', '9', '10', '11'] * 2 + ['12', '13', '14', '15', '16']

random.shuffle(default_deck) # wash

# card functions
# cur:current player
# ene:enemy

def attack(wscur, wsene):
    cur, ene = wscur.player, wsene.player
    cur.attacking = True

    r = []
    
    cur.damage = 2 # 給反制判斷的
    r.append(( (wscur, wsene), dumps({"msg": "attack", "data": [cur.name, ene.name]})))
    if ene.defence():
        r.append(( (wsene, ),
            dumps({"action": "toDefend", "value": {"damage": cur.damage, "type": "attack"}})
        ))
        cur.status = Room.NOTHING
        ene.status = Room.DEFENCE
    else:
        r.append(( (wsene, wscur),
            dumps({"msg": "damaged", "data": [ene.name, cur.damage]})
        ))
        
        cur.status = Room.NOTHING
        ene.life -= cur.damage
        r.extend(Room.start_turn(wsene, wscur))    
        cur.attacking = False
        cur.damage = 0 # reset
    
    return r

def defend(wscur,wsene): # cur是用卡方
    cur, ene = wscur.player, wsene.player
    r = []
    if ene.attacking or ene.surprise:
        r.append(( (wsene,wscur), dumps({"msg": "defended", "data": [cur.name]})))
        
    else:
        r.append(( (wsene,wscur), dumps({"msg": "defend", "data": [cur.name]})))

        cur.life += 1
    return r

def heal(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    r.append(( (wsene,wscur), dumps({"msg": "heal", "data": [cur.name]})))
    cur.life += 2
    return r

def supply(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    r.append(( (wsene,wscur), dumps({"msg": "supply", "data": [cur.name]})))

    for _ in range(2):
        game.draw(cur)

    return r

def rob(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    r.append(( (wscur, ), dumps({"msg": "rob", "data": [cur.name, ene.name],
                                "action": "toRob", "value": {"enemy_card": ene.hand}})))

    cur.status = Room.ROBBING
    r.append(( (wsene, ), dumps({"msg": "rob", "data": [cur.name, ene.name]})))
    return r

def surprise(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    cur.surprise = True

    r = []
    
    cur.damage = 1
    r.append(( (wscur, wsene), dumps({"msg": "surprise", "data": [cur.name]})))
    if ene.defence():
        r.append(( (wsene, ),
            dumps({"action": "toDefend", "value": {"damage": cur.damage, "type": "surprise"}})
        ))
        cur.status = Room.NOTHING
        ene.status = Room.DEFENCE
    else:
        msg = "surNoCard"
        if ene.hand:
            drop = random.choice(ene.hand)
            ene.remove_card(drop)
            msg = "surprised"
        r.append(( (wsene, wscur),
                dumps({"msg": msg, "data": [ene.name, cur.damage]})
            ))
        
        cur.status = Room.NOTHING
        ene.life -= cur.damage
        drop = random.choice(ene.hand)
        ene.remove_card(drop)
        cur.surprise = False
        cur.damage = 0 # reset
        
        r.extend(Room.start_turn(wsene, wscur))
        
    return r

def trade(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    if ene.hand:
        r.append(( (wsene, wscur),
                dumps({"msg": "trade", "data": [cur.name, ene.name]})
            ))

        r.append(( (wscur,),
                dumps({"action": "toTrade", "value": {"hand": cur.hand}}) # 更新已被移除的trade
            ))
        cur.status = Room.TRADE
    else:
         r.append(( (wscur,wsene),
                dumps({"msg": "tradeNoCard", "data": [cur.name]})
            ))
         r.extend(Room.start_turn(wsene, wscur))
    
    return r

def aware(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    if ene.attacking:
        r.append(( (wsene,wscur), dumps({"msg": "awared", "data": [cur.name, ene.name, "攻擊"]})))

    elif ene.robbing != "0":
        r.append(((wscur, wsene), dumps({"msg": "awared", "data": [cur.name, ene.name, "搶奪"]})))
     
    elif ene.surprise:
        r.append(( (wsene,wscur), dumps({"msg": "awared", "data": [cur.name, ene.name, "奇襲"]})))

    else:
        r.append(((wscur, wsene), dumps({"msg": "aware", "data": [cur.name]})))
        for _ in range(3):
            game.draw(cur)
            
    return r

def plan(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []

    r.append(( (wsene, wscur),
            dumps({"msg": "plan", "data": [cur.name]})
        ))
    
    options = random.sample(cur.deck,3)
    r.append(( (wscur, ),
            dumps({"action": "toAdd", "value": {"cards": options}})
        ))
    cur.planning = options
    cur.status = Room.PLAN

    return r

def sweep(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    cur.attacking = True

    r = []
    
    cur.damage = random.randint(0,5)
    r.append(( (wscur, wsene), dumps({"msg": "sweep", "data": [cur.name, ene.name, cur.damage]})))
    if ene.defence():
        r.append(( (wsene, ),
            dumps({"action": "toDefend", "value": {"damage": cur.damage, "type": "sweep"}})
        ))
        cur.status = Room.NOTHING
        ene.status = Room.DEFENCE
    else:
        r.append(( (wsene, wscur),
            dumps({"msg": "damaged", "data": [ene.name, cur.damage]})
        ))
        
        cur.status = Room.NOTHING
        ene.life -= cur.damage
        r.extend(Room.start_turn(wsene, wscur))    
        cur.attacking = False
        cur.damage = 0 # reset

    return r



def bless(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    r.append(( (wsene,wscur), dumps({"msg": "bless", "data": [cur.name]})))

    cur.poison = 0 # 解毒
    cur.life += 3
    
    for _ in range(2):
        game.draw(cur)
    return r

def poison(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    r.append(( (wsene,wscur), dumps({"msg": "poison", "data": [cur.name, ene.name]})))

    ene.poison += 1
    return r

def curse(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    

    ene.life -= 4

    msg = "curseNoCard"
    if ene.hand:
        drop = random.choice(ene.hand)
        ene.remove_card(drop)
        msg = "curse"
    r.append(( (wsene,wscur), dumps({"msg": msg, "data": [cur.name, ene.name]})))
    return r

def counter(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    
    if ene.attacking:
        r.append(( (wsene,wscur), dumps({"msg": "countered", "data": [cur.name, ene.name, ene.damage]})))
        ene.life -= ene.damage
    elif ene.surprise:
        r.append(( (wsene,wscur), dumps({"msg": "counteredSur", "data": [cur.name, ene.name, ene.damage]})))
        ene.life -= ene.damage
        drop = random.choice(ene.hand)
        ene.remove_card(drop)
    else:
        r.append(( (wsene,wscur), dumps({"msg": "counter", "data": [cur.name, ene.name]})))
        ene.life = ene.life//2
        
    return r

def chaos(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    r.append(( (wsene,wscur), dumps({"msg": "chaos", "data": [cur.name, ene.name]})))

    cur.life += 3
    ene.life -= 3
    return r

def reverse(wscur,wsene):
    cur, ene = wscur.player, wsene.player
    r = []
    r.append(( (wsene,wscur), dumps({"msg": "reverse", "data": [cur.name]})))

    
    cur.life,ene.life = ene.life,cur.life
    return r

skills = dict()
skill_name = [attack,defend,heal,supply,rob,surprise,trade,aware,plan,sweep,bless,poison,curse,counter,chaos,reverse]
for i in range(len(skill_name)):
	skills[str(i+1)] = skill_name[i]

