import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { LayoutComponent } from './components/layout/layout.component';
import { ProductsComponent } from './components/products/products.component';
import { BillsComponent } from './components/bills/bills.component';
import { ReportsComponent } from './components/reports/reports.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'products', component: ProductsComponent },
      { path: 'bills', component: BillsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: '', redirectTo: 'products', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'products' }
];
