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
  players: { _id: string, attack: number, wins: number, icon: string, name: string }[] = []
  quarterFinalists: { health: number, _id: string, icon: string, name: string, attack: number }[] = []
  semiFinalists: { health: number, _id: string, icon: string, name: string, attack: number }[] = []
  finalists: { health: number, _id: string, icon: string, name: string, attack: number }[] = []
  champion: { name: string, icon: string, _id: string }
  socket: any
  headers: Headers
  currentBracket: number = 0
  animations: any[] = []
  currentGame: { player1: string, player2: string }
  hitSound = new Audio('/assets/hit.m4a')
  missSound = new Audio('/assets/miss.m4a')
  healSound = new Audio('/assets/heal.m4a')
  winnerSound = new Audio('/assets/winner.m4a')

  constructor(private http: Http, private sanitizer: DomSanitizer) {
    for (let i = 1; i < 5; i++) {
      this.semiFinalists.push({
        _id: `semiFinalist${i}`,
        name: `Semi Finalist ${i}`,
        icon: "/assets/26d4.png",
        health: 0,
        attack: 0
      })
    }
    for (let i = 1; i < 3; i++) {
      this.finalists.push({
        _id: `finalist${i}`,
        name: `Finalist ${i}`,
        icon: "/assets/26d4.png",
        health: 0,
        attack: 0
      })
    }
    this.champion = {
      _id: "champion",
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
          this.players.slice(0,8).forEach((player) => {
            this.quarterFinalists.push({
              _id: player._id,
              name: player.name,
              health: 100,
              attack: 0,
              icon: player.icon
            })
          })
          this.round = "qf"
          break;
        case "semi finals":
          this.round = "sf"
          break;
        case "finals":
          this.round = "f"
          break;
      }
    })
    this.socket.on('start game', function(gameId) {
      this.getGame(gameId.id)
        .then((game: { player1: string, player2: string }) => {
          this.currentGame = game
        })
    }.bind(this))
    this.socket.on('move played', function (move) {
      if (move.result !== "heal" && move.result !== "miss" && this.round === "rr") {
        this.players.filter((player) => player._id === move.player)[0].attack += move.value
      }
      if (this.round !== "rr") {
        this.animations.push(move)
      }
    }.bind(this));
    this.socket.on('game over', function (gameData) {
      if(this.round === "rr") {
        this.players.filter((player) => player._id === gameData.game.winner)[0].wins += 1
        if (gameData.winningMove && gameData.winningMove.action === "attack") {
          this.players.filter((player) => player._id === gameData.winningMove.player)[0].attack += gameData.winningMove.value
        }
      } else {
        this.animations.push(gameData.winningMove)
        this.animations.push(gameData.game)
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

  gameOver(game) {
    switch (this.round) {
      case "qf":
        let quarterFinalWinner: { _id: string, icon: string, name: string, health: number, attack: number } = this.quarterFinalists.filter((player) => player._id === game.winner)[0]
        $(`#winner-${this.round}-${quarterFinalWinner._id}`).show()
        quarterFinalWinner = {
          _id: quarterFinalWinner._id,
          icon: quarterFinalWinner.icon,
          name: quarterFinalWinner.name,
          health: 100,
          attack: 0
        }
        this.semiFinalists.splice(this.currentBracket, 1, quarterFinalWinner)
        this.currentBracket += 1
        break;
      case "sf":
        let semiFinalWinner: { _id: string, icon: string, name: string, health: number, attack: number } = this.semiFinalists.filter((player) => player._id === game.winner)[0]
        $(`#winner-${this.round}-${semiFinalWinner._id}`).show()
        semiFinalWinner = {
          _id: semiFinalWinner._id,
          icon: semiFinalWinner.icon,
          name: semiFinalWinner.name,
          health: 100,
          attack: 0
        }
        this.finalists.splice(this.currentBracket - 4, 1, semiFinalWinner)
        this.currentBracket += 1
        break;
      case "f":
        this.champion = this.players.filter((player) => player._id === game.winner)[0]
        $(`#winner-${this.round}-${this.champion._id}`).show()
        break;
    }
    this.winnerSound.play()
  }

  showAnimation() {
    if (this.animations && this.animations.length > 0) {
      let move = this.animations.shift()
      if (move.winner) {
        // move is not in fact a move, but a game, indicating a game over
        this.gameOver(move)
        return
      }
      let selector = "img#"
      let sound
      let group
      switch (this.round) {
        case "qf":
          group = this.quarterFinalists
          break;
        case "sf":
          group = this.semiFinalists
          break;
        case "f":
          group = this.finalists
          break;
      }
      switch (move.result) {
        case "heal":
          selector += "heal-"
          sound = this.healSound
          let healedPlayer = move.player === this.currentGame.player1 ? this.currentGame.player1 : this.currentGame.player2
          group.filter((player) => player._id === healedPlayer)[0].health += move.value
          break;
        case "miss":
          selector += "miss-"
          sound = this.missSound
          break;
        default:
          selector += "hit-"
          sound = this.hitSound
          let hitPlayer = move.player === this.currentGame.player1 ? this.currentGame.player2 : this.currentGame.player1
          group.filter((player) => player._id === move.player)[0].attack += move.value
          group.filter((player) => player._id === hitPlayer)[0].health -= move.value
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

  addPlayer(player) {
    player.wins = 0
    player.attack = 0

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
