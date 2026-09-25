import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top Title and Stats Grid -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Products Catalog</h2>
          <p class="text-slate-400 text-sm mt-1">Manage crackers inventory, pricing, and stock levels.</p>
        </div>
        
        <!-- Add Product Trigger (Admin Only) -->
        @if (authService.isAdmin()) {
          <button
            (click)="openAddModal()"
            class="px-5 py-3 bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:from-orange-600 hover:to-violet-700 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span>➕</span> Add Product
          </button>
        }
      </div>

      <!-- Inventory Alert/Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl">
            📦
          </div>
          <div>
            <p class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Items</p>
            <h3 class="text-2xl font-bold text-white mt-1">{{ totalProductsCount() }}</h3>
          </div>
        </div>
        
        <div class="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xl">
            ⚠️
          </div>
          <div>
            <p class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Low Stock items</p>
            <h3 class="text-2xl font-bold text-white mt-1">{{ lowStockCount() }}</h3>
          </div>
        </div>
        
        <div class="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl">
            🚨
          </div>
          <div>
            <p class="text-slate-400 text-xs font-semibold uppercase tracking-wider">Out of Stock</p>
            <h3 class="text-2xl font-bold text-white mt-1">{{ outOfStockCount() }}</h3>
          </div>
        </div>
      </div>

      <!-- Filters & Search Bar -->
      <div class="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <span class="absolute left-4 top-3 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search products by name..."
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            class="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all duration-300"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-slate-400 text-xs font-semibold uppercase">Filter Stock Status:</span>
          <div class="relative min-w-[150px]">
            <button
              type="button"
              (click)="showFilterDropdown.set(!showFilterDropdown())"
              (blur)="hideFilterDropdownWithDelay()"
              class="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 text-left flex items-center justify-between focus:outline-none focus:border-orange-500 cursor-pointer font-sans"
            >
              <span>{{ getStockFilterLabel(stockFilter) }}</span>
              <span class="text-xs text-slate-400">▼</span>
            </button>
            @if (showFilterDropdown()) {
              <div class="absolute right-0 z-30 mt-1 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 space-y-1">
                <button
                  type="button"
                  (mousedown)="setStockFilter('all')"
                  class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                >
                  All Inventory
                </button>
                <button
                  type="button"
                  (mousedown)="setStockFilter('instock')"
                  class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                >
                  In Stock
                </button>
                <button
                  type="button"
                  (mousedown)="setStockFilter('low')"
                  class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                >
                  Low Stock
                </button>
                <button
                  type="button"
                  (mousedown)="setStockFilter('out')"
                  class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                >
                  Out of Stock
                </button>
                <button
                  type="button"
                  (mousedown)="setStockFilter('inactive')"
                  class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                >
                  Inactive
                </button>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Products Table View (Glassmorphism design) -->
      <div class="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-white/10 bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th class="py-4 px-6">Product ID</th>
                <th class="py-4 px-6">Product Name</th>
                <th class="py-4 px-6 text-right">Price (₹)</th>
                <th class="py-4 px-6 text-center">Stock Level</th>
                <th class="py-4 px-6 text-center">Status</th>
                @if (authService.isAdmin()) {
                  <th class="py-4 px-6 text-center">Actions</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    Loading product catalog...
                  </td>
                </tr>
              } @else if (productsList().length === 0) {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              } @else {
                @for (prod of productsList(); track prod.id) {
                  <tr class="hover:bg-white/5 transition-colors duration-150">
                    <td class="py-4 px-6 font-mono text-xs text-slate-400">{{ prod.id }}</td>
                    <td class="py-4 px-6 font-semibold text-white">{{ prod.name }}</td>
                    <td class="py-4 px-6 text-right font-semibold text-slate-200">₹{{ prod.price | number:'1.2-2' }}</td>
                    
                    <!-- Stock Indicators -->
                    <td class="py-4 px-6 text-center">
                      @if (prod.stockQuantity <= 0) {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          🔴 Out of Stock (0)
                        </span>
                      } @else if (prod.stockQuantity < 20) {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          🟡 Low Stock ({{ prod.stockQuantity }})
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          🟢 In Stock ({{ prod.stockQuantity }})
                        </span>
                      }
                    </td>

                    <!-- Status -->
                    <td class="py-4 px-6 text-center">
                      @if (prod.isActive) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                          Inactive
                        </span>
                      }
                    </td>

                    <!-- Actions -->
                    @if (authService.isAdmin()) {
                      <td class="py-4 px-6 text-center">
                        <div class="flex items-center justify-center gap-2">
                          <button
                            (click)="openEditModal(prod)"
                            title="Edit Product"
                            class="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:text-orange-400 hover:border-orange-500/30 transition-all duration-200 cursor-pointer"
                          >
                            ✏️
                          </button>
                          <button
                            (click)="toggleStatus(prod)"
                            [title]="prod.isActive ? 'Deactivate/Archive' : 'Activate'"
                            class="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:text-violet-400 hover:border-violet-500/30 transition-all duration-200 cursor-pointer"
                          >
                            {{ prod.isActive ? '🛑' : '✅' }}
                          </button>
                        </div>
                      </td>
                    }
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination controls footer -->
        <div class="px-6 py-4 border-t border-white/5 flex items-center justify-between flex-wrap gap-4 bg-slate-900/40">
          <div class="text-sm text-slate-400">
            {{ showingText() }}
          </div>
          <div class="flex items-center gap-2">
            <button
              [disabled]="pageIndex() === 0"
              (click)="goToPage(pageIndex() - 1)"
              class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-sans"
            >
              Previous
            </button>
            <div class="text-xs text-slate-400 px-2 font-medium">
              Page {{ pageIndex() + 1 }} of {{ totalPages() }}
            </div>
            <button
              [disabled]="pageIndex() + 1 >= totalPages()"
              (click)="goToPage(pageIndex() + 1)"
              class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer font-sans"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Product Modal Dialog -->
      @if (showModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop overlay -->
          <div (click)="closeModal()" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          
          <!-- Modal box -->
          <div class="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl z-10 text-white">
            <h3 class="text-xl font-bold mb-4">
              {{ editingProduct() ? 'Update Product Details' : 'Create New Product' }}
            </h3>
            
            @if (modalError()) {
              <div class="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {{ modalError() }}
              </div>
            }

            <form (ngSubmit)="saveProduct()" #prodForm="ngForm" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Product Name</label>
                <input
                  type="text"
                  name="name"
                  [(ngModel)]="formProduct.name"
                  required
                  placeholder="Flower Pots (Large)"
                  class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all duration-300"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    [(ngModel)]="formProduct.price"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="250.00"
                    class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    [(ngModel)]="formProduct.stockQuantity"
                    required
                    min="0"
                    placeholder="100"
                    class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all duration-300"
                  />
                </div>
              </div>

              <!-- Active Status checkbox -->
              <div class="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="isActiveCheckbox"
                  name="isActive"
                  [(ngModel)]="formProduct.isActive"
                  class="w-4 h-4 rounded bg-slate-900 border-white/10 text-orange-500 focus:ring-orange-500"
                />
                <label for="isActiveCheckbox" class="text-sm text-slate-300 select-none">Active / Available in Catalog</label>
              </div>

              <!-- Modal Buttons -->
              <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!prodForm.valid"
                  class="px-5 py-2 bg-gradient-to-r from-orange-500 to-violet-600 font-bold rounded-xl text-sm transition-all hover:opacity-90 disabled:opacity-50"
                >
                  {{ editingProduct() ? 'Update' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  protected readonly authService = inject(AuthService);

  // Core component state signals
  productsList = signal<any[]>([]);
  totalCount = signal<number>(0);
  loading = signal(false);

  // Pagination state signals
  pageIndex = signal<number>(0);
  pageSize = 10;

  totalPages = computed(() => {
    return Math.ceil(this.totalCount() / this.pageSize) || 1;
  });

  showingText = computed(() => {
    const total = this.totalCount();
    if (total === 0) return '0 products';
    const start = this.pageIndex() * this.pageSize + 1;
    const end = Math.min((this.pageIndex() + 1) * this.pageSize, total);
    return `Showing ${start}-${end} of ${total} products`;
  });

  // Stats signals
  totalProductsCount = signal(0);
  lowStockCount = signal(0);
  outOfStockCount = signal(0);

  // Search and Filter variables
  searchQuery = '';
  stockFilter = 'all';
  showFilterDropdown = signal(false);

  getStockFilterLabel(val: string): string {
    if (val === 'all') return 'All Inventory';
    if (val === 'instock') return 'In Stock';
    if (val === 'low') return 'Low Stock';
    if (val === 'out') return 'Out of Stock';
    if (val === 'inactive') return 'Inactive';
    return val;
  }

  setStockFilter(val: string): void {
    this.stockFilter = val;
    this.showFilterDropdown.set(false);
    this.pageIndex.set(0);
    this.loadCatalog();
  }

  hideFilterDropdownWithDelay(): void {
    setTimeout(() => {
      this.showFilterDropdown.set(false);
    }, 200);
  }

  // Modal signals
  showModal = signal(false);
  editingProduct = signal<any | null>(null);
  modalError = signal<string | null>(null);

  // Form backup object
  formProduct = {
    name: '',
    price: 0,
    stockQuantity: 0,
    isActive: true
  };

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.loading.set(true);
    const offset = this.pageIndex() * this.pageSize;
    this.productService.getProducts(this.pageSize, offset, this.searchQuery, this.stockFilter).subscribe({
      next: (res) => {
        const prods = Array.isArray(res) ? res : res.data || [];
        const total = res.total !== undefined ? res.total : prods.length;
        this.productsList.set(prods);
        this.totalCount.set(total);
        if (res.totalProductsCount !== undefined) {
          this.totalProductsCount.set(res.totalProductsCount);
        } else {
          this.totalProductsCount.set(total);
        }
        if (res.lowStockCount !== undefined) {
          this.lowStockCount.set(res.lowStockCount);
        }
        if (res.outOfStockCount !== undefined) {
          this.outOfStockCount.set(res.outOfStockCount);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  goToPage(idx: number): void {
    if (idx < 0 || idx >= this.totalPages()) return;
    this.pageIndex.set(idx);
    this.loadCatalog();
  }

  onSearch(): void {
    this.pageIndex.set(0);
    this.loadCatalog();
  }

  onFilterChange(): void {
    this.pageIndex.set(0);
    this.loadCatalog();
  }

  // Modals management
  openAddModal(): void {
    this.editingProduct.set(null);
    this.modalError.set(null);
    this.formProduct = {
      name: '',
      price: 0,
      stockQuantity: 0,
      isActive: true
    };
    this.showModal.set(true);
  }

  openEditModal(prod: any): void {
    this.editingProduct.set(prod);
    this.modalError.set(null);
    this.formProduct = {
      name: prod.name,
      price: prod.price,
      stockQuantity: prod.stockQuantity,
      isActive: prod.isActive
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
  }

  saveProduct(): void {
    if (this.formProduct.price <= 0) {
      this.modalError.set('Price must be greater than 0.');
      return;
    }
    if (this.formProduct.stockQuantity < 0) {
      this.modalError.set('Stock Quantity cannot be negative.');
      return;
    }

    const requestData = {
      name: this.formProduct.name,
      price: Number(this.formProduct.price),
      stockQuantity: Number(this.formProduct.stockQuantity),
      isActive: this.formProduct.isActive
    };

    const editProd = this.editingProduct();
    if (editProd) {
      // Update
      this.productService.updateProduct(editProd.id, requestData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCatalog();
        },
        error: (err) => {
          this.modalError.set(err.error?.message || 'Failed to update product details.');
        }
      });
    } else {
      // Create
      this.productService.createProduct(requestData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCatalog();
        },
        error: (err) => {
          this.modalError.set(err.error?.message || 'Failed to create product.');
        }
      });
    }
  }

  toggleStatus(prod: any): void {
    // Quick deactivate / activate toggle
    const updatedStatus = { ...prod, isActive: !prod.isActive };
    this.productService.updateProduct(prod.id, { isActive: !prod.isActive }).subscribe({
      next: () => {
        this.loadCatalog();
      }
    });
  }
}
