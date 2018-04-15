import card
import game
from room import Room, sendTo

import asyncio
import datetime
import random
import websockets
       

connected = {-1: []}
character = dict()
name=["安","圭月","梅","小兔","銀","正作","W","桑德","海爾","雪村"]

for i in range(len(name)):
	character[str(i+1)] = name[i] 

async def handler(websocket, path):
    global connected
    # Register.
    connected[-1].append(websocket)
    websocket.status = Room.CONNECTED
    await websocket.send("CHOOSE CHARACTER")
    try:
        # Implement logic here.
        while 1:
            message = await websocket.recv()
            if websocket.status == Room.CONNECTED: # choose character
                choice = message
                while choice not in map(lambda x : str(x+1),list(range(len(name)))):
                    await websocket.send("CHOOSE")
                    await websocket.send("CHOOSE: "+ str(choice) + "\n" + str(list(range(len(name)))))
                    choice = await websocket.recv()
                p_name = character[choice]
                await websocket.send("PLAYER "+p_name)
                websocket.player = game.Player(p_name,card.default_deck)
                
                websocket.status = Room.MATCHING

            elif websocket.status == Room.MATCHING: 
                try:
                    room_id = int(message)
                    connected[room_id] = connected.get(room_id, Room(room_id))
                    
                    count = connected[room_id].count()
                    
                    if count <= 1: # Enter the room
                        connected[room_id].player_add(websocket)
                        connected[-1].remove(websocket)
                        await websocket.send("You have entered room "+ str(connected[room_id]))
                        websocket.room = room_id
                        
                        if count+1 == 1: # 該玩家已加入房間
                            await websocket.send("Waiting for another player...")
                        else:
                            for ws in connected[room_id]:
                                ws.status = Room.PLAYING
                                await ws.send("The game will start soon.....")
                            # await connected[room_id].start()
                            # Testing

                    else: # Can't enter the room
                        await websocket.send("SAD, This room is full. Please enter another room.")
                except Exception as e:
                    print(e)
                print("STATUS = MATCHING")
            elif websocket.status == Room.PLAYING:
                print("STATUS = PLAYING, message got")
                for ws in connected[websocket.room]:
                    await ws.send("STARTING... But unfortunately, we haven't completed this part of code.")
                print("STATUS = PLAYING, message sent")
        
    finally:
        # Unregister.
        connected[websocket.room].player_delete(websocket)
        print(connected)

        

"""cert = ssl.SSLContext()
cert.load_cert_chain("/etc/letsencrypt/live/stoneapp.tech/fullchain.pem","/etc/letsencrypt/live/stoneapp.tech/privkey.pem")
start_server = websockets.serve(handler, '10.128.0.2', 8787,ssl=cert)"""

start_server = websockets.serve(handler, '127.0.0.1', 9000)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
