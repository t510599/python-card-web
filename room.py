import game
import random
  
class Room:
    CONNECTED = 0
    MATCHING = 1
    PLAYING = 2
    WAITING = -1
    def __init__(self, room, players=[]):
        self.room = room
        self.players = players
        
    def __repr__(self):
        return "ROOM {}, {} player(s)".format(str(self.room), len(self.players))

    def __iter__(self):
        return iter(self.players)
    
    def player_add(self, player):
        if self.count() >= 2:
            return
        self.players.append(player)
        
    def player_delete(self, player):
        try:
            self.players.remove(player)
        except:
            pass
        
    def count(self):
        return len(self.players)
        
    async def start(self):
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
            await game.turn(self.players[0], self.players[1])

        if p1.life <= 0:
            print("{} 獲勝".format(p2.name))
        elif p2.life <= 0:
            print("{} 獲勝".format(p1.name))

async def sendTo(message, *ws_list):
        for ws in ws_list:
            await ws.send(message)
