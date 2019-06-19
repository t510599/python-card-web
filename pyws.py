import card
import game
from room import Room, sendTo

import asyncio
import random
import websockets
from json import dumps, loads

import ssl

connected = {-1: []}
name=["安","圭月","梅","小兔","銀","正作","W","桑德","海爾","雪村"]

fut = None
wait_fut = [0, 0]
async def wait(websocket, *cors, timeout=45, futs=None):
    if futs != None:
        fut_cor = futs
    else:
        fut_cor = [cor() for cor in cors]
    done, pending = await asyncio.wait(fut_cor,
                                       return_when=asyncio.FIRST_EXCEPTION, timeout=timeout)

    #print("Futures:", done, pending)
    if pending:
        for task in pending:
            task.cancel()

    if len(done):
        if list(done)[0].exception() == None:
            return list(done)[0].result()
        else:
            return "exception"
def random_room(room_list):

    while len(room_list)>=1:
            enter = random.choice(room_list)
            print("rooms", enter, room_list)
            if len(connected[enter]) < 2:
                return enter
    while 1:
        enter = random.randint(1, 99999)
        if enter not in connected:
            return enter
            


async def enter_room(websocket):
    global connected, fut
    
    room_list = [room_id for room_id in connected if len(connected[room_id])<2 and room_id != -1]
    #print("I'm here")
    await websocket.send(str(room_list))
    #print("In enter_room, SAD")
            
    message = await wait(websocket, websocket.recv)
    if message == "n":
        room_id = random_room(room_list)
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
        else:
            players = connected[websocket.room].start()
            
            for ws in connected[room_id]:
                ws.status = Room.PLAYING
                wsene = connected[room_id].players[0] if connected[room_id].players[1] is ws else connected[room_id].players[1]
                await ws.send(dumps({"room": room_id, "cur": ws.player.name, "ene": wsene.player.name}))
                await ws.send(dumps({"msg": "firstAttack", "data": [players[0].player.name], "hand": ws.player.hand}))
    
            fut.cancel()
            for ws_list, message in Room.start_turn(*players):
                    await sendTo(message, *ws_list)
async def handler(websocket, path):
    global connected, fut, wait_fut, rooms
    print("initialize")
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
    except Exception as e:
        print(e)
        return # close the connection

    
    
    try:
        # Implement logic here.
        
        while 1:
            #message = await wait(websocket, websocket.recv, timeout=10)
            
            if websocket.status == Room.MATCHING:
                await enter_room(websocket)
            elif websocket.status == Room.WAITING:
  
                fut = asyncio.ensure_future(websocket.recv())
                
                try:
                    message = await wait(websocket, timeout=100, futs=[fut])
                    print(message)
                    print(fut)
                    if message == "e":
                        connected[websocket.room].player_delete(websocket)
                        
                        await websocket.send("You have left Room "+str(connected[websocket.room]))
                        del connected[websocket.room]
                        del websocket.room 
                        connected[-1].append(websocket)
                        websocket.status = Room.MATCHING
                    elif message == "exception":
                        break
                except asyncio.CancelledError:
                    pass


            elif websocket.status == Room.PLAYING:
                
                try:
                    enemy = 0 if websocket == connected[websocket.room].players[1] else 1
                    wait_fut[(enemy+1)%2] = asyncio.ensure_future(websocket.recv())
                    
                    message = await wait(websocket, timeout=30, futs=[wait_fut[(enemy+1)%2]])
                    print("received message", message)
                    if message == "exception":
                        break
                    message_to_send = connected[websocket.room].process(websocket, message)
                    for ws_list, message in message_to_send:
                        await sendTo(message, *ws_list)
                    if message_to_send != []:
                        try:
                            if loads(message_to_send[-1][1])['msg'] == 'win': # 取最後一筆訊息的msg
                                connected[websocket.room].player_delete(websocket)
                                break
                        except KeyError:
                            pass
                        wait_fut[enemy].cancel() # 取消另一方的await

                    
                except asyncio.CancelledError:
                    print("Canceled\n\n")
                
                
                
            elif websocket.status == Room.DISCONNECT:
                break
    finally:
        # Unregister.
        try:
            
            if websocket not in connected[websocket.room]:
                connected[websocket.room].players[0].status = Room.DISCONNECT
                wait_fut[0].cancel()
                wait_fut[1].cancel()
                
            else:    
                if connected[websocket.room].player_delete(websocket):
                    await connected[websocket.room].players[0].send(dumps({"msg": "eneDisconn", "data": [connected[websocket.room].players[0].player.name]}))
                    connected[websocket.room].players[0].status = Room.DISCONNECT
                    wait_fut[0].cancel()
                    wait_fut[1].cancel()

                    # it will leave the loop and disconnect


            if len(connected[websocket.room]) == 0: # clear the dictionary
                print("delete")
                del connected[websocket.room]
                
        except:
            connected[-1].remove(websocket)

        print(connected)


start_server = websockets.serve(handler, '10.128.0.2', 8787)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
