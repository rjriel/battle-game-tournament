import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'playerSort',
  pure: false
})
export class PlayerSortPipe implements PipeTransform {

  transform(array: Array<any>, args: string): Array<any> {
    array.sort((a: any, b: any) => {
      if (a.wins < b.wins) {
        return 1
      } else if (a.wins > b.wins) {
        return -1
      } else if (a.attack < b.attack) {
        return 1
      } else if (a.attack > b.attack) {
        return -1
      } else if (a.name > b.name) {
        return 1
      } else if (a.name < b.name) {
        return -1
      } else {
        return 0
      }
    })
    return array;
  }
}
