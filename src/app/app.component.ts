import {Component} from '@angular/core'
import * as io from 'socket.io-client'
import {Http, Headers} from '@angular/http'
import {DomSanitizer} from '@angular/platform-browser'

let colors = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","DarkOrange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","RebeccaPurple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"]
let directions = ["bottom", "bottom left", "bottom right", "top", "top left", "top right", "left", "right"]

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title: string = "Qlikémon"
  players: Object[] = []
  socket: any
  headers: Headers

  constructor(private http: Http, private sanitizer: DomSanitizer) {
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
    this.socket.on('move played', function (move) {
      if (move.action === "attack" && move.result != "miss") {
        this.players.filter((player) => player._id === move.player)[0].attack += move.value
      }
    }.bind(this));
    this.socket.on('game over', function (game) {
      this.players.filter((player) => player._id === game.winner)[0].wins += 1
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

  addPlayer(player) {
    player.wins = 0
    player.attack = 0

    let look = {
      direction: directions[Math.floor(Math.random() * directions.length)],
      firstColor: colors[Math.floor(Math.random() * colors.length)],
      secondColor: colors[Math.floor(Math.random() * colors.length)],
      thirdColor: colors[Math.floor(Math.random() * colors.length)]
    }
    player.background = this.sanitizer.bypassSecurityTrustStyle(`linear-gradient(to ${look.direction}, ${look.firstColor}, ${look.secondColor}, ${look.thirdColor})`)
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
