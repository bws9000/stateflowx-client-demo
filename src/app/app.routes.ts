import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'weather',
    pathMatch: 'full',
  },
  {
    path: 'weather',
    loadComponent: () =>
      import('./features/weather/weather.component').then(
        (m) => m.WeatherComponent,
      ),
  },
  // {
  //   path: 'chat',
  //   loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
  // }
];
