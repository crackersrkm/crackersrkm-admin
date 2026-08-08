import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row font-sans">
      
      <!-- Left Sidebar for Desktop -->
      <aside class="hidden md:flex flex-col w-64 bg-slate-900/60 backdrop-blur-xl border-r border-white/5 p-6 space-y-8 z-20 shrink-0">
        <!-- Brand Header -->
        <div class="flex items-center gap-3">
          <img src="/rkm-badge.svg" alt="RKM Logo" class="w-10 h-10 object-contain shadow shadow-orange-500/10" />
          <div>
            <h1 class="text-lg font-bold bg-gradient-to-r from-orange-400 to-violet-400 bg-clip-text text-transparent">RKM Crackers</h1>
            <p class="text-xs text-slate-500 font-semibold tracking-wider uppercase">Billing & Stock</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 space-y-2">
          <a
            routerLink="/products"
            routerLinkActive="bg-white/10 text-white border-l-4 border-orange-500"
            class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <span>📦</span>
            <span class="font-semibold text-sm">Products</span>
          </a>
          
          <a
            routerLink="/bills"
            routerLinkActive="bg-white/10 text-white border-l-4 border-orange-500"
            class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <span>🧾</span>
            <span class="font-semibold text-sm">Invoices & Billing</span>
          </a>

          <a
            routerLink="/reports"
            routerLinkActive="bg-white/10 text-white border-l-4 border-orange-500"
            class="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
          >
            <span>📊</span>
            <span class="font-semibold text-sm">Reports</span>
          </a>
        </nav>

        <!-- User Profile Card -->
        @if (authService.currentUser(); as user) {
          <div class="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3 relative overflow-hidden group">
            <div class="w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300">
              {{ user.firstName[0] }}{{ user.lastName[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate">{{ user.name }}</p>
              <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide">
                {{ user.userType }}
              </span>
            </div>
            <!-- Logout Button -->
            <button
              (click)="onLogout()"
              title="Logout"
              class="text-slate-400 hover:text-red-500 p-1.5 hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
              </svg>
            </button>
          </div>
        }
      </aside>

      <!-- Mobile Top Navigation Header -->
      <header class="md:hidden flex items-center justify-between bg-slate-900 border-b border-white/5 px-4 py-3.5 z-20">
        <div class="flex items-center gap-2">
          <img src="/rkm-badge.svg" alt="RKM Logo" class="w-8 h-8 object-contain" />
          <span class="font-bold text-md text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-violet-400">RKM Crackers</span>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/products" routerLinkActive="text-orange-400 font-semibold" class="text-sm text-slate-400 hover:text-white">Products</a>
          <a routerLink="/bills" routerLinkActive="text-orange-400 font-semibold" class="text-sm text-slate-400 hover:text-white">Bills</a>
          <a routerLink="/reports" routerLinkActive="text-orange-400 font-semibold" class="text-sm text-slate-400 hover:text-white">Reports</a>
          <button
            (click)="onLogout()"
            title="Logout"
            class="text-slate-400 hover:text-red-500 p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Main Content Outlet Area -->
      <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div class="p-6 md:p-10 max-w-7xl w-full mx-auto space-y-6">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class LayoutComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  onLogout(): void {
    this.authService.logout();
  }
}
