import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './Components/home/home.component';
import { LogInComponent } from './Components/log-in/log-in.component';
import { AuthCallbackComponentComponent } from './Components/auth-callback-component/auth-callback-component.component';
import { LayoutComponent } from './Components/layout/layout.component';
import { NewLayoutComponent } from './Components/new-layout/new-layout.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login',
    component: LogInComponent
  },
  { 
    path: 'auth/callback',
    component: AuthCallbackComponentComponent 
  },
  { 
    path: 'host-layout',
    component: LayoutComponent 
  },
  { 
    path: 'new-layout',
    component: NewLayoutComponent 
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
