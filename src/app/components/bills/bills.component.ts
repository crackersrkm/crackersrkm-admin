import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../services/bill.service';
import { ProductService } from '../../services/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="space-y-6 print:hidden">
        
        <!-- Top Title and Switcher -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Billing & Invoices</h2>
          <p class="text-slate-400 text-sm mt-1">Generate invoices, verify sales records, and print bills.</p>
        </div>

        <!-- Tab switcher Buttons -->
        <div class="inline-flex p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            (click)="activeTab.set('history')"
            [class]="activeTab() === 'history' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer"
          >
            Invoice History
          </button>
          <button
            (click)="activeTab.set('create')"
            [class]="activeTab() === 'create' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'"
            class="px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer"
          >
            Create New Bill
          </button>
        </div>
      </div>

      <!-- Tab Content: Invoice History -->
      @if (activeTab() === 'history') {
        <div class="space-y-4">
          <div class="bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-white/10 bg-white/5 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th class="py-2.5 px-3.5">Bill Number</th>
                    <th class="py-2.5 px-3.5">Customer Name</th>
                    <th class="py-2.5 px-3.5">Phone Number</th>
                    <th class="py-2.5 px-3.5 text-center">Invoice Date</th>
                    <th class="py-2.5 px-3.5 text-right">Total (₹)</th>
                    <th class="py-2.5 px-3.5 text-center">Payment</th>
                    <th class="py-2.5 px-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  @if (loadingBills()) {
                    <tr>
                      <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                        <div class="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Retrieving invoices list...
                      </td>
                    </tr>
                  } @else if (billsList().length === 0) {
                    <tr>
                      <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                        No billing history found. Create a new bill to get started!
                      </td>
                    </tr>
                  } @else {
                    @for (bill of billsList(); track bill.id) {
                      <tr class="hover:bg-white/[0.03] transition-colors duration-150">
                        <td class="py-2 px-3.5 font-mono text-xs text-orange-400 font-bold">{{ bill.billNumber }}</td>
                        <td class="py-2 px-3.5 font-semibold text-xs text-white">{{ bill.customer?.name || 'N/A' }}</td>
                        <td class="py-2 px-3.5 text-xs text-slate-400">{{ bill.customer?.phone || 'N/A' }}</td>
                        <td class="py-2 px-3.5 text-center text-xs text-slate-300">{{ bill.billDate | date:'mediumDate' }}</td>
                        <td class="py-2 px-3.5 text-right font-mono font-extrabold text-xs text-white">₹{{ bill.totalAmount | number:'1.2-2' }}</td>
                        <td class="py-2 px-3.5 text-center">
                          <span
                            [class]="bill.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : (bill.paymentStatus === 'partially_paid' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30')"
                            class="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider"
                          >
                            {{ bill.paymentStatus }}
                          </span>
                        </td>
                        <td class="py-2 px-3.5 text-center">
                          <button
                            (click)="viewBillDetails(bill.id)"
                            class="px-2.5 py-1 bg-white/5 hover:bg-orange-500 border border-white/10 hover:border-orange-500 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                          >
                            🔍 View
                          </button>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }

      <!-- Tab Content: Create New Bill -->
      @if (activeTab() === 'create') {
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
          
          <!-- POS Creation Form (Left Panel 75%) -->
          <div class="lg:col-span-3 space-y-3">
            
            <!-- Customer Card -->
            <div class="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2.5">
              <div class="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                <span class="text-base">👤</span>
                <h3 class="text-sm font-bold text-white">Customer Details</h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Customer Phone (10 digits)</label>
                  <input
                    id="customer-phone"
                    type="text"
                    name="custPhone"
                    [(ngModel)]="billCustomer.phone"
                    (ngModelChange)="onPhoneChange($event)"
                    (keydown.enter)="focusCustomerName($event)"
                    required
                    pattern="[6-9][0-9]{9}"
                    #phoneRef="ngModel"
                    placeholder="9876543210"
                    [class.border-red-500]="phoneRef.invalid && phoneRef.touched"
                    class="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  @if (phoneRef.invalid && phoneRef.touched) {
                    <span class="text-[10px] text-red-400 mt-0.5 block">Must be a valid 10-digit number.</span>
                  }
                </div>
                <div>
                  <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Customer Name</label>
                  <input
                    id="customer-name"
                    type="text"
                    name="custName"
                    [(ngModel)]="billCustomer.name"
                    (keydown.enter)="focusFirstItem($event)"
                    required
                    placeholder="John Doe"
                    class="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <!-- Items Table Selection -->
            <div class="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2.5 font-sans">
              <div class="flex items-center justify-between border-b border-white/5 pb-2">
                <div class="flex items-center gap-1.5">
                  <span class="text-base">🛍️</span>
                  <h3 class="text-sm font-bold text-white">Invoice Items</h3>
                  <span class="text-xs text-slate-400 font-normal">({{ billItems().length }} rows)</span>
                </div>
                <button
                  type="button"
                  (click)="addBlankRow()"
                  class="px-2.5 py-1 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 rounded-lg text-xs font-semibold text-orange-400 hover:text-orange-300 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <span>➕</span> Add Row
                </button>
              </div>

              <!-- Bill items list table -->
              <div class="overflow-x-auto max-h-[460px] overflow-y-auto">
                <table class="w-full text-left">
                  <thead class="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                    <tr class="text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-white/10">
                      <th class="py-2 px-2.5 text-center w-10">S.No.</th>
                      <th class="py-2 px-2.5">Item (Name / ID)</th>
                      <th class="py-2 px-2.5 text-right w-20">Unit Price</th>
                      <th class="py-2 px-2.5 text-center w-24">Qty</th>
                      <th class="py-2 px-2.5 text-right w-20">Total</th>
                      <th class="py-2 px-2 text-center w-10">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (billItems().length === 0) {
                      <tr>
                        <td colspan="6" class="py-6 text-center text-slate-500 text-xs">
                          No items added. Click "Add Row" above to start adding products.
                        </td>
                      </tr>
                    } @else {
                      @for (item of billItems(); track index; let index = $index) {
                        <tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td class="py-1.5 px-2.5 text-center text-slate-400 text-xs font-semibold">{{ index + 1 }}</td>
                          <!-- Product Selection Search Field -->
                          <td class="py-1.5 px-2.5 relative">
                            <input
                              [id]="'item-search-' + index"
                              type="text"
                              [(ngModel)]="item.searchText"
                              (focus)="item.showDropdown = true"
                              (blur)="hideDropdownWithDelay(index)"
                              (input)="onSearchInputChange(index)"
                              (keydown.enter)="onSearchEnter(index, $event)"
                              placeholder="Search ID or name..."
                              class="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-full font-sans"
                            />
                            <!-- Custom dropdown overlay -->
                            @if (item.showDropdown) {
                              <div class="absolute left-2.5 top-full z-50 w-72 mt-1 max-h-48 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-1">
                                @if (getFilteredProducts(item).length === 0) {
                                  <div class="p-2 text-xs text-slate-500">No products found</div>
                                } @else {
                                  @for (p of getFilteredProducts(item); track p.id) {
                                    <button
                                      type="button"
                                      (mousedown)="selectProductFromRow(index, p)"
                                      [disabled]="p.stockQuantity <= 0"
                                      class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 block cursor-pointer"
                                    >
                                      <div class="flex items-center justify-between gap-2">
                                        <span class="font-semibold text-white truncate">{{ p.name }}</span>
                                        <span class="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded shrink-0">#{{ p.id }}</span>
                                      </div>
                                      <div class="text-[10px] text-slate-400 mt-0.5">₹{{ p.price }} | Stock: {{ p.stockQuantity }}</div>
                                    </button>
                                  }
                                }
                              </div>
                            }
                          </td>
                          <td class="py-1.5 px-2.5 text-right text-xs text-slate-300 font-mono">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                          
                          <!-- Interactive Quantity Adjusters -->
                          <td class="py-1.5 px-2.5">
                            <div class="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                (click)="adjustQty(index, -1)"
                                [disabled]="item.productId === 0"
                                class="w-5 h-5 bg-white/5 rounded flex items-center justify-center border border-white/10 text-white text-xs font-bold hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                [id]="'item-qty-' + index"
                                type="number"
                                [(ngModel)]="item.quantity"
                                (change)="onRowQtyChange(index, item.quantity)"
                                (keydown.enter)="onQtyEnter(index, $event)"
                                [disabled]="item.productId === 0"
                                class="font-mono text-xs w-11 text-center text-white bg-slate-950/40 border border-white/10 rounded py-0.5 px-0.5 focus:outline-none focus:border-orange-500"
                                min="1"
                                [max]="item.maxStock"
                              />
                              <button
                                type="button"
                                (click)="adjustQty(index, 1)"
                                [disabled]="item.productId === 0"
                                class="w-5 h-5 bg-white/5 rounded flex items-center justify-center border border-white/10 text-white text-xs font-bold hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            @if (item.productId > 0) {
                              <div class="text-[9px] text-center text-slate-500">Max: {{ item.maxStock }}</div>
                            }
                          </td>

                          <td class="py-1.5 px-2.5 text-right font-bold text-xs text-slate-100 font-mono">₹{{ (item.unitPrice * item.quantity) | number:'1.2-2' }}</td>
                          
                          <td class="py-1.5 px-2 text-center">
                            <button
                              (click)="removeBillItem(index)"
                              class="text-red-400 hover:text-red-300 text-xs p-1 cursor-pointer transition-colors"
                              title="Delete Row"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      }
                    }
                  </tbody>
                </table>
              </div>

              <!-- Quick Add Row button at bottom -->
              <div class="pt-1 flex justify-start">
                <button
                  type="button"
                  (click)="addBlankRow()"
                  class="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-orange-400 hover:text-orange-300 hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  <span>➕</span> Add Row / Item
                </button>
              </div>
            </div>
          </div>

          <!-- Checkout & Billing Options (Right Panel 25%) -->
          <div class="lg:col-span-1 bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-3.5">
            <div class="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <span class="text-base">💳</span>
              <h3 class="text-sm font-bold text-white">Summary & Payment</h3>
            </div>

            <!-- Prices Summary -->
            <div class="space-y-2 font-semibold text-xs">
              <div class="flex items-center justify-between text-slate-400">
                <span>Subtotal:</span>
                <span class="text-white font-mono">₹{{ calculateSubtotal() | number:'1.2-2' }}</span>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center justify-between text-slate-400">
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    [max]="calculateSubtotal()"
                    [(ngModel)]="billDiscount"
                    (ngModelChange)="onDiscountChange()"
                    class="w-20 px-2 py-1 text-right bg-white/5 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between text-base font-extrabold border-t border-white/5 pt-2">
                <span class="text-orange-400">Net Total:</span>
                <span class="text-white font-mono">₹{{ calculateTotal() | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Payment Options -->
            <div class="space-y-3 pt-1">
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment Method</label>
                <div class="relative">
                  <button
                    type="button"
                    (click)="showMethodDropdown.set(!showMethodDropdown())"
                    (blur)="hideMethodDropdownWithDelay()"
                    class="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 text-left flex items-center justify-between focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <span>{{ getPaymentMethodLabel(paymentMethod) }}</span>
                    <span class="text-[10px] text-slate-400">▼</span>
                  </button>
                  @if (showMethodDropdown()) {
                    <div class="absolute left-0 right-0 z-30 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-1">
                      <button
                        type="button"
                        (mousedown)="setPaymentMethod('cash')"
                        class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        💵 Cash Payment
                      </button>
                      <button
                        type="button"
                        (mousedown)="setPaymentMethod('card')"
                        class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        💳 Card Payment
                      </button>
                      <button
                        type="button"
                        (mousedown)="setPaymentMethod('upi')"
                        class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        📱 UPI Payment
                      </button>
                    </div>
                  }
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment Status</label>
                <div class="relative">
                  <button
                    type="button"
                    (click)="showStatusDropdown.set(!showStatusDropdown())"
                    (blur)="hideStatusDropdownWithDelay()"
                    class="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 text-left flex items-center justify-between focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <span>{{ getPaymentStatusLabel(paymentStatus) }}</span>
                    <span class="text-[10px] text-slate-400">▼</span>
                  </button>
                  @if (showStatusDropdown()) {
                    <div class="absolute left-0 right-0 z-30 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1.5 space-y-1">
                      <button
                        type="button"
                        (mousedown)="setPaymentStatus('paid')"
                        class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        ✅ Paid (Completed)
                      </button>
                      <button
                        type="button"
                        (mousedown)="setPaymentStatus('pending')"
                        class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        ⏳ Pending (Draft)
                      </button>
                      <button
                        type="button"
                        (mousedown)="setPaymentStatus('partially_paid')"
                        class="w-full text-left px-2.5 py-1.5 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        💵 Partially Paid
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Partially Paid Input Fields -->
              @if (paymentStatus === 'partially_paid') {
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 whitespace-nowrap">Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      [max]="calculateTotal()"
                      [(ngModel)]="billPaidAmount"
                      (ngModelChange)="onPaidAmountChange()"
                      class="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 whitespace-nowrap">Pending (₹)</label>
                    <div class="w-full px-2.5 py-1.5 bg-slate-900 border border-white/5 rounded-lg text-slate-400 text-xs font-mono select-none">
                      ₹{{ billPendingAmount | number:'1.2-2' }}
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (createError()) {
              <div class="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {{ createError() }}
              </div>
            }

            <button
              (click)="submitBill()"
              [disabled]="!hasValidItems() || !billCustomer.phone || !billCustomer.name || phoneRef.invalid"
              class="w-full py-3 bg-gradient-to-r from-orange-500 to-violet-600 text-white text-sm font-bold rounded-xl shadow-lg hover:from-orange-600 hover:to-violet-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🚀</span> Generate Invoice
            </button>
          </div>
        </div>
      }
      </div>

      <!-- Invoice Details Overlay Modal (Print friendly layout) -->
      @if (selectedBill()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:static print:block print:bg-white print:m-0">
          <!-- Backdrop overlay -->
          <div (click)="closeBillDetails()" class="absolute inset-0 bg-black/70 backdrop-blur-sm print:hidden"></div>

          <!-- Printable Wrapper -->
          <div class="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible print:max-w-none print:shadow-none print:rounded-none print:border-none print:w-full print:bg-white">
            
            <!-- Invoice Header actions (Non printable) -->
            <div class="flex items-center justify-between p-4 bg-slate-900 border-b border-white/10 text-white print:hidden">
              <span class="font-bold text-sm">Invoice Preview</span>
              <div class="flex gap-2">
                <button
                  (click)="printInvoice()"
                  class="px-4 py-1.5 bg-orange-500 text-white font-bold rounded-lg text-xs shadow hover:bg-orange-600 cursor-pointer"
                >
                  Print Invoice
                </button>
                <button
                  (click)="closeBillDetails()"
                  class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            <!-- Actual Print Invoice Body -->
            <div id="invoicePrintArea" class="p-6 flex-1 overflow-y-auto space-y-3 print:p-0 print:overflow-visible print:space-y-2">
              
              <!-- Business Details & Branding -->
              <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                  <img src="/rkm-badge.svg" alt="RKM Logo" class="w-10 h-10 object-contain" />
                  <div>
                    <h1 class="text-2xl font-black tracking-tight text-slate-900 uppercase">RKM CRACKERS</h1>
                    <p class="text-[11px] text-slate-500 mt-0.5 font-bold">Sparkles of Joy, Safely Delivered</p>
                    <p class="text-[10px] text-slate-400">Avudayanoor, Tenkasi, Tamil Nadu, India</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[9px] font-bold rounded uppercase tracking-wider">
                    TAX INVOICE
                  </span>
                  <p class="text-sm font-mono text-slate-700 font-extrabold mt-1">No: {{ selectedBill().billNumber }}</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">Date: {{ selectedBill().billDate | date:'medium' }}</p>
                </div>
              </div>

              <hr class="border-slate-200 my-1" />

              <!-- Client details -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p class="text-slate-400 font-bold uppercase tracking-wide mb-0.5 text-[9px]">Billed To (Customer):</p>
                  <p class="text-xs font-bold text-slate-800">{{ selectedBill().customer?.name }}</p>
                  <p class="text-slate-600 text-[11px] mt-0.5">📞 {{ selectedBill().customer?.phone }}</p>
                  @if (selectedBill().customer?.email) {
                    <p class="text-slate-600 text-[11px]">✉️ {{ selectedBill().customer?.email }}</p>
                  }
                  @if (selectedBill().customer?.address) {
                    <p class="text-slate-500 text-[10px] mt-0.5 italic">📍 {{ selectedBill().customer?.address }}</p>
                  }
                </div>
                <div class="text-right">
                  <p class="text-slate-400 font-bold uppercase tracking-wide mb-0.5 text-[9px]">Payment Summary:</p>
                  <p class="text-slate-600 text-[11px]">Method: <strong class="uppercase text-slate-800">{{ selectedBill().paymentMethod }}</strong></p>
                  <p class="text-slate-600 text-[11px] mt-0.5">Status: 
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-extrabold uppercase text-[9px]">
                      {{ selectedBill().paymentStatus }}
                    </span>
                  </p>
                  @if (selectedBill().customer?.gstNumber) {
                    <p class="text-slate-600 text-[10px] mt-1 font-mono">GSTIN: <strong>{{ selectedBill().customer?.gstNumber }}</strong></p>
                  }
                </div>
              </div>

              <!-- Product items table -->
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th class="py-1.5 px-3 text-center w-12">S.No.</th>
                    <th class="py-1.5 px-3">Item Description</th>
                    <th class="py-1.5 px-3 text-right">Unit Price (₹)</th>
                    <th class="py-1.5 px-3 text-center">Quantity</th>
                    <th class="py-1.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of selectedBill().items; track item.id; let idx = $index) {
                    <tr class="text-slate-700 leading-tight">
                      <td class="py-1 px-3 text-center text-slate-500 font-semibold">{{ idx + 1 }}</td>
                      <td class="py-1 px-3 font-semibold text-slate-800">{{ item.product?.name || 'Crackers Item' }}</td>
                      <td class="py-1 px-3 text-right">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td class="py-1 px-3 text-center">{{ item.quantity }}</td>
                      <td class="py-1 px-3 text-right font-bold text-slate-900">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                    </tr>
                  }
                  <!-- Total row at the end of items table body -->
                  <tr class="font-extrabold border-t border-slate-200 text-slate-900 bg-slate-50 leading-tight">
                    <td colspan="2" class="py-1.5 px-3">Total:</td>
                    <td class="py-1.5 px-3"></td>
                    <td class="py-1.5 px-3 text-center">{{ calculateSelectedBillTotalQty() }}</td>
                    <td class="py-1.5 px-3 text-right">₹{{ selectedBill().subtotal | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Invoice Totals details -->
              <div class="flex justify-end pt-2 border-t border-slate-200">
                <div class="w-64 space-y-1 text-xs">
                  <div class="flex justify-between text-slate-500 font-semibold">
                    <span>Subtotal:</span>
                    <span class="text-slate-800 font-bold">₹{{ selectedBill().subtotal | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-slate-500 font-semibold">
                    <span>Discount:</span>
                    <span class="text-slate-800 font-bold">- ₹{{ selectedBill().discount | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-sm font-extrabold border-t border-slate-100 pt-1 text-slate-900">
                    <span>Grand Total:</span>
                    <span class="text-base font-black">₹{{ selectedBill().totalAmount | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-xs text-slate-500 font-semibold border-t border-dashed border-slate-100 pt-1">
                    <span>Paid Amount:</span>
                    <span class="text-emerald-700 font-bold">₹{{ (selectedBill().paidAmount || 0) | number:'1.2-2' }}</span>
                  </div>
                  @if (selectedBill().pendingAmount > 0) {
                    <div class="flex justify-between text-xs text-slate-500 font-semibold">
                      <span>Pending Balance:</span>
                      <span class="text-red-700 font-bold">₹{{ selectedBill().pendingAmount | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Payment Details, History, and Record Payment -->
              <div class="border-t border-slate-100 pt-2 space-y-2">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg">
                  <div>
                    <p class="text-slate-500 font-bold uppercase tracking-wide mb-1 text-[10px]">Payment Overview:</p>
                    <p class="text-slate-700 leading-tight">Total Bill Amount: <strong class="text-slate-900">₹{{ selectedBill().totalAmount | number:'1.2-2' }}</strong></p>
                    <p class="text-slate-700 leading-tight mt-0.5">Paid Amount: <strong class="text-emerald-700">₹{{ (selectedBill().paidAmount || 0) | number:'1.2-2' }}</strong></p>
                    <p class="text-slate-700 leading-tight mt-0.5">Pending Amount: <strong class="text-red-700">₹{{ (selectedBill().pendingAmount || 0) | number:'1.2-2' }}</strong></p>
                  </div>
                  <div>
                    <p class="text-slate-500 font-bold uppercase tracking-wide mb-1 text-[10px]">Status Details:</p>
                    <p class="text-slate-700 leading-tight">Payment Status: 
                      <span 
                        [class]="selectedBill().paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : (selectedBill().paymentStatus === 'partially_paid' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200')"
                        class="px-2 py-0.5 rounded border font-extrabold uppercase text-[10px]"
                      >
                        {{ selectedBill().paymentStatus }}
                      </span>
                    </p>
                    <p class="text-slate-700 leading-tight mt-1">Payment Method: <strong class="uppercase text-slate-800">{{ selectedBill().paymentMethod }}</strong></p>
                  </div>
                </div>

                @if (selectedBill().payments && selectedBill().payments.length > 0) {
                  <div class="space-y-1.5 text-xs">
                    <p class="text-slate-500 font-bold uppercase tracking-wide text-[10px]">Payment Transactions History:</p>
                    <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <table class="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr class="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                            <th class="py-1 px-3">Transaction Date</th>
                            <th class="py-1 px-3">Method</th>
                            <th class="py-1 px-3 text-right">Amount Received</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          @for (p of selectedBill().payments; track p.id) {
                            <tr class="text-slate-700 leading-tight">
                              <td class="py-1 px-3 text-slate-500">{{ p.paymentDate | date:'medium' }}</td>
                              <td class="py-1 px-3 uppercase font-semibold text-slate-800">{{ p.paymentMethod }}</td>
                              <td class="py-1 px-3 text-right font-bold text-slate-900">₹{{ p.amountPaid | number:'1.2-2' }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                @if (selectedBill().pendingAmount > 0) {
                  <div class="bg-orange-50/60 border border-orange-200/50 p-3 rounded-xl space-y-2 print:hidden">
                    <div class="flex items-center gap-2">
                      <span class="text-base">💸</span>
                      <h4 class="text-xs font-extrabold text-orange-950 uppercase tracking-wider">Record Pending Balance Payment</h4>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label class="block text-[10px] font-bold text-orange-800 uppercase tracking-wide mb-1">Amount to Pay (₹)</label>
                        <input
                          type="number"
                          min="0.01"
                          [max]="selectedBill().pendingAmount"
                          [(ngModel)]="payBalanceAmount"
                          class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold text-orange-800 uppercase tracking-wide mb-1">Payment Method</label>
                        <select
                          [(ngModel)]="payBalanceMethod"
                          class="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:border-orange-500"
                        >
                          <option value="cash">💵 Cash</option>
                          <option value="card">💳 Card</option>
                          <option value="upi">📱 UPI</option>
                        </select>
                      </div>
                      <div>
                        <button
                          (click)="submitBalancePayment()"
                          [disabled]="!payBalanceAmount || payBalanceAmount <= 0 || payBalanceAmount > selectedBill().pendingAmount"
                          class="w-full py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Collect Payment
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Footer notice -->
              <div class="text-center text-[10px] text-slate-400 pt-1">
                <p>Thank you for shopping with RKM Crackers! Have a safe and happy celebrations.</p>
                <p class="mt-0.5">This is a system generated tax invoice. No signature required.</p>
              </div>

            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @media print {
      :host {
        display: block !important;
      }
      #invoicePrintArea {
        display: block !important;
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
      }
      #invoicePrintArea * {
        color: #000000 !important;
      }
      #invoicePrintArea table tbody tr td {
        padding-top: 1px !important;
        padding-bottom: 1px !important;
        line-height: 1.1 !important;
        border: none !important;
      }
      #invoicePrintArea table thead tr th {
        padding-top: 2px !important;
        padding-bottom: 2px !important;
      }
    }
  `]
})
export class BillsComponent implements OnInit {
  private readonly billService = inject(BillService);
  private readonly productService = inject(ProductService);

  // Tab state: 'history' or 'create'
  activeTab = signal<'history' | 'create'>('history');

  // Search catalogs
  billsList = signal<any[]>([]);
  availableProducts = signal<any[]>([]);
  loadingBills = signal(false);

  // Billing POS Form states
  billCustomer = {
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: ''
  };
  billItems = signal<any[]>([]);
  billDiscount = 0;
  paymentMethod = 'cash';
  paymentStatus = 'paid';
  billPaidAmount = 0;
  billPendingAmount = 0;
  createError = signal<string | null>(null);

  showMethodDropdown = signal(false);
  showStatusDropdown = signal(false);

  // Pay Balance Form fields
  payBalanceAmount = 0;
  payBalanceMethod = 'cash';

  private showAlert(title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info'): void {
    Swal.fire({
      title,
      text,
      icon,
      background: '#0f172a',
      color: '#ffffff',
      confirmButtonColor: '#f97316',
      customClass: {
        popup: 'border border-white/10 rounded-2xl font-sans text-sm'
      }
    });
  }

  getPaymentMethodLabel(val: string): string {
    if (val === 'cash') return '💵 Cash Payment';
    if (val === 'card') return '💳 Card Payment';
    if (val === 'upi') return '📱 UPI Payment';
    return val;
  }

  getPaymentStatusLabel(val: string): string {
    if (val === 'paid') return '✅ Paid (Completed)';
    if (val === 'pending') return '⏳ Pending (Draft)';
    if (val === 'partially_paid') return '💵 Partially Paid';
    return val;
  }

  setPaymentMethod(val: string): void {
    this.paymentMethod = val;
    this.showMethodDropdown.set(false);
  }

  setPaymentStatus(val: string): void {
    this.paymentStatus = val;
    this.showStatusDropdown.set(false);
    const total = this.calculateTotal();
    if (val === 'paid') {
      this.billPaidAmount = total;
      this.billPendingAmount = 0;
    } else if (val === 'pending') {
      this.billPaidAmount = 0;
      this.billPendingAmount = total;
    } else if (val === 'partially_paid') {
      this.billPaidAmount = 0;
      this.billPendingAmount = total;
    }
  }

  hideMethodDropdownWithDelay(): void {
    setTimeout(() => {
      this.showMethodDropdown.set(false);
    }, 200);
  }

  hideStatusDropdownWithDelay(): void {
    setTimeout(() => {
      this.showStatusDropdown.set(false);
    }, 200);
  }

  hasValidItems = computed(() => {
    return this.billItems().some(item => item.productId > 0 && item.quantity > 0);
  });

  focusCustomerName(e: Event): void {
    e.preventDefault();
    const el = document.getElementById('customer-name') as HTMLInputElement;
    if (el) el.focus();
  }

  focusFirstItem(e: Event): void {
    e.preventDefault();
    this.focusSearchInput(0);
  }

  focusSearchInput(index: number): void {
    setTimeout(() => {
      const el = document.getElementById(`item-search-${index}`) as HTMLInputElement;
      if (el) {
        el.focus();
      }
    }, 50);
  }

  focusQtyInput(index: number): void {
    setTimeout(() => {
      const el = document.getElementById(`item-qty-${index}`) as HTMLInputElement;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  }

  initBlankRows(count = 5): void {
    const rows = [];
    for (let i = 0; i < count; i++) {
      rows.push({
        productId: 0,
        name: '',
        unitPrice: 0,
        quantity: 1,
        maxStock: 0,
        searchText: '',
        showDropdown: false
      });
    }
    this.billItems.set(rows);
  }

  addBlankRow(autoFocus = true): void {
    const newItem = {
      productId: 0,
      name: '',
      unitPrice: 0,
      quantity: 1,
      maxStock: 0,
      searchText: '',
      showDropdown: false
    };
    this.billItems.update(items => [...items, newItem]);
    if (autoFocus) {
      const nextIndex = this.billItems().length - 1;
      this.focusSearchInput(nextIndex);
    }
  }

  getFilteredProducts(item: any): any[] {
    const query = (item.searchText || '').toLowerCase().trim();
    const list = this.availableProducts();
    const selectedIds = this.billItems()
      .filter(bi => bi !== item && bi.productId > 0)
      .map(bi => bi.productId);
    const available = list.filter(p => !selectedIds.includes(p.id));
    if (!query || (item.productId && (query === item.name.toLowerCase().trim() || query === item.productId.toString() || query === `#${item.productId}`))) {
      return available;
    }
    return available.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.id.toString().includes(query) ||
      `#${p.id}`.includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      (p.code && p.code.toLowerCase().includes(query))
    );
  }

  selectProductFromRow(index: number, prod: any): void {
    if (prod.stockQuantity <= 0) {
      this.showAlert('Out of Stock', 'Product is out of stock!', 'error');
      return;
    }

    const items = [...this.billItems()];
    items[index] = {
      productId: prod.id,
      name: prod.name,
      unitPrice: prod.price,
      quantity: 1,
      maxStock: prod.stockQuantity,
      searchText: prod.name,
      showDropdown: false
    };
    this.billItems.set(items);
    this.recalculatePartialAmounts();
    this.focusQtyInput(index);
  }

  onSearchEnter(index: number, event: Event): void {
    event.preventDefault();
    const item = this.billItems()[index];
    if (!item) return;

    if (item.productId === 0) {
      const filtered = this.getFilteredProducts(item);
      if (filtered.length > 0) {
        this.selectProductFromRow(index, filtered[0]);
      }
    } else {
      this.focusQtyInput(index);
    }
  }

  onQtyEnter(index: number, event: Event): void {
    event.preventDefault();
    const items = this.billItems();
    const item = items[index];
    if (!item) return;

    this.onRowQtyChange(index, item.quantity);

    if (index + 1 < items.length) {
      this.focusSearchInput(index + 1);
    } else {
      this.addBlankRow(true);
    }
  }

  onSearchInputChange(index: number): void {
    const items = [...this.billItems()];
    const item = items[index];
    if (!item.searchText.trim()) {
      item.productId = 0;
      item.name = '';
      item.unitPrice = 0;
      item.quantity = 1;
      item.maxStock = 0;
      this.billItems.set(items);
      this.recalculatePartialAmounts();
    }
  }

  hideDropdownWithDelay(index: number): void {
    setTimeout(() => {
      const items = [...this.billItems()];
      if (items[index]) {
        items[index].showDropdown = false;
        if (!items[index].productId) {
          items[index].searchText = '';
        } else {
          const prod = this.availableProducts().find(p => p.id === items[index].productId);
          if (prod) {
            items[index].searchText = prod.name;
          }
        }
        this.billItems.set(items);
      }
    }, 200);
  }

  onRowQtyChange(index: number, qtyVal: any): void {
    const items = [...this.billItems()];
    const item = items[index];
    let qty = parseInt(qtyVal, 10);

    if (isNaN(qty) || qty <= 0) {
      qty = 1;
    }

    if (qty > item.maxStock) {
      this.showAlert('Invalid Quantity', `Cannot set quantity to ${qty}. Max available stock is ${item.maxStock}`, 'warning');
      qty = item.maxStock;
    }

    item.quantity = qty;
    this.billItems.set(items);
    this.recalculatePartialAmounts();
  }

  onPhoneChange(phoneVal: string): void {
    if (!phoneVal || phoneVal.length < 10) {
      this.billCustomer.name = '';
      return;
    }
    
    // Search existing bills for a matching customer phone
    const matchedBill = this.billsList().find(b => b.customer?.phone === phoneVal);
    if (matchedBill && matchedBill.customer) {
      this.billCustomer.name = matchedBill.customer.name;
    } else {
      this.billCustomer.name = '';
    }
  }

  // Detailed Modal overlay
  selectedBill = signal<any | null>(null);

  ngOnInit(): void {
    this.loadBills();
    this.loadProductsCatalog();
  }

  loadBills(): void {
    this.loadingBills.set(true);
    this.billService.getBills().subscribe({
      next: (res) => {
        this.billsList.set(res || []);
        this.loadingBills.set(false);
      },
      error: () => {
        this.loadingBills.set(false);
      }
    });
  }

  loadProductsCatalog(): void {
    // Load all active products for POS catalog lookup
    this.productService.getProducts(1000, 0).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : res.data || [];
        this.availableProducts.set(list.filter((p: any) => p.isActive));
        if (this.billItems().length === 0) {
          this.initBlankRows(5);
        }
      }
    });
  }

  // POS operations
  addBillItem(productIdVal: string): void {
    if (!productIdVal) return;
    const pId = parseInt(productIdVal, 10);
    
    // Check if item is already added to bill items list
    const existingIndex = this.billItems().findIndex(item => item.productId === pId);
    if (existingIndex !== -1) {
      this.adjustQty(existingIndex, 1);
      return;
    }

    const prod = this.availableProducts().find(p => p.id === pId);
    if (!prod) return;

    if (prod.stockQuantity <= 0) {
      this.showAlert('Out of Stock', 'Product is out of stock!', 'error');
      return;
    }

    // Add new item
    const newItem = {
      productId: prod.id,
      name: prod.name,
      unitPrice: prod.price,
      quantity: 1,
      maxStock: prod.stockQuantity,
      searchText: prod.name,
      showDropdown: false
    };

    this.billItems.update(items => [...items, newItem]);
    this.recalculatePartialAmounts();
  }

  adjustQty(index: number, diff: number): void {
    const items = [...this.billItems()];
    const item = items[index];
    const targetQty = item.quantity + diff;

    if (targetQty <= 0) {
      this.removeBillItem(index);
      return;
    }

    if (targetQty > item.maxStock) {
      this.showAlert('Limit Reached', `Cannot add more. Insufficient stock quantity. Max available: ${item.maxStock}`, 'warning');
      return;
    }

    item.quantity = targetQty;
    this.billItems.set(items);
    this.recalculatePartialAmounts();
  }

  removeBillItem(index: number): void {
    this.billItems.update(items => items.filter((_, i) => i !== index));
    this.recalculatePartialAmounts();
  }

  calculateSubtotal(): number {
    return this.billItems().reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  }

  calculateTotal(): number {
    const sub = this.calculateSubtotal();
    const discount = Number(this.billDiscount) || 0;
    const total = sub - discount;
    return total < 0 ? 0 : total;
  }

  onDiscountChange(): void {
    this.recalculatePartialAmounts();
  }

  recalculatePartialAmounts(): void {
    const total = this.calculateTotal();
    if (this.paymentStatus === 'paid') {
      this.billPaidAmount = total;
      this.billPendingAmount = 0;
    } else if (this.paymentStatus === 'pending') {
      this.billPaidAmount = 0;
      this.billPendingAmount = total;
    } else if (this.paymentStatus === 'partially_paid') {
      if (this.billPaidAmount > total) {
        this.billPaidAmount = total;
      }
      this.billPendingAmount = total - this.billPaidAmount;
    }
  }

  onPaidAmountChange(): void {
    const total = this.calculateTotal();
    if (this.billPaidAmount > total) {
      this.billPaidAmount = total;
    }
    if (this.billPaidAmount < 0) {
      this.billPaidAmount = 0;
    }
    this.billPendingAmount = total - this.billPaidAmount;
  }

  calculateSelectedBillTotalQty(): number {
    const bill = this.selectedBill();
    if (!bill || !bill.items) return 0;
    return bill.items.reduce((acc: number, item: any) => acc + Number(item.quantity), 0);
  }

  submitBill(): void {
    this.createError.set(null);
    const sub = this.calculateSubtotal();
    const discount = Number(this.billDiscount) || 0;

    if (discount < 0) {
      this.createError.set('Discount cannot be negative.');
      return;
    }
    if (discount > sub) {
      this.createError.set('Discount cannot exceed the subtotal.');
      return;
    }

    const itemsToSend = this.billItems().filter(item => item.productId > 0);
    if (itemsToSend.length === 0) {
      this.createError.set('Please select at least one valid product.');
      return;
    }

    // Confirmation Popup
    Swal.fire({
      title: 'Generate Invoice?',
      text: 'Are you sure you want to generate this invoice? Once generated, it cannot be edited.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Generate',
      cancelButtonText: 'Cancel',
      background: '#0f172a',
      color: '#ffffff',
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#475569',
      customClass: {
        popup: 'border border-white/10 rounded-2xl font-sans text-sm'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeSubmitBill(discount, itemsToSend);
      }
    });
  }

  private executeSubmitBill(discount: number, itemsToSend: any[]): void {
    // Form payload
    const payload = {
      customer: {
        name: this.billCustomer.name,
        phone: this.billCustomer.phone,
        email: this.billCustomer.email || undefined,
        address: this.billCustomer.address || undefined,
        gstNumber: this.billCustomer.gstNumber || undefined
      },
      discount: discount,
      paymentStatus: this.paymentStatus,
      paymentMethod: this.paymentMethod,
      paidAmount: this.paymentStatus === 'partially_paid' ? this.billPaidAmount : undefined,
      pendingAmount: this.paymentStatus === 'partially_paid' ? this.billPendingAmount : undefined,
      items: itemsToSend.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.billService.createBill(payload).subscribe({
      next: (savedBill) => {
        // Reset form
        this.billCustomer = { name: '', phone: '', email: '', address: '', gstNumber: '' };
        this.initBlankRows(5);
        this.billDiscount = 0;
        this.paymentMethod = 'cash';
        this.paymentStatus = 'paid';
        this.billPaidAmount = 0;
        this.billPendingAmount = 0;

        // Load new bill in preview modal
        this.selectedBill.set(savedBill);
        this.payBalanceAmount = savedBill.pendingAmount;
        
        // Reload list history and product stocks
        this.loadBills();
        this.loadProductsCatalog();
        this.showAlert('Success', 'Invoice generated successfully.', 'success');
      },
      error: (err) => {
        this.createError.set(err.error?.message || 'Error occurred while generating invoice. Please check stock limits.');
      }
    });
  }

  // Invoice display and printing
  viewBillDetails(id: number): void {
    this.billService.getBill(id).subscribe({
      next: (res) => {
        this.selectedBill.set(res);
        if (res) {
          this.payBalanceAmount = res.pendingAmount;
        }
      }
    });
  }

  closeBillDetails(): void {
    this.selectedBill.set(null);
  }

  printInvoice(): void {
    window.print();
  }

  submitBalancePayment(): void {
    const bill = this.selectedBill();
    if (!bill) return;

    const payload = {
      amountPaid: Number(this.payBalanceAmount),
      paymentMethod: this.payBalanceMethod
    };

    this.billService.addPayment(bill.id, payload).subscribe({
      next: (updatedBill) => {
        this.selectedBill.set(updatedBill);
        this.payBalanceAmount = updatedBill.pendingAmount;
        this.loadBills();
        this.showAlert('Payment Recorded', `Success! Recorded payment of ₹${payload.amountPaid}`, 'success');
      },
      error: (err) => {
        this.showAlert('Payment Error', err.error?.message || 'Error occurred while saving payment.', 'error');
      }
    });
  }
}
