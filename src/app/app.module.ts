import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { PlayerSortPipe } from './player-sort.pipe';
import { SlicePipe } from './slice.pipe';

@NgModule({
  declarations: [
    AppComponent,
    PlayerSortPipe,
    SlicePipe
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
