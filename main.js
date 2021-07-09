const riotKey = "your riot key";
const sp = "%20";
const fetch = require('node-fetch');
const express = require('express');
const app = express();

main();


async function main(){
    const sumOne = await fetchSumByName('tinydolphin');
    const sumTwo = await fetchSumByName('your cut');
    const matchList = await getMatchList(sumOne.puuid);
    

    const gamesPlayed = await rankedTogether(matchList,sumTwo.puuid);
    console.log(gamesPlayed);
}

async function fetchSumByName(name){
    while(name.includes(" ")){
        let spaceSpot = name.indexOf(" ");
        name = name.substring(0,spaceSpot) + sp + name.substring(spaceSpot+1);
    }

    try{
        const link = `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`;
        const response = await fetch(link,{headers: {'X-Riot-Token' : riotKey}});
        let data = response.json();
        return data;
    } catch(err){
        throw err;
    }
}

async function getMatchList(puuid){
    try{
        var start = 0;
        var data = [];
        while(true){
            const link = `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=100`;
            const response = await fetch(link,{headers: {'X-Riot-Token' : riotKey}});
            let newData = await response.json();
            if(newData.status){
                console.log(newData.status.message);
                process.exit(1);
            }
            if(newData.length != 0){
                for(var i = 0; i < newData.length;i++){
                    data.push(newData[i]);
                }
                start += 100;
            } else {
                return data;
            }
        }
    } catch (err){
        throw err;
    }
}
async function rankedTogether(matchList, duoPuuid){
    try{
        let allGames = 0;
        let missedGames = 0;
        let gameCount = 0;
        let count = 0
        let win = 0;
        let loss = 0;
        for(let i = 0; i < matchList.length;i++){
            //wait 2 minutes for the api rate limit
            if(i % 100 == 0){
                console.log('waiting');
                await sleep(120000);
            }
            count++;
            let matchID = matchList[i];
            const link = `https://americas.api.riotgames.com/lol/match/v5/matches/${matchID}`;
            const response = await fetch(link,{headers: {'X-Riot-Token' : riotKey}});
            let data = await response.json();
            console.log("games checked: " + count);
            if(data.status){
                console.log('missed game');
                missedGames++;
                continue;
            } 
            if(data.info.gameVersion.substring(0,2) != 11){
                console.log("Season 10 game: " + data.info.gameId);
                break;
            }
            for(var j = 0; j < data.metadata.participants.length; j++){
                if(duoPuuid == data.metadata.participants[j]){
                    allGames++;
                }
                if(duoPuuid == data.metadata.participants[j] &&
                    data.info.queueId == 420){
                    gameCount++;
                    if(j < 5){
                        if(data.info.teams[0].win){
                            console.log("game id: " + data.info.gameId + " won");
                            win++;
                        } else {
                            console.log("game id: " + data.info.gameId + " loss");
                            loss++;
                        }
                    } else {
                        if(data.info.teams[1].win){
                            console.log("game id: " + data.info.gameId + " won");
                            win++;
                        } else {
                            console.log("game id: " + data.info.gameId + " loss");
                            loss++;
                        }
                    }
                }
            }
        }
        console.log('wins: ' + win);
        console.log('losses: ' + loss);
        console.log('Games played: ' + gameCount);
        console.log('All games played: ' + allGames);
        console.log('win rate = ' + win/gameCount);
        return gameCount;
    } catch (err) {
        throw err;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
