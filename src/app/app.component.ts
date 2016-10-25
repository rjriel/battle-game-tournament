import {Component} from '@angular/core'
import * as io from 'socket.io-client'
import {Http, Headers} from '@angular/http'
import {DomSanitizer} from '@angular/platform-browser'
import * as $ from "jquery"

let emojis = ["1f40a", "1f40b", "1f40c", "1f40d", "1f40e", "1f40f", "1f41a", "1f41b", "1f41c", "1f41d", "1f41e", "1f41f", "1f42a", "1f42b", "1f42c", "1f42d", "1f42e", "1f42f", "1f43a", "1f43b", "1f43c"]

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title: string = "Qlikémon"
  round: string = "registering"
  players: { health: number, _id: string, attack: number, wins: number }[] = []
  semiFinalists: Object[] = []
  finalists: Object[] = []
  champion: Object
  socket: any
  headers: Headers
  currentBracket: number = 0
  animations: { action: string, value: number, result: string, player: string }[] = []
  currentGame: { player1: string, player2: string }
  hitSound = new Audio('/assets/hit.m4a')
  missSound = new Audio('/assets/miss.m4a')
  healSound = new Audio('/assets/heal.m4a')

  constructor(private http: Http, private sanitizer: DomSanitizer) {
    for (let i = 1; i < 5; i++) {
      this.semiFinalists.push({
        name: `Semi Finalist ${i}`,
        icon: "/assets/26d4.png"
      })
    }
    for (let i = 1; i < 3; i++) {
      this.finalists.push({
        name: `Finalist ${i}`,
        icon: "/assets/26d4.png"
      })
    }
    this.champion = {
      name: 'Champion',
      icon: "/assets/26d4.png"
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
    this.socket.on('new round', (round) => {
      switch (round) {
        case "round robin":
          this.round = "rr"
          break;
        case "quarter finals":
          this.round = "qf"
          break;
        case "semi finals":
          this.round = "sf"
          break;
        case "finals":
          this.round = "f"
          break;
      }
      this.players.forEach((player) => {
        player.health = 100
      })
    })
    this.socket.on('start game', (gameId) => {
      this.getGame(gameId.id)
        .then((game: { player1: string, player2: string }) => {
          this.currentGame = game
        })
    })
    this.socket.on('move played', function (move) {
      if (move.result !== "heal" && move.result !== "miss" && this.round === "rr") {
        this.players.filter((player) => player._id === move.player)[0].attack += move.value
      }
      if (this.round !== "rr") {
        this.animations.push(move)
      }
    }.bind(this));
    this.socket.on('game over', function (gameData) {
      switch (this.round) {
        case "rr":
          this.players.filter((player) => player._id === gameData.game.winner)[0].wins += 1
          if (gameData.winningMove && gameData.winningMove.action === "attack") {
            this.players.filter((player) => player._id === gameData.winningMove.player)[0].attack += gameData.winningMove.value
          }
          break;
        case "qf":
          let quarterFinalWinner = this.players.filter((player) => player._id === gameData.game.winner)[0]
          this.semiFinalists.splice(this.currentBracket, 1, quarterFinalWinner)
          this.currentBracket += 1
          break;
        case "sf":
          let semiFinalWinner = this.players.filter((player) => player._id === gameData.game.winner)[0]
          this.finalists.splice(this.currentBracket - 4, 1, semiFinalWinner)
          this.currentBracket += 1
          break;
        case "f":
          this.champion = this.players.filter((player) => player._id === gameData.game.winner)[0]
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

    setInterval(this.showAnimation.bind(this), 500)
  }

  showAnimation() {
    if (this.animations && this.animations.length > 0) {
      let move = this.animations.shift()
      let selector = "img#"
      let sound
      switch (move.result) {
        case "heal":
          selector += "heal-"
          sound = this.healSound
          let healedPlayer = move.player === this.currentGame.player1 ? this.currentGame.player1 : this.currentGame.player2
          this.players.filter((player) => player._id === healedPlayer)[0].health += move.value
          break;
        case "miss":
          selector += "miss-"
          sound = this.missSound
          break;
        default:
          selector += "hit-"
          sound = this.hitSound
          let hitPlayer = move.player === this.currentGame.player1 ? this.currentGame.player2 : this.currentGame.player1
          this.players.filter((player) => player._id === hitPlayer)[0].health -= move.value
          break;
      }
      selector += `${this.round}-`
      let isPlayer1 = (move.player === this.currentGame.player2 && move.action === "attack") || (move.player === this.currentGame.player1 && move.action === "heal")
      selector += isPlayer1 ? this.currentGame.player1 : this.currentGame.player2
      let animationElement = $(selector)
      animationElement.show()
      sound.play()
      setTimeout(() => {
        animationElement.hide()
      }, 250)
    }
  }

  moveThem() {
    this.round = "qf"
  }

  addPlayer(player) {
    player.wins = 0
    player.attack = 0
    player.health = 0

    let icon = emojis.splice(Math.floor(Math.random() * emojis.length), 1)
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

  getGame(gameId) {
    return new Promise((resolve, reject) => {
      let url = `http://localhost:8080/games/${gameId}`

      this.http.get(url, {headers: this.headers})
        .subscribe(
          game => resolve(game.json()),
          error => console.log("getGame Error", error)
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
