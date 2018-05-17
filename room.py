import game, card
import random
from json import dumps, loads
  
class Room:
    CONNECTED = 0
    MATCHING = 1
    PLAYING = 2
    WAITING = -1

    # Player Status Definition
    NOTHING = -1
    IN_TURN = 0
    ROBBED = 1
    DEFENCE = 2
    ROBBING = 3
    TRADE = 4
    PLAN = 5
    def __init__(self, room):
        self.room = room
        self.players = []

        
    def __len__(self):
        return len(self.players)
    
    def __repr__(self):
        return "ROOM {}, {} player(s)".format(str(self.room), len(self))

    def __iter__(self):
        return iter(self.players)
    
    def player_add(self, player):
        if len(self) >= 2:
            return
        self.players.append(player)
        
    def player_delete(self, player):
        try:
            self.players.remove(player)
        except:
            pass
        
    
        
    """async def start(self):
        p1, p2 = self.players[0].player, self.players[1].player
        first = random.choice([p1, p2])
        print(first, p1, p2)
        first.playing = True # so the first one will be random
        await sendTo(first.name + "先攻", *self.players)
        print(first.name,"先攻")
        print() # change line
        for _ in range(3): # 初始手牌*3
            game.draw(p1)
            game.draw(p2)

        while p1.life > 0 and p2.life > 0:
            print("game.turn start")                
            await game.turn(self.players[0], self.players[1])
            print("game.turn end")
        if p1.life <= 0:
            print("{} 獲勝".format(p2.name))
        elif p2.life <= 0:
            print("{} 獲勝".format(p1.name))"""
    def start(self): # initialize the game
        p1, p2 = self.players[0].player, self.players[1].player
        ws_list = self.players[:]
        
        firstws = ws_list.pop(random.randint(0, 1))
        #print(first, p1, p2)
        firstws.player.playing = True # so the first one will be random
        #await sendTo(first.player.name + "先攻", *self.players)
        
        print(firstws.player.name,"先攻")
        print() # change line
        for _ in range(3): # 初始手牌*3
            game.draw(p1)
            game.draw(p2)
        return firstws, ws_list[0] # it will be second player
    @staticmethod
    def start_turn(wscur, wsene):
        cur, ene = wscur.player, wsene.player
        
        message_to_send = []
        
        cur.playing, ene.playing = ene.playing, cur.playing
        
        cur.turn += 1
        
        message_to_send.append(( (wscur,), game.draw(cur)))
        message_to_send.append(( (wscur,), 
            dumps({"player": {
                        "turn": cur.turn, "hand": cur.hand, "deck_left": len(cur.deck),
			"life": cur.life
                    }
                }
            )
        ))

        message_to_send.append(( (wsene,), 
            dumps({"enemy": {
                        "turn": cur.turn, "deck_left": len(cur.deck),
			"life": cur.life # cur為當前回合之玩家，故此處仍為cur
                    }
                }
            )
        ))

        message_to_send.append(( (wsene,), dumps({"msg": "drawEne", "data": [cur.name]})))

        cur.status = Room.IN_TURN
        if cur.poison_check():
            message_to_send.append(( (wscur,wsene), "{} 受到了劇毒的侵蝕, 損失{}點生命".format(cur.name,cur.poison)))
        if cur.life <= 0:
            pass
        #await sendTo(health(p1,p2), wsp1, wsp2)
        #await sendTo(draw(cur), wsp1, wsp2) # 抽卡
        #message_to_send.append(( (wscur,), game.display(cur))) # 顯示手牌
        #message_to_send.append(( (wscur,), "請問要使用手牌嗎? 若不使用請輸入0"))
        return message_to_send
        
    def process(self, wscur, message): # cur is the person who send message to server

        start_next_turn_cards = ['2', '3', '4', '8', '11', '12', '13', '14', '15', '16']
        cur = wscur.player
        wsene = self.players[1] if wscur is self.players[0] else self.players[0]
        ene = wsene.player
        message_to_send = []
        choice = message
        if cur.status == self.IN_TURN:
            
            if choice in cur.hand:
                
                message_to_send.extend(card.skills[choice](wscur, wsene))
                if choice in start_next_turn_cards:
                    cur.status = self.NOTHING 
                    message_to_send.extend(Room.start_turn(wsene, wscur))
                    
                cur.remove_card(choice)
            elif choice == "0":
                cur.status = self.NOTHING
                message_to_send.extend(Room.start_turn(wsene, wscur))
            """elif choice == "-1":
                cur.surrender()
                {}投降".format(cur.name)"""
                
        elif cur.status == self.ROBBING:
            pass
        
        elif cur.status == self.ROBBED:
            pass
        elif cur.status == self.DEFENCE: # cur是被攻擊方
            if choice in cur.hand:
                if choice in card.unattackable:
                    message_to_send.extend(card.skills[choice](wscur,wsene))
                    cur.remove_card(choice)
                elif choice == "0":
                    message_to_send.append(( (wsene, wscur), "{} 受到{}點傷害".format(cur.name,ene.damage)))
                    ene.life -= cur.damage
            else:
                message_to_send.append(( (wscur,wsene), "{} 受到{}點傷害".format(cur.name,ene.damage)))
            cur.life -= cur.damage
            ene.attacking = False
            ene.damage = 0 # reset

            message_to_send.extend(Room.start_turn(wscur, wsene))
        
        elif cur.status == self.TRADE:
            pass
        
        elif cur.status == self.PLAN:
            pass

        return message_to_send
async def sendTo(message, *ws_list):
        for ws in ws_list:
            await ws.send(message)
