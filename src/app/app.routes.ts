import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { RegistrarUsuario } from './pages/registrar-usuario/registrar-usuario';
import { Login } from './pages/login/login';
import { ChoferPage } from './pages/chofer/chofer';
import { PasajeroPage } from './pages/pasajero/pasajero';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { AdminPage } from './pages/admin/admin';


export const routes: Routes = [
    { path: '', redirectTo: 'Home', pathMatch: 'full' },
    
    { path: 'Home', component: Home },

    { path: 'home', component: Home },
    
    { path: 'registro', component: RegistrarUsuario },

    {path: 'login', component: Login},

    { path: 'chofer', component: ChoferPage },

    { path: 'pasajero', component: PasajeroPage },

    { path: 'admin', component: AdminPage },

    { path: 'admin/dashboard', component: AdminDashboard },
    
    { path: '**', redirectTo: 'Home' }
];
