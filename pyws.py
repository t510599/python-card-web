import card
import game
from room import Room, sendTo

import asyncio
import datetime
import random
import websockets
from json import dumps, loads 

connected = {-1: []}
character = dict()
name=["安","圭月","梅","小兔","銀","正作","W","桑德","海爾","雪村"]

for i in range(len(name)):
    character[str(i+1)] = name[i] 


sad = None
fut = None
async def wait(websocket, *cors, timeout=45, futs=None):
    if futs != None:
        fut_cor = futs
    else:
        fut_cor = [cor() for cor in cors]
    done, pending = await asyncio.wait(fut_cor,
                                       return_when=asyncio.FIRST_EXCEPTION, timeout=timeout)
    #print(done, pending)
    if pending:
        #print("coroutine doesn't finish its work")
        pass
    if len(done):
        return list(done)[0].result()
    else:
        #print("SADDDDD")
        return
def random_room():
    global connected, rooms
    try:
        print(rooms)
    except:
        rooms = list(connected)
        rooms.remove(-1)
    print(rooms)
    while len(rooms)>=1:
            enter = random.choice(rooms)
            print("rooms", enter, rooms)
            rooms.remove(enter)
            if len(connected[enter]) < 2:
                return enter
    while 1:
        enter = random.randint(1, 99999)
        if enter not in connected:
            rooms.append(enter)
            return enter
            
        
    
async def enter_room(websocket):
    global connected ,sad, fut
    
    room_list = [room_id for room_id in connected if len(connected[room_id])<2 and room_id != -1]
    #print("I'm here")
    await websocket.send(str(room_list))
    #print("In enter_room, SAD")
            
    message = await wait(websocket, websocket.recv)
    if message == "n":
        room_id = random_room()
    else:
        room_id = int(message)

    connected[room_id] = connected.get(room_id, Room(room_id))

                    
    count = len(connected[room_id])
    print(count)
                    
    if count <= 1: # Enter the room
        connected[room_id].player_add(websocket)
        connected[-1].remove(websocket)

        websocket.room = room_id
        websocket.status = Room.WAITING
                
        if count+1 == 1: # 該玩家已加入房間
            await websocket.send(str(room_id))
            sad = websocket
        else:
            players = connected[websocket.room].start()
            
            for ws in connected[room_id]:
                ws.status = Room.PLAYING
                wsene = connected[room_id].players[0] if connected[room_id].players[1] is websocket else connected[room_id].players[1]
                await ws.send(dumps({"room": room_id, "cur": websocket.player.name, "ene": wsene.player.name}))
                await ws.send(dumps({"msg": "firstAttack", "data": [players[0].player.name], "hand": ws.player.hand}))
    
            fut.cancel()
            for ws_list, message in Room.start_turn(*players):
                    await sendTo(message, *ws_list)
async def handler(websocket, path):
    global connected,sad, fut
    # Register.
    connected[-1].append(websocket)
    websocket.status = Room.CONNECTED

    # CHOOSE CHARACTER
    await websocket.send("CHOOSE CHARACTER")
    try:
        choice = await wait(websocket, websocket.recv)
        if int(choice) not in range(1, len(name)+1):
            raise ValueError("Wrong input, close the connection...")
        websocket.player = game.Player(name[int(choice)-1], card.default_deck)
            
        websocket.status = Room.MATCHING
    except:
        return # close the connection

    
    
    try:
        # Implement logic here.
        
        while 1:
            #message = await wait(websocket, websocket.recv, timeout=10)
            
            if websocket.status == Room.MATCHING:
                await enter_room(websocket)
            elif websocket.status == Room.WAITING:
                print("SAD", "FIRST" if websocket == sad else "SECOND")
                
                fut = asyncio.ensure_future(websocket.recv())
                try:
                    message = await wait(websocket, timeout=100000, futs=[fut])
                    if message == "e":
                        connected[websocket.room].player_delete(websocket)
                        
                        await websocket.send("You have left Room "+str(connected[websocket.room]))
                        del websocket.room
                        connected[-1].append(websocket)
                        websocket.status = Room.MATCHING
                except asyncio.CancelledError:
                    pass
                print("SADDDDDD", "FIRST" if websocket == sad else "SECOND")
                
            elif websocket.status == Room.PLAYING:
                print("wait for message", "FIRST" if websocket == sad else "SECOND")
                message = await wait(websocket, websocket.recv, timeout=100000)
                print("received message", "FIRST" if websocket == sad else "SECOND")

                message_to_send = connected[websocket.room].process(websocket, message)
                for ws_list, message in message_to_send:
                    await sendTo(message, *ws_list)
    finally:
        # Unregister.
        try:
            connected[websocket.room].player_delete(websocket)
        except:
            connected[-1].remove(websocket)
        print(connected)

        

"""cert = ssl.SSLContext()
cert.load_cert_chain("/etc/letsencrypt/live/stoneapp.tech/fullchain.pem","/etc/letsencrypt/live/stoneapp.tech/privkey.pem")
start_server = websockets.serve(handler, '10.128.0.2', 8787,ssl=cert)"""

start_server = websockets.serve(handler, '127.0.0.1', 9000)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
