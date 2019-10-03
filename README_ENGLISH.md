# python-card
A simple card game with a command line interface.

## Overview

A turn-based dueling card game for two players. 

At the beginning of game,each player has:

* 20 HP

* a card deck with 115 cards

* three initial cards in hand

one of players will be appointed as the first player by the system

When a player's HP turns to zero, he/she loses the game, and the opponent wins.

## Cards

Opponent can use defensive cards while the player uses the offensive card.
Card id and effect are listed in the chart below:

|  ID | Name | Description | Remarks |
| :--:   | :-----:  | :----: | :-----: |
| 1 | attack | deal 2 damage to the opponent | offensive card |
| 2 | defense | block offensive card / restore 1 HP  | defensive card |
| 3 | heal |  restore 2 HP  |  |
| 4 | supply | draw two cards  |  |
| 5 | rob | choose and get a card from the opponent's hand|  |
| 6 | ambush | deal 2 damage to the opponent and discard a random card in his/her hand | offensive card |
| 7 | trade | exchange one card in hand with opponent  |  |
| 8 | predict | block offensive card and draw one card、block ‘rob’ / draw three cards | defensive card |
| 9 | outstanding move | choose three random cards from the card deck and then select one to be drawn to hand  |  |
| 10 | shoot | deal 0~5 damage to the opponent  | offensive card |
| 11 | protect | restore 3 HP and detoxify oneself|  |
| 12 | poison | toxify the opponent, which deals 1 damage every turn  |  |
| 13 | curse | deal 4 damage to opponent and discard a random card in the opponent's hand  |  |
| 14 | rebound | block offensive card and rebound its effect / halve opponent's HP  | defensive card |
| 15 | madness | restore 3 HP and deal 3 damage to the opponent |  |
| 16 | reverse | exchange your HP for opponent's HP  | <br> |

## Libraries
Web:
    1.TocasUI [https://tocas-ui.com](https://tocas-ui.com)
    2.jQuery

Server:
  1.websockets
    
## Requirement
1.Python 3.6 or higher
2.`websockets` installed

## To start
```bash
git clone https://github.com/t510599/python-card-web
cd python-card-web
pip install websockets
python pyws.py
```



