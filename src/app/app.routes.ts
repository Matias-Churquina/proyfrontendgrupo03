import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
    {path: '',redirectTo: 'Home',pathMatch: 'full' },
    {path: '**',redirectTo: 'Home'},
    {path: 'Home', component: Home},
];
