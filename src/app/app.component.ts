import {Component} from '@angular/core'
import * as io from 'socket.io-client'
import {Http, Headers} from '@angular/http'
import {DomSanitizer} from '@angular/platform-browser'
import * as $ from "jquery"

let emojis = ["1f40a","1f40b","1f40c","1f40d","1f40e","1f40f","1f41a","1f41b","1f41c","1f41d","1f41e","1f41f","1f42a","1f42b","1f42c","1f42d","1f42e","1f42f","1f43a","1f43b","1f43c"]

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title: string = "Qlikémon"
  round: string = "registering..."
  players: Object[] = []
  semiFinalists: Object[] = []
  finalists: Object[] = []
  champion: Object
  socket: any
  headers: Headers

  constructor(private http: Http, private sanitizer: DomSanitizer) {
    for(let i = 1; i < 5; i++) {
      this.semiFinalists.push({
        name: `Semi Finalist ${i}`,
        background: sanitizer.bypassSecurityTrustStyle("white")
      })
    }
    for(let i = 1; i < 3; i++) {
      this.finalists.push({
        name: `Finalist ${i}`,
        background: sanitizer.bypassSecurityTrustStyle("white")
      })
    }
    this.champion = {
      name: 'Champion',
      background: sanitizer.bypassSecurityTrustStyle("white")
    }
    let id: string = '4a3147ff-e299-401e-8c80-fe2d8247855e';
    let secret: string = 'b3409604-08a6-4854-892d-41bcead8c823';
    let socketArguments = `apiId=${id}&apiSecret=${secret}`;
    let apiKey = new Buffer(`${id}:${secret}`).toString('base64')
    this.headers = new Headers()
    this.headers.append("Authorization", `Basic ${apiKey}`)
    this.headers.append("Content-Type", "application/json")
    this.socket = io('http://localhost:3000', {query: socketArguments});
    this.socket.on("success", function (player) {

    }.bind(this));
    this.socket.on('player connected', function (player) {
      this.getPlayer(player.id)
        .then((playerData) => {
          this.addPlayer(playerData)

        })
    }.bind(this));
    this.socket.on('player disconnected', function (player) {
      for (let i = 0; i < this.players.length; i++) {
        if (this.players[i]._id === player.id) {
          this.players.splice(i)
          break;
        }
      }
    }.bind(this));
    this.socket.on('new round',(round) => {
      this.round = round
    })
    this.socket.on('move played', function (move) {
      if (move.action === "attack" && move.result != "miss") {
        this.players.filter((player) => player._id === move.player)[0].attack += move.value
      }
    }.bind(this));
    this.socket.on('game over', function (game) {
      switch(this.round) {
        case "round robin":
          this.players.filter((player) => player._id === game.winner)[0].wins += 1
          break;
        case "quarter finals":
          let quarterFinalWinner = this.players.filter((player) => player._id === game.winner)[0]
          this.semiFinalists.shift()
          break;
        case "semi finals":
          break;
        case "finals":
          break;
      }
    }.bind(this));
    this.socket.on('invalid', function (error) {
      console.log("ERROR", error);
    }.bind(this));
    this.getActivePlayers()
      .then((players: any[]) => {
        players.filter((player) => player.role === "player").forEach((player) => {
          this.addPlayer(player)
        })
      })
  }

  moveThem() {
    $(".rr-top-8").toggleClass("quarter");
  }

  addPlayer(player) {
    player.wins = 0
    player.attack = 0

    let icon =  emojis.splice(Math.floor(Math.random() * emojis.length),1)
    player.icon = `/assets/${icon}.png`
    this.players.push(player)
  }

  getPlayer(playerId) {
    return new Promise((resolve, reject) => {
      let url = `http://localhost:8080/players/${playerId}`

      this.http.get(url, {headers: this.headers})
        .subscribe(
          player => resolve(player.json()),
          error => console.log("getPlayer Error", error)
        )
    })
  }

  getActivePlayers() {
    return new Promise((resolve, reject) => {
      let url = `http://localhost:8080/players/active`

      this.http.get(url, {headers: this.headers})
        .subscribe(
          players => resolve(players.json()),
          error => console.log("getPlayers Error", error)
        )
    })
  }
}
