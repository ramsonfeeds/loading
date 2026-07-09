import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dispatch/dispatch-shell.component').then(component => component.DispatchShellComponent)
  },
  {
    path: 'products',
    loadComponent: () => import('./features/products/product-master.component').then(component => component.ProductMasterComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
