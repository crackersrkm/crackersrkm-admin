import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <!-- Background Decorative Lights -->
      <div class="absolute w-96 h-96 rounded-full bg-violet-600/20 blur-3xl -top-12 -left-12 animate-pulse"></div>
      <div class="absolute w-96 h-96 rounded-full bg-orange-500/20 blur-3xl -bottom-12 -right-12 animate-pulse" style="animation-delay: 2s"></div>

      <!-- Login Card Container -->
      <div class="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        <!-- Logo Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-orange-500/10 mb-4">
            <img src="/rkm-badge.svg" alt="RKM Logo" class="w-full h-full object-contain" />
          </div>
          <h2 class="text-3xl font-extrabold bg-gradient-to-r from-orange-400 via-pink-500 to-violet-400 bg-clip-text text-transparent">
            RKM Crackers
          </h2>
          <p class="text-slate-400 mt-2 text-sm">Sign in to manage inventory & sales</p>
        </div>

        <!-- Feedback Messages -->
        @if (errorMsg()) {
          <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <span>⚠️</span> {{ errorMsg() }}
          </div>
        }
        @if (successMsg()) {
          <div class="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <span>✅</span> {{ successMsg() }}
          </div>
        }

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="space-y-6">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
            <div class="relative">
              <span class="absolute left-4 top-3.5 text-slate-400 text-sm">📧</span>
              <input
                type="email"
                name="email"
                [(ngModel)]="email"
                required
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
                #emailRef="ngModel"
                placeholder="crackersadmin@gmail.com"
                [class.border-red-500]="emailRef.invalid && emailRef.touched"
                class="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300"
              />
            </div>
            @if (emailRef.invalid && emailRef.touched) {
              <span class="text-[10px] text-red-400 mt-1 block">Please enter a valid email address.</span>
            }
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <div class="relative">
              <span class="absolute left-4 top-3.5 text-slate-400 text-sm">🔑</span>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                name="password"
                [(ngModel)]="password"
                required
                placeholder="••••••••"
                class="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300"
              />
              <button
                type="button"
                (click)="showPassword.set(!showPassword())"
                class="absolute right-4 top-3.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                @if (showPassword()) {
                  <!-- Eye Open Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                } @else {
                  <!-- Eye Closed Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                }
              </button>
            </div>
          </div>

          <button
            type="submit"
            [disabled]="loading() || !loginForm.valid"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:from-orange-600 hover:to-violet-700 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            @if (loading()) {
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing In...</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>

        <!-- Redirect to Signup -->
        <div class="mt-8 text-center text-sm text-slate-400">
          New to the panel? 
          <a routerLink="/signup" class="text-orange-400 font-semibold hover:underline hover:text-orange-300 transition-colors ml-1">
            Create Account
          </a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  
  showPassword = signal(false);
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password) return;

    this.loading.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.successMsg.set('Login successful! Redirecting...');
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 800);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }
}
