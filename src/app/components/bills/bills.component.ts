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
    <div class="space-y-6">
      
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
        <div class="space-y-6">
          <div class="bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-white/10 bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th class="py-4 px-6">Bill Number</th>
                    <th class="py-4 px-6">Customer Name</th>
                    <th class="py-4 px-6">Phone Number</th>
                    <th class="py-4 px-6 text-center">Invoice Date</th>
                    <th class="py-4 px-6 text-right">Total (₹)</th>
                    <th class="py-4 px-6 text-center">Payment</th>
                    <th class="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  @if (loadingBills()) {
                    <tr>
                      <td colspan="7" class="py-12 text-center text-slate-400">
                        <div class="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        Retrieving invoices list...
                      </td>
                    </tr>
                  } @else if (billsList().length === 0) {
                    <tr>
                      <td colspan="7" class="py-12 text-center text-slate-400">
                        No billing history found. Create a new bill to get started!
                      </td>
                    </tr>
                  } @else {
                    @for (bill of billsList(); track bill.id) {
                      <tr class="hover:bg-white/5 transition-colors duration-150">
                        <td class="py-4 px-6 font-mono text-xs text-orange-400 font-bold">{{ bill.billNumber }}</td>
                        <td class="py-4 px-6 font-semibold text-white">{{ bill.customer?.name || 'N/A' }}</td>
                        <td class="py-4 px-6 text-slate-400">{{ bill.customer?.phone || 'N/A' }}</td>
                        <td class="py-4 px-6 text-center text-slate-300">{{ bill.billDate | date:'mediumDate' }}</td>
                        <td class="py-4 px-6 text-right font-extrabold text-white">₹{{ bill.totalAmount | number:'1.2-2' }}</td>
                        <td class="py-4 px-6 text-center">
                          <span
                            [class]="bill.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'"
                            class="inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider"
                          >
                            {{ bill.paymentStatus }}
                          </span>
                        </td>
                        <td class="py-4 px-6 text-center">
                          <button
                            (click)="viewBillDetails(bill.id)"
                            class="px-3 py-1.5 bg-white/5 hover:bg-orange-500 border border-white/10 hover:border-orange-500 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
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
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          <!-- POS Creation Form -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Customer Card -->
            <div class="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
              <div class="flex items-center gap-2 border-b border-white/5 pb-3">
                <span class="text-xl">👤</span>
                <h3 class="text-lg font-bold text-white">Customer Details</h3>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Customer Phone (10 digits)</label>
                  <input
                    type="text"
                    name="custPhone"
                    [(ngModel)]="billCustomer.phone"
                    (ngModelChange)="onPhoneChange($event)"
                    required
                    pattern="[6-9][0-9]{9}"
                    #phoneRef="ngModel"
                    placeholder="9876543210"
                    [class.border-red-500]="phoneRef.invalid && phoneRef.touched"
                    class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                  @if (phoneRef.invalid && phoneRef.touched) {
                    <span class="text-[10px] text-red-400 mt-1 block">Must be a valid 10-digit number.</span>
                  }
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    name="custName"
                    [(ngModel)]="billCustomer.name"
                    required
                    placeholder="John Doe"
                    class="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <!-- Items Table Selection -->
            <div class="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4 font-sans">
              <div class="flex items-center justify-between border-b border-white/5 pb-3">
                <div class="flex items-center gap-2">
                  <span class="text-xl">🛍️</span>
                  <h3 class="text-lg font-bold text-white">Invoice Items</h3>
                </div>
              </div>

              <!-- Bill items list table -->
              <div class="overflow-x-auto min-h-[260px] pb-16">
                <table class="w-full text-left">
                  <thead>
                    <tr class="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-white/10">
                      <th class="py-2 px-4">Item Name</th>
                      <th class="py-2 px-4 text-right">Unit Price</th>
                      <th class="py-2 px-4 text-center">Qty</th>
                      <th class="py-2 px-4 text-right">Total</th>
                      <th class="py-2 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @if (billItems().length === 0) {
                      <tr>
                        <td colspan="5" class="py-8 text-center text-slate-500 text-sm">
                          Please add rows or items using the button below.
                        </td>
                      </tr>
                    } @else {
                      @for (item of billItems(); track index; let index = $index) {
                        <tr class="border-b border-white/5">
                          <!-- Product Selection Search Field -->
                          <td class="py-3 px-4 relative">
                            <input
                              type="text"
                              [(ngModel)]="item.searchText"
                              (focus)="item.showDropdown = true"
                              (blur)="hideDropdownWithDelay(index)"
                              (input)="onSearchInputChange(index)"
                              placeholder="Search & select product..."
                              class="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 w-full max-w-[280px] font-sans"
                            />
                            <!-- Custom dropdown overlay -->
                            @if (item.showDropdown) {
                              <div class="absolute left-4 z-30 w-72 mt-1 max-h-[156px] overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 space-y-1">
                                @if (getFilteredProducts(item).length === 0) {
                                  <div class="p-2 text-xs text-slate-500">No products found</div>
                                } @else {
                                  @for (p of getFilteredProducts(item); track p.id) {
                                    <button
                                      type="button"
                                      (mousedown)="selectProductFromRow(index, p)"
                                      [disabled]="p.stockQuantity <= 0"
                                      class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 block cursor-pointer"
                                    >
                                      <div class="font-semibold">{{ p.name }}</div>
                                      <div class="text-[10px] text-slate-400 mt-0.5">₹{{ p.price }} | Stock: {{ p.stockQuantity }}</div>
                                    </button>
                                  }
                                }
                              </div>
                            }
                          </td>
                          <td class="py-3 px-4 text-right text-slate-300">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                          
                          <!-- Interactive Quantity Adjusters -->
                          <td class="py-3 px-4">
                            <div class="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                (click)="adjustQty(index, -1)"
                                [disabled]="item.productId === 0"
                                class="w-6 h-6 bg-white/5 rounded flex items-center justify-center border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                [(ngModel)]="item.quantity"
                                (change)="onRowQtyChange(index, item.quantity)"
                                [disabled]="item.productId === 0"
                                class="font-mono text-sm w-12 text-center text-white bg-slate-950/40 border border-white/10 rounded py-0.5 focus:outline-none focus:border-orange-500"
                                min="1"
                                [max]="item.maxStock"
                              />
                              <button
                                type="button"
                                (click)="adjustQty(index, 1)"
                                [disabled]="item.productId === 0"
                                class="w-6 h-6 bg-white/5 rounded flex items-center justify-center border border-white/10 text-white font-bold hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            @if (item.productId > 0) {
                              <div class="text-[9px] text-center text-slate-500 mt-0.5">Max: {{ item.maxStock }}</div>
                            }
                          </td>

                          <td class="py-3 px-4 text-right font-bold text-slate-100">₹{{ (item.unitPrice * item.quantity) | number:'1.2-2' }}</td>
                          
                          <td class="py-3 px-4 text-center">
                            <button
                              (click)="removeBillItem(index)"
                              class="text-red-400 hover:text-red-300 font-bold p-1 cursor-pointer"
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

              <!-- Add Row button -->
              <div class="mt-4 pt-2 flex justify-start">
                <button
                  type="button"
                  (click)="addBlankRow()"
                  class="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-orange-400 hover:text-orange-300 hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer font-sans"
                >
                  ➕ Add Row / Item
                </button>
              </div>
            </div>
          </div>

          <!-- Checkout & Billing Options -->
          <div class="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-6">
            <div class="flex items-center gap-2 border-b border-white/5 pb-3">
              <span class="text-xl">💳</span>
              <h3 class="text-lg font-bold text-white">Summary & Payment</h3>
            </div>

            <!-- Prices Summary -->
            <div class="space-y-3 font-semibold text-sm">
              <div class="flex items-center justify-between text-slate-400">
                <span>Subtotal:</span>
                <span class="text-white">₹{{ calculateSubtotal() | number:'1.2-2' }}</span>
              </div>
              
              <div class="space-y-1">
                <div class="flex items-center justify-between text-slate-400">
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    [max]="calculateSubtotal()"
                    [(ngModel)]="billDiscount"
                    class="w-24 px-2 py-1 text-right bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between text-lg font-extrabold border-t border-white/5 pt-3">
                <span class="text-orange-400">Net Total:</span>
                <span class="text-white">₹{{ calculateTotal() | number:'1.2-2' }}</span>
              </div>
            </div>

            <!-- Payment Options -->
            <div class="space-y-4 pt-2">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment Method</label>
                <div class="relative">
                  <button
                    type="button"
                    (click)="showMethodDropdown.set(!showMethodDropdown())"
                    (blur)="hideMethodDropdownWithDelay()"
                    class="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 text-left flex items-center justify-between focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <span>{{ getPaymentMethodLabel(paymentMethod) }}</span>
                    <span class="text-xs text-slate-400">▼</span>
                  </button>
                  @if (showMethodDropdown()) {
                    <div class="absolute left-0 right-0 z-30 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 space-y-1">
                      <button
                        type="button"
                        (mousedown)="setPaymentMethod('cash')"
                        class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        💵 Cash Payment
                      </button>
                      <button
                        type="button"
                        (mousedown)="setPaymentMethod('card')"
                        class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        💳 Card Payment
                      </button>
                      <button
                        type="button"
                        (mousedown)="setPaymentMethod('upi')"
                        class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        📱 UPI Payment
                      </button>
                    </div>
                  }
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Payment Status</label>
                <div class="relative">
                  <button
                    type="button"
                    (click)="showStatusDropdown.set(!showStatusDropdown())"
                    (blur)="hideStatusDropdownWithDelay()"
                    class="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 text-left flex items-center justify-between focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <span>{{ getPaymentStatusLabel(paymentStatus) }}</span>
                    <span class="text-xs text-slate-400">▼</span>
                  </button>
                  @if (showStatusDropdown()) {
                    <div class="absolute left-0 right-0 z-30 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 space-y-1">
                      <button
                        type="button"
                        (mousedown)="setPaymentStatus('paid')"
                        class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        ✅ Paid (Completed)
                      </button>
                      <button
                        type="button"
                        (mousedown)="setPaymentStatus('pending')"
                        class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-orange-500/20 hover:text-white transition-all cursor-pointer block font-sans"
                      >
                        ⏳ Pending (Draft)
                      </button>
                    </div>
                  }
                </div>
              </div>
            </div>

            @if (createError()) {
              <div class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {{ createError() }}
              </div>
            }

            <button
              (click)="submitBill()"
              [disabled]="!hasValidItems() || !billCustomer.phone || !billCustomer.name || phoneRef.invalid"
              class="w-full py-4 bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:from-orange-600 hover:to-violet-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🚀</span> Generate Invoice
            </button>
          </div>
        </div>
      }

      <!-- Invoice Details Overlay Modal (Print friendly layout) -->
      @if (selectedBill()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop overlay -->
          <div (click)="closeBillDetails()" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

          <!-- Printable Wrapper -->
          <div class="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
            
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
                  class="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <!-- Actual Print Invoice Body -->
            <div id="invoicePrintArea" class="p-8 flex-1 overflow-y-auto space-y-6">
              
              <!-- Business Details & Branding -->
              <div class="flex justify-between items-start">
                <div>
                  <h1 class="text-3xl font-black tracking-tight text-slate-900 uppercase">RKM CRACKERS</h1>
                  <p class="text-xs text-slate-500 mt-1 font-bold">Sparkles of Joy, Safely Delivered</p>
                  <p class="text-xs text-slate-400">Avudayanoor, Tenkasi, Tamil Nadu, India</p>
                </div>
                <div class="text-right">
                  <span class="inline-block px-3 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold rounded uppercase tracking-wider">
                    TAX INVOICE
                  </span>
                  <p class="text-md font-mono text-slate-700 font-extrabold mt-2">No: {{ selectedBill().billNumber }}</p>
                  <p class="text-xs text-slate-400 mt-1">Date: {{ selectedBill().billDate | date:'medium' }}</p>
                </div>
              </div>

              <hr class="border-slate-200" />

              <!-- Client details -->
              <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p class="text-slate-400 font-bold uppercase tracking-wide mb-1 text-[10px]">Billed To (Customer):</p>
                  <p class="text-sm font-bold text-slate-800">{{ selectedBill().customer?.name }}</p>
                  <p class="text-slate-600 mt-1">📞 {{ selectedBill().customer?.phone }}</p>
                  @if (selectedBill().customer?.email) {
                    <p class="text-slate-600">✉️ {{ selectedBill().customer?.email }}</p>
                  }
                  @if (selectedBill().customer?.address) {
                    <p class="text-slate-500 mt-1 italic">📍 {{ selectedBill().customer?.address }}</p>
                  }
                </div>
                <div class="text-right">
                  <p class="text-slate-400 font-bold uppercase tracking-wide mb-1 text-[10px]">Payment Summary:</p>
                  <p class="text-slate-600">Method: <strong class="uppercase text-slate-800">{{ selectedBill().paymentMethod }}</strong></p>
                  <p class="text-slate-600 mt-1">Status: 
                    <span class="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-extrabold uppercase text-[10px]">
                      {{ selectedBill().paymentStatus }}
                    </span>
                  </p>
                  @if (selectedBill().customer?.gstNumber) {
                    <p class="text-slate-600 mt-2 font-mono">GSTIN: <strong>{{ selectedBill().customer?.gstNumber }}</strong></p>
                  }
                </div>
              </div>

              <!-- Product items table -->
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th class="py-2.5 px-3">Item Description</th>
                    <th class="py-2.5 px-3 text-right">Unit Price (₹)</th>
                    <th class="py-2.5 px-3 text-center">Quantity</th>
                    <th class="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (item of selectedBill().items; track item.id) {
                    <tr class="text-slate-700">
                      <td class="py-3 px-3 font-semibold text-slate-800">{{ item.product?.name || 'Crackers Item' }}</td>
                      <td class="py-3 px-3 text-right">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td class="py-3 px-3 text-center">{{ item.quantity }}</td>
                      <td class="py-3 px-3 text-right font-bold text-slate-900">₹{{ item.totalAmount | number:'1.2-2' }}</td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Invoice Totals details -->
              <div class="flex justify-end pt-4 border-t border-slate-200">
                <div class="w-64 space-y-2 text-xs">
                  <div class="flex justify-between text-slate-500 font-semibold">
                    <span>Subtotal:</span>
                    <span class="text-slate-800 font-bold">₹{{ selectedBill().subtotal | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-slate-500 font-semibold">
                    <span>Discount:</span>
                    <span class="text-slate-800 font-bold">- ₹{{ selectedBill().discount | number:'1.2-2' }}</span>
                  </div>
                  <div class="flex justify-between text-sm font-extrabold border-t border-slate-100 pt-2 text-slate-900">
                    <span>Grand Total:</span>
                    <span class="text-lg">₹{{ selectedBill().totalAmount | number:'1.2-2' }}</span>
                  </div>
                </div>
              </div>

              <!-- Footer notice -->
              <div class="text-center text-[10px] text-slate-400 pt-8">
                <p>Thank you for shopping with RKM Crackers! Have a safe and happy celebrations.</p>
                <p class="mt-1">This is a system generated tax invoice. No signature required.</p>
              </div>

            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @media print {
      /* Hide all dashboard structures, headers, sidebars, buttons, and tab switchers */
      aside, header, nav, button, .inline-flex {
        display: none !important;
      }
      /* Hide parent dashboard views when modal is active */
      app-bills > div > div:not(.fixed) {
        display: none !important;
      }
      /* Style modal overlay to fill the print canvas on a single page */
      .fixed.inset-0 {
        position: absolute !important;
        inset: 0 !important;
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        z-index: 99999 !important;
        display: block !important;
      }
      /* Remove limits on inner modal container box */
      .fixed.inset-0 > div {
        max-height: none !important;
        width: 100% !important;
        max-width: none !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
        display: block !important;
      }
      /* Hide the modal header (which contains print/close buttons) */
      .fixed.inset-0 > div > div:not(#invoicePrintArea) {
        display: none !important;
      }
      /* Format invoice text & tables for high contrast print output */
      #invoicePrintArea {
        display: block !important;
        padding: 40px !important;
        margin: 0 !important;
        background: white !important;
        color: #000000 !important;
        width: 100% !important;
        height: auto !important;
      }
      #invoicePrintArea * {
        color: #000000 !important;
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
  createError = signal<string | null>(null);

  showMethodDropdown = signal(false);
  showStatusDropdown = signal(false);

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
    return val;
  }

  setPaymentMethod(val: string): void {
    this.paymentMethod = val;
    this.showMethodDropdown.set(false);
  }

  setPaymentStatus(val: string): void {
    this.paymentStatus = val;
    this.showStatusDropdown.set(false);
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

  addBlankRow(): void {
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
  }

  getFilteredProducts(item: any): any[] {
    const query = (item.searchText || '').toLowerCase().trim();
    const list = this.availableProducts();
    const selectedIds = this.billItems()
      .filter(bi => bi !== item && bi.productId > 0)
      .map(bi => bi.productId);
    const available = list.filter(p => !selectedIds.includes(p.id));
    if (!query || (item.productId && query === item.name.toLowerCase().trim())) {
      return available;
    }
    return available.filter(p => p.name.toLowerCase().includes(query));
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
    // Load products for POS catalog lookup (only active products)
    this.productService.getProducts(100, 0).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : res.data || [];
        this.availableProducts.set(list.filter((p: any) => p.isActive));
        if (this.billItems().length === 0) {
          this.addBlankRow();
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
      maxStock: prod.stockQuantity
    };

    this.billItems.update(items => [...items, newItem]);
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
  }

  removeBillItem(index: number): void {
    this.billItems.update(items => items.filter((_, i) => i !== index));
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
      items: itemsToSend.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.billService.createBill(payload).subscribe({
      next: (savedBill) => {
        // Reset form
        this.billCustomer = { name: '', phone: '', email: '', address: '', gstNumber: '' };
        this.billItems.set([]);
        this.addBlankRow();
        this.billDiscount = 0;
        this.paymentMethod = 'cash';
        this.paymentStatus = 'paid';

        // Load new bill in preview modal
        this.selectedBill.set(savedBill);
        
        // Reload list history and product stocks
        this.loadBills();
        this.loadProductsCatalog();
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
      }
    });
  }

  closeBillDetails(): void {
    this.selectedBill.set(null);
  }

  printInvoice(): void {
    window.print();
  }
}
