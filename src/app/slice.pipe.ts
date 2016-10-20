import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'slice',
  pure: false
})
export class SlicePipe implements PipeTransform {

  transform(array: Array<any>, start:number,end:number): Array<any> {
    return array.slice(start, end);
  }

}
