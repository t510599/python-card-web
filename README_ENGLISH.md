# python-card
A simple card game with command line interface.

## Overview

A  card dueling game start with two players . 

At the beginning of game,each player has :

* 20 HP

* a card deck has 115 cards

* three initial card in hand

one of players will be appointed as the first player by the system
It’s a turn-based game
When a player’s HP turns zero,he/she lose the game . The opponent win.

##Cards 

opponent can use defensive card while you use the offensive card
card id and effect are in below chart:

|  ID | Name | Description | Remarks |
| :--:   | :-----:  | :----: | :-----: |
| 1 | attack | deal 2 damage to opponent | offensive card |
| 2 | defense | block offensive card / restore 1 HP  | defensive card |
| 3 | heal |  restore 2 HP  |  |
| 4 | supply | draw two cards  |  |
| 5 | rob | choose and get a card from opponent’s hand|  |
| 6 | ambush | deal 2 damage to opponent and discard a random card in opponent’s hand | offensive card |
| 7 | trade | exchange one card in hand with opponent  |  |
| 8 | predict | block offensive card and draw one card、block ‘rob’ / draw three card | defensive card |
| 9 | outstanding move | choosing three random cards from card deck and select one to insert into hand  |  |
| 10 | shoot | deal 0~5 damage to opponent  | offensive card |
| 11 | protect | restore 3 HP and detoxify |  |
| 12 | poison | poison opponent and deal 1 damage every turn  |  |
| 13 | curse | deal 4 damage to opponent and discard opponent a random card in hand  |  |
| 14 | rebound | block offensive card and rebound its effect / halve opponent’s HP  | defensive card |
| 15 | madness | restore 3 HP and deal 3 damage to opponent |  |
| 16 | reverse | exchange your HP for opponent’s HP  | <br> |

##Libraries
Web:
    1.TocasUI [https://tocas-ui.com](https://tocas-ui.com)
    2.jQuery

Server:
  1.websockets
    
##REquirement
1.Python 3.6 or higher
2.`websockets` installed

## To start
```bash
git clone https://github.com/t510599/python-card-web
cd python-card-web
pip install websockets
python pyws.py
```



