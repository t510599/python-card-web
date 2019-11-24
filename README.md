# 災厄之悲歌
Web version of **[t510599/python-card](https://github.com/t510599/python-card)**  
Let's play! [https://app.stoneapp.tech/ElegyOfDisaster](https://app.stoneapp.tech/ElegyOfDisaster)  

## Special thanks
[圭月](https://github.com/spacezipper) : 遊戲設計  
[Jerry Wu](https://github.com/a91082900) : server development

## Overview

由兩個玩家進行一場卡牌遊戲對戰。 每一個玩家在遊戲開始時會有：
* 15點生命
* 50張卡牌組成的牌庫
* 三張初始手牌
由系統隨機設定一名玩家先攻並進行回合制， 當玩家生命歸零，則該玩家敗北，另一玩家勝利。

## Cards

使用攻擊類卡片時，敵方可選擇防禦類卡片來抵擋攻擊。
各卡牌編號及效果如下表：

|  ID | Name | Description | Remarks |
| :--:   | :-----:  | :----: | :-----: |
| 1 | 攻擊 | 對敵方造成兩點傷害 | 攻擊類卡片 |
| 2 | 防禦 | 抵擋攻擊類卡片 / 回復一點生命  | 防禦類卡片 |
| 3 | 治癒 |  回復兩點生命  |  |
| 4 | 補給 | 抽取兩張手牌  |  |
| 5 | 強奪 | 從敵方手牌中選擇一張加入自己的手牌  |  |
| 6 | 奇襲 | 對敵方造成一點傷害，並使其隨機損失一張手牌  | 攻擊類卡片 |
| 7 | 交易 | 選取一張手牌與敵方交換  |  |
| 8 | 洞悉 | 抵擋攻擊類卡片，並抽取一張手牌、抵擋強奪的效果 / 抽取三張手牌  | 防禦類卡片 |
| 9 | 妙策 | 從牌庫中隨機挑出三張卡片，選擇一張加入手牌  |  |
| 10 | 掃射 | 對敵方造成零～五點傷害  | 攻擊類卡片 |
| 11 | 加護 | 回復三點生命，並解除中毒 |  |
| 12 | 劇毒 | 使敵方中毒：每個回合，玩家會損失一點生命  |  |
| 13 | 詛咒 | 使其損失四點生命，並隨機損失一張手牌  |  |
| 14 | 反制 | 抵擋攻擊類卡片，並反彈其傷害和效果 / 使敵方生命減半  | 防禦類卡片 |
| 15 | 狂亂 | 回復三點生命，並對敵方造成三點傷害 |  |
| 16 | 逆轉 | 使自己與敵方的生命交換  | <br> |


## Libraries
Web:
  1. TocasUI [https://tocas-ui.com](https://tocas-ui.com)
  2. jQuery

Server:
  1. websockets

## Requirement
1. Python 3.6 or higher
2. `websockets` installed

## To start
```bash
git clone https://github.com/t510599/python-card-web
cd python-card-web
pip install websockets
python pyws.py
```
