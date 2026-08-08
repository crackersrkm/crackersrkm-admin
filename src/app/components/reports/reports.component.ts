import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../services/bill.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 font-sans">
      
      <!-- Page Header -->
      <div>
        <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Cumulative Sales Reports</h2>
        <p class="text-slate-400 text-sm mt-1">Select date ranges to filter sales details and download Excel reports.</p>
      </div>

      <!-- Filters & Actions Card -->
      <div class="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-white/5 pb-3">
          <span class="text-xl">📅</span>
          <h3 class="text-lg font-bold text-white">Filter Report Dates</h3>
        </div>

        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div class="flex flex-col sm:flex-row gap-4 w-full md:max-w-2xl">
            <!-- Start Date -->
            <div class="flex-1">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Start Date</label>
              <input
                type="date"
                [(ngModel)]="startDate"
                class="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 font-sans"
              />
            </div>
            <!-- End Date -->
            <div class="flex-1">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">End Date</label>
              <input
                type="date"
                [(ngModel)]="endDate"
                class="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 font-sans"
              />
            </div>
          </div>

          <!-- Buttons Group -->
          <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <!-- Filter Button -->
            <button
              (click)="filterReport()"
              class="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm font-sans"
            >
              🔍 Filter Report
            </button>
            <!-- Download Button -->
            <button
              (click)="exportToExcel()"
              [disabled]="!reportFiltered() || filteredBills().length === 0"
              class="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer text-sm font-sans"
            >
              <span>📥</span> Download Excel Report
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Invoices Counter -->
        <div class="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div class="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-xl text-orange-400">
            🧾
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices Generated</p>
            <p class="text-2xl font-extrabold text-white mt-0.5">{{ totalBillsCount() }}</p>
          </div>
        </div>

        <!-- Cumulative Sales Amount -->
        <div class="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div class="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-xl text-emerald-400">
            💰
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Subtotal</p>
            <p class="text-2xl font-extrabold text-white mt-0.5">₹{{ cumulativeSubtotal() | number:'1.2-2' }}</p>
          </div>
        </div>

        <!-- Total Discount Allowed -->
        <div class="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div class="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-xl text-red-400">
            🏷️
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Discounts</p>
            <p class="text-2xl font-extrabold text-white mt-0.5">- ₹{{ cumulativeDiscount() | number:'1.2-2' }}</p>
          </div>
        </div>

        <!-- Cumulative Revenue / Net Total -->
        <div class="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div class="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-xl text-violet-400">
            ⚡
          </div>
          <div>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Revenue</p>
            <p class="text-2xl font-extrabold text-white mt-0.5">₹{{ cumulativeTotal() | number:'1.2-2' }}</p>
          </div>
        </div>
      </div>

      <!-- Cumulative Bills Listing Table -->
      <div class="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-white/5 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">📊</span>
            <h3 class="text-lg font-bold text-white">Sales Transactions</h3>
          </div>
          <span class="text-xs text-slate-400 font-semibold">{{ filteredBills().length }} invoices found</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-white/10">
                <th class="py-3 px-4">Bill No</th>
                <th class="py-3 px-4">Date</th>
                <th class="py-3 px-4">Customer Details</th>
                <th class="py-3 px-4 text-center">Payment Method</th>
                <th class="py-3 px-4 text-right">Subtotal</th>
                <th class="py-3 px-4 text-right">Discount</th>
                <th class="py-3 px-4 text-right">Net Total</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500 text-sm">
                    Loading sales records...
                  </td>
                </tr>
              } @else if (!reportFiltered()) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500 text-sm">
                    Please select a date range and click "Filter Report" to view sales transactions.
                  </td>
                </tr>
              } @else if (filteredBills().length === 0) {
                <tr>
                  <td colspan="7" class="py-12 text-center text-slate-500 text-sm">
                    No transactions generated inside the selected date range.
                  </td>
                </tr>
              } @else {
                @for (bill of filteredBills(); track bill.id) {
                  <tr class="border-b border-white/5 text-slate-300 text-sm hover:bg-white/5 transition-colors">
                    <td class="py-3.5 px-4 font-mono font-bold text-orange-400">{{ bill.billNumber }}</td>
                    <td class="py-3.5 px-4">{{ bill.billDate | date:'mediumDate' }}</td>
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-white">{{ bill.customer?.name || 'Anonymous' }}</div>
                      <div class="text-[10px] text-slate-500 mt-0.5">📞 {{ bill.customer?.phone }}</div>
                    </td>
                    <td class="py-3.5 px-4 text-center">
                      <span class="inline-block px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider bg-white/5 border border-white/10">
                        {{ bill.paymentMethod }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right font-semibold">₹{{ bill.subtotal | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4 text-right text-red-400 font-semibold">- ₹{{ bill.discount | number:'1.2-2' }}</td>
                    <td class="py-3.5 px-4 text-right font-extrabold text-white">₹{{ bill.totalAmount | number:'1.2-2' }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class ReportsComponent implements OnInit {
  private readonly billService = inject(BillService);

  // Date Range inputs (bound to date inputs)
  startDate = '';
  endDate = '';

  // Active query dates (updated only when Filter Report is clicked)
  activeStartDate = signal<string>('');
  activeEndDate = signal<string>('');
  reportFiltered = signal<boolean>(false);

  // Data states
  billsList = signal<any[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadAllBills();
  }

  private setDefaultDates(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.startDate = formatDate(thirtyDaysAgo);
    this.endDate = formatDate(today);
  }

  loadAllBills(): void {
    this.loading.set(true);
    this.billService.getBills().subscribe({
      next: (res) => {
        this.billsList.set(res || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filterReport(): void {
    this.activeStartDate.set(this.startDate);
    this.activeEndDate.set(this.endDate);
    this.reportFiltered.set(true);
  }

  // Convert Date object/string to local YYYY-MM-DD format
  private toLocalDateString(dateInput: any): string {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Filter bills signal
  filteredBills = computed(() => {
    if (!this.reportFiltered()) return [];

    const startStr = this.activeStartDate();
    const endStr = this.activeEndDate();
    const list = this.billsList();

    if (!startStr || !endStr) return [];

    return list.filter(bill => {
      const billLocalDate = this.toLocalDateString(bill.billDate);
      return billLocalDate >= startStr && billLocalDate <= endStr;
    });
  });

  // Cumulative metrics
  totalBillsCount = computed(() => this.filteredBills().length);
  cumulativeSubtotal = computed(() => this.filteredBills().reduce((sum, b) => sum + (b.subtotal || 0), 0));
  cumulativeDiscount = computed(() => this.filteredBills().reduce((sum, b) => sum + (b.discount || 0), 0));
  cumulativeTotal = computed(() => this.filteredBills().reduce((sum, b) => sum + (b.totalAmount || 0), 0));

  // Export Cumulative report to Excel compatible CSV
  exportToExcel(): void {
    const start = this.activeStartDate();
    const end = this.activeEndDate();
    const data = this.filteredBills();

    const headers = [
      "Bill Number",
      "Bill Date",
      "Customer Name",
      "Customer Phone",
      "Payment Method",
      "Payment Status",
      "Subtotal (INR)",
      "Discount (INR)",
      "Total Amount (INR)"
    ];

    const rows = data.map(bill => [
      bill.billNumber,
      new Date(bill.billDate).toLocaleDateString(),
      bill.customer?.name || 'Anonymous',
      bill.customer?.phone || '',
      bill.paymentMethod,
      bill.paymentStatus,
      bill.subtotal,
      bill.discount,
      bill.totalAmount
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rkm_sales_report_${start}_to_${end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
