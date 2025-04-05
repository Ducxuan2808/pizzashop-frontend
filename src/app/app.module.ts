import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HomeComponent } from './home/home.component';
import { HeaderComponent } from './header/header.component';



@NgModule({
  declarations: [
    HomeComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
  ],
  providers: [],
  bootstrap: [HomeComponent]
})
export class AppModule { }
