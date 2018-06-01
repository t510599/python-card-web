import game, card
import random
from json import dumps, loads
class Room:
    CONNECTED = 0
    MATCHING = 1
    PLAYING = 2
    WAITING = -1
    DISCONNECT = -2

    # Player Status Definition
    NOTHING = -1
    IN_TURN = 0
    ROBBED = 1
    DEFENCE = 2
    ROBBING = 3
    TRADE = 4
    TRADE_ENE = 5
    PLAN = 6
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
            if len(self) == 1:
                return True
            else:
                return False
        except:
            pass
        
    
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
        draw_res = game.draw(cur)
        if not draw_res:
            message_to_send.append(( (wscur, wsene), dumps({"msg": "noCard", "data": [cur.name]})))
        else:
            message_to_send.append(( (wscur,), draw_res))
            
            if cur.poison_check():
                message_to_send.append(( (wscur,wsene), dumps({"msg": "poisonDamaged", "data": [cur.name,cur.poison]})))
            
            message_to_send.append(( (wscur,), 
                dumps({"player": {
                            "turn": cur.turn, "hand": cur.hand, "deck_left": len(cur.deck),
                            "life": cur.life, "poison": cur.poison,
                        },
                       "enemy": {
                           "life": ene.life, "deck_left": len(ene.deck),
                            "hand": len(ene.hand), "poison": ene.poison,
                        },
                       "now": "player", 
                    }
                )
            ))

            message_to_send.append(( (wsene,), 
                dumps({"player": {
                            "turn": ene.turn, "hand": ene.hand, "deck_left": len(ene.deck),
                            "life": ene.life, "poison": ene.poison, 
                        },
                        "enemy": {
                            "turn": cur.turn, "deck_left": len(cur.deck),
                            "life": cur.life, "hand": len(cur.hand), "poison": cur.poison,
                            # cur為當前回合之玩家，故此處仍為cur
                        },
                        "now": "enemy"
                    }
                )
            ))
            message_to_send.append(( (wsene,), dumps({"msg": "drawEne", "data": [cur.name]})))

            cur.status = Room.IN_TURN

        if cur.life <= 0:
            message_to_send.append(( (wscur,), dumps({"msg": "win", "data": ["enemy"]})))
            message_to_send.append(( (wsene,), dumps({"msg": "win", "data": ["player"]})))

        elif ene.life <= 0:
            message_to_send.append(( (wscur,), dumps({"msg": "win", "data": ["player"]})))
            message_to_send.append(( (wsene,), dumps({"msg": "win", "data": ["enemy"]})))

  
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
                message_to_send.append(((wsene, wscur), dumps({"msg": "use", "data": [cur.name, choice]})))
                cur.remove_card(choice)
                
                message_to_send.extend(card.skills[choice](wscur, wsene))

                if choice in start_next_turn_cards:
                    cur.status = self.NOTHING 
                    message_to_send.extend(Room.start_turn(wsene, wscur))

            else: # 直接結束
                cur.status = self.NOTHING
                message_to_send.extend(Room.start_turn(wsene, wscur))

                
        elif cur.status == self.ROBBING:
            swag = choice
            ene.status = self.NOTHING
            if swag in ene.hand:
                cur.robbing = swag
                if ene.keep():   
                    cur.status = Room.NOTHING
                    ene.status = Room.ROBBED
                    message_to_send.append(((wsene, ), dumps({"action": "toBeRobbed"})))
                else:
                    ene.robbed(swag)
                    cur.add_card(swag)
                    message_to_send.append(( (wscur,wsene), dumps({"msg": "robbed", "data": [cur.name, cur.robbing]})))
                
                    cur.robbing = "0"
                    cur.status = Room.NOTHING

                    message_to_send.extend(Room.start_turn(wsene, wscur))
                    
            else: # 直接結束
                message_to_send.append(((wsene, wscur), dumps({"msg": "cantRob", "data": [cur.name]})))
                    
                message_to_send.extend(Room.start_turn(wsene, wscur))

        
        elif cur.status == self.ROBBED:
            if choice in cur.hand and choice in card.unrobable:
               
                message_to_send.extend(card.skills[choice](wscur,wsene))
                cur.remove_card(choice)
            else:
                message_to_send.append(( (wscur,wsene), dumps({"msg": "robbed", "data": [ene.name, ene.robbing]})))
                cur.robbed(ene.robbing)
                ene.add_card(ene.robbing)
            
            ene.robbing = "0"

            message_to_send.extend(Room.start_turn(wscur, wsene))
            
        elif cur.status == self.DEFENCE: # cur是被攻擊方
            if choice in cur.hand:
                if choice in card.unattackable:
                    message_to_send.extend(card.skills[choice](wscur,wsene))
                    cur.remove_card(choice)
                else:
                    if ene.surprise:
                        msg = "surNoCard"
                        if ene.hand:
                            drop = random.choice(ene.hand)
                            ene.remove_card(drop)
                            msg = "surprised"
                        message_to_send.append(( (wsene, wscur), dumps({"msg": msg, "data": [cur.name, ene.damage]})))
                    else:
                        message_to_send.append(( (wsene, wscur), dumps({"msg": "damaged", "data": [cur.name, ene.damage]})))
                    cur.life -= ene.damage
            else:
                if ene.surprise:
                    drop = random.choice(ene.hand)
                    ene.remove_card(drop)
                    message_to_send.append(( (wsene, wscur), dumps({"msg": "surprised", "data": [cur.name, ene.damage]})))
                else:
                    message_to_send.append(( (wsene, wscur), dumps({"msg": "damaged", "data": [cur.name, ene.damage]})))
                cur.life -= ene.damage
                
            ene.attacking = False
            ene.surprise = False # 兩個都取消
            ene.damage = 0 # reset

            message_to_send.extend(Room.start_turn(wscur, wsene))
        
        elif cur.status == self.TRADE:
            if choice in cur.hand:

                message_to_send.append(( (wsene, wscur), dumps({"msg": "tradeChoose", "data": [cur.name, choice]})))  
                message_to_send.append(( (wsene,), dumps({"action": "toTrade"})))
                cur.trading = choice
                cur.status = self.NOTHING
                ene.status = self.TRADE_ENE
            else: # 直接結束
                message_to_send.extend(Room.start_turn(wsene, wscur))
                
        elif cur.status == self.TRADE_ENE:
            if cur.hand:
                if choice not in cur.hand:
                    choice = random.sample(cur.hand, 1)[0] # decide a card randomly
                     
                ene.hand.remove(ene.trading)
                ene.hand.append(choice)

                cur.hand.remove(choice)
                cur.hand.append(ene.trading)
            else:
                message_to_send.append(( (wsene,wscur), dumps( {"msg": "tradeNoCard", "data": [cur.name]})))
               

            ene.trading = "0"
            
            message_to_send.extend(Room.start_turn(wscur, wsene))
            
        elif cur.status == self.PLAN:
            if choice in cur.planning:
                cur.add_card(choice)
            cur.stauts = Room.NOTHING
            cur.planning = []
            message_to_send.extend(Room.start_turn(wsene, wscur))
        print("status of ",cur.name, ":", cur.status)
        print("status of ",ene.name, ":", ene.status)
        return message_to_send
async def sendTo(message, *ws_list):
        for ws in ws_list:
            await ws.send(message)
