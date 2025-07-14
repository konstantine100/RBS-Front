import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LogInComponent } from './Components/log-in/log-in.component';
import { HomeComponent } from './Components/home/home.component';
import { AuthCallbackComponentComponent } from './Components/auth-callback-component/auth-callback-component.component';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from './Components/layout/layout.component';
import { NewLayoutComponent } from './Components/new-layout/new-layout.component';

@NgModule({
  declarations: [
    AppComponent,
    LogInComponent,
    HomeComponent,
    AuthCallbackComponentComponent,
    LayoutComponent,
    NewLayoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
