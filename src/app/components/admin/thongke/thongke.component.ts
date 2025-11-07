import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '../../../service/order.service';

Chart.register(...registerables);

interface PizzaSale {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
  percentage: number;
}

// Thêm interface mới cho thống kê size và phân loại
interface SizeSale {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
  percentage: number;
}

interface BaseTypeSale {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
  percentage: number;
}

interface PizzaSalesData {
  [key: number]: {
    id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
  }
}

// Thêm interface mới cho dữ liệu size và phân loại
interface SizeSalesData {
  [key: number]: {
    id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
  }
}

interface BaseTypeSalesData {
  [key: number]: {
    id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
  }
}

interface DailyRevenue {
  [date: string]: number;
}

@Component({
  selector: 'app-thongke',
  standalone: false,
  templateUrl: './thongke.component.html',
  styleUrl: './thongke.component.scss'
})
export class ThongkeComponent implements OnInit {
  // Date range filters
  startDate: string = '';
  endDate: string = '';
  
  // Chart view selection
  currentView: 'day' | 'week' | 'month' | 'year' = 'day';
  
  // Top/Bottom selling pizzas
  topSellingPizzas: PizzaSale[] = [];
  bottomSellingPizzas: PizzaSale[] = [];
  
  // Thêm thuộc tính mới cho thống kê size và phân loại
  topSellingSizes: SizeSale[] = [];
  bottomSellingSizes: SizeSale[] = [];
  topSellingBaseTypes: BaseTypeSale[] = [];
  bottomSellingBaseTypes: BaseTypeSale[] = [];
  
  // Revenue statistics
  totalRevenue: number = 0;
  averageOrderValue: number = 0;
  totalOrders: number = 0;
  
  // Charts
  dailyChart: any;
  weeklyChart: any;
  monthlyChart: any;
  yearlyChart: any;
  
  // Date range for charts
  dateRangeLabels: string[] = [];
  weekRangeLabels: string[] = [];
  
  // Revenue data
  dailyRevenueData: number[] = [];
  weeklyRevenueData: number[] = [];
  monthlyRevenueData: number[] = [];
  yearlyRevenueData: number[] = [];
  
  // Chart labels
  monthlyLabels: string[] = [];
  yearlyLabels: string[] = [];
  
  // Loading state
  isLoading: boolean = false;
  
  // All orders data
  allOrders: any[] = [];
  
  constructor(
    private orderService: OrderService
  ) { }

  ngOnInit(): void {
    // Set default date range to last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    this.startDate = this.formatDate(sevenDaysAgo);
    this.endDate = this.formatDate(today);
    
    // Generate date labels for the charts
    this.generateDateRangeLabels();
    this.generateWeekRangeLabels();
    
    // Initialize data and charts
    this.initializeData();
  }
  
  initializeData(): void {
    this.isLoading = true;
    
    // Fetch all orders to calculate total revenue, order statistics, and pizza sales
    this.orderService.getAllOrders('', 0, 1000).subscribe({
      next: (response) => {
        const orders = response.orders;
        this.allOrders = orders;
        this.totalOrders = orders.length;
        
        // Calculate total revenue from all orders
        this.totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total_price, 0);
        
        // Calculate average order value
        this.averageOrderValue = this.totalOrders > 0 ? Math.round(this.totalRevenue / this.totalOrders) : 0;
        
        // Process orders to get pizza sales data
        this.processPizzaSalesData(orders);
        
        // Generate revenue data for charts
        this.generateRevenueData(orders);
        
        // Initialize charts
        setTimeout(() => {
          this.initDailyChart();
          this.initWeeklyChart();
          this.initMonthlyChart();
          this.initYearlyChart();
          this.showChart(this.currentView);
          this.isLoading = false;
        }, 0);
      },
      error: (error) => {
        console.error('Error fetching orders:', error);
        this.isLoading = false;
      }
    });
  }

  generateRevenueData(orders: any[]): void {
    // Filter orders by date range
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the end date fully
    
    const filteredOrders = orders.filter(order => {
      if (!order.order_time) return false;
      
      // Handle order_time which could be a timestamp or date string
      let orderDate;
      if (typeof order.order_time === 'number') {
        // If it's a timestamp
        orderDate = new Date(order.order_time);
      } else if (Array.isArray(order.order_time) && order.order_time.length >= 6) {
        // If it's an array like [year, month, day, hour, minute, second]
        const [year, month, day, hour = 0, minute = 0, second = 0] = order.order_time;
        orderDate = new Date(year, month - 1, day, hour, minute, second);
      } else {
        // Try to parse as date string
        orderDate = new Date(order.order_time);
      }
      
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    // Calculate daily revenue
    const dailyRevenue: DailyRevenue = {};
    
    // Initialize all dates in range with 0 revenue
    const daysDiff = this.getDaysDifference(startDate, endDate);
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = this.formatDate(currentDate);
      dailyRevenue[dateStr] = 0;
    }
    
    // Add revenue for each order
    filteredOrders.forEach(order => {
      // Parse order date
      let orderDate;
      if (typeof order.order_time === 'number') {
        orderDate = new Date(order.order_time);
      } else if (Array.isArray(order.order_time) && order.order_time.length >= 6) {
        const [year, month, day, hour = 0, minute = 0, second = 0] = order.order_time;
        orderDate = new Date(year, month - 1, day, hour, minute, second);
      } else {
        orderDate = new Date(order.order_time);
      }
      
      const dateStr = this.formatDate(orderDate);
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += order.total_price;
      }
    });
    
    // Convert to array for chart
    this.dailyRevenueData = this.dateRangeLabels.map(label => {
      // Convert from DD/MM/YYYY format to YYYY-MM-DD for lookup
      const parts = label.split('/');
      const day = parts[0];
      const month = parts[1];
      const year = parts[2]; // Now the year is included in the label
      
      const dateStr = `${year}-${month}-${day}`;
      return dailyRevenue[dateStr] || 0;
    });
    
    // Calculate weekly revenue
    this.calculateWeeklyRevenue(dailyRevenue);
    
    // Calculate monthly revenue
    this.calculateMonthlyRevenue(filteredOrders);
    
    // Calculate yearly revenue
    this.calculateYearlyRevenue(filteredOrders);
  }
  
  calculateWeeklyRevenue(dailyRevenue: DailyRevenue): void {
    this.weeklyRevenueData = [];
    
    // Get start and end dates
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const daysDiff = this.getDaysDifference(startDate, endDate);
    const weekCount = Math.ceil(daysDiff / 7);
    
    // Calculate revenue for each week
    for (let i = 0; i < weekCount; i++) {
      let weeklyTotal = 0;
      
      // Calculate start and end date for this week
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(startDate.getDate() + (i * 7));
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      
      // Ensure we don't go beyond the end date
      if (weekEndDate > endDate) {
        weekEndDate.setTime(endDate.getTime());
      }
      
      // Sum up daily revenue for this week
      let currentDate = new Date(weekStartDate);
      while (currentDate <= weekEndDate) {
        const dateStr = this.formatDate(currentDate);
        weeklyTotal += dailyRevenue[dateStr] || 0;
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      this.weeklyRevenueData.push(weeklyTotal);
    }
  }
  
  calculateMonthlyRevenue(filteredOrders: any[]): void {
    // Get start and end dates
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    
    // Group orders by month and year
    const monthlyRevenue: { [monthYear: string]: number } = {};
    
    // Generate all month-year combinations in the date range
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth(); // 0-11
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth(); // 0-11
    
    // Initialize all month-year combinations with zero revenue
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const monthYearKey = `Tháng ${currentMonth + 1}/${currentYear}`;
      monthlyRevenue[monthYearKey] = 0;
      
      // Move to next month
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    
    // Add revenue for each order
    filteredOrders.forEach(order => {
      if (order.order_time) {
        const orderDate = new Date(order.order_time);
        const year = orderDate.getFullYear();
        const month = orderDate.getMonth(); // 0-11
        const monthYearKey = `Tháng ${month + 1}/${year}`;
        
        // Only add to existing keys (within our date range)
        if (monthlyRevenue[monthYearKey] !== undefined) {
          monthlyRevenue[monthYearKey] += order.total_price;
        }
      }
    });
    
    // Sort keys by year and month
    const sortedKeys = Object.keys(monthlyRevenue).sort((a, b) => {
      const [, monthYearA] = a.split(' ');
      const [, monthYearB] = b.split(' ');
      const [monthA, yearA] = monthYearA.split('/');
      const [monthB, yearB] = monthYearB.split('/');
      
      if (yearA !== yearB) {
        return Number(yearA) - Number(yearB);
      }
      return Number(monthA) - Number(monthB);
    });
    
    // Use sorted keys for labels and data
    this.monthlyLabels = sortedKeys;
    this.monthlyRevenueData = sortedKeys.map(key => monthlyRevenue[key]);
  }
  
  calculateYearlyRevenue(filteredOrders: any[]): void {
    // Get start and end dates
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    
    // Get start and end years
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    
    // Group orders by year
    const yearlyRevenue: { [year: string]: number } = {};
    
    // Initialize all years in the range with zero revenue
    for (let year = startYear; year <= endYear; year++) {
      yearlyRevenue[year.toString()] = 0;
    }
    
    // Add revenue for each order
    filteredOrders.forEach(order => {
      if (order.order_time) {
        const orderDate = new Date(order.order_time);
        const year = orderDate.getFullYear().toString();
        
        // Only add to existing keys (within our date range)
        if (yearlyRevenue[year] !== undefined) {
          yearlyRevenue[year] += order.total_price;
        }
      }
    });
    
    // Sort years
    const sortedYears = Object.keys(yearlyRevenue).sort();
    
    // Use sorted years for labels and data
    this.yearlyLabels = sortedYears;
    this.yearlyRevenueData = sortedYears.map(year => yearlyRevenue[year]);
  }

  processPizzaSalesData(orders: any[]): void {
    // Khởi tạo các đối tượng để lưu trữ dữ liệu bán hàng
    const pizzaSalesData: PizzaSalesData = {};
    const sizeSalesData: SizeSalesData = {};
    const baseTypeSalesData: BaseTypeSalesData = {};
    
    // Tính tổng doanh thu để tính phần trăm
    let totalRevenue = 0;
    let totalSizeRevenue = 0;
    let totalBaseTypeRevenue = 0;

    // Xử lý từng đơn hàng
    orders.forEach(order => {
      if (order.order_details) {
        order.order_details.forEach((detail: any) => {
          // Xử lý dữ liệu pizza
          if (detail.pizza) {
            const pizzaId = detail.pizza.id;
            if (!pizzaSalesData[pizzaId]) {
              pizzaSalesData[pizzaId] = {
                id: pizzaId,
                name: detail.pizza.name,
                quantity_sold: 0,
                revenue: 0
              };
            }
            pizzaSalesData[pizzaId].quantity_sold += detail.quantity;
            pizzaSalesData[pizzaId].revenue += detail.price * detail.quantity;
            totalRevenue += detail.price * detail.quantity;
          }

          // Xử lý dữ liệu size
          if (detail.size) {
            const sizeId = detail.size.id;
            if (!sizeSalesData[sizeId]) {
              sizeSalesData[sizeId] = {
                id: sizeId,
                name: detail.size.size_name,
                quantity_sold: 0,
                revenue: 0
              };
            }
            sizeSalesData[sizeId].quantity_sold += detail.quantity;
            sizeSalesData[sizeId].revenue += detail.price * detail.quantity;
            totalSizeRevenue += detail.price * detail.quantity;
          }

          // Xử lý dữ liệu phân loại (base type)
          if (detail.baseType) {
            const baseTypeId = detail.baseType.id;
            if (!baseTypeSalesData[baseTypeId]) {
              baseTypeSalesData[baseTypeId] = {
                id: baseTypeId,
                name: detail.baseType.base_name,
                quantity_sold: 0,
                revenue: 0
              };
            }
            baseTypeSalesData[baseTypeId].quantity_sold += detail.quantity;
            baseTypeSalesData[baseTypeId].revenue += detail.price * detail.quantity;
            totalBaseTypeRevenue += detail.price * detail.quantity;
          }
        });
      }
    });

    // Chuyển đổi dữ liệu pizza thành mảng và tính phần trăm
    const pizzaSalesArray = Object.values(pizzaSalesData).map(sale => ({
      ...sale,
      percentage: totalRevenue > 0 ? (sale.revenue / totalRevenue) * 100 : 0
    }));

    // Chuyển đổi dữ liệu size thành mảng và tính phần trăm
    const sizeSalesArray = Object.values(sizeSalesData).map(sale => ({
      ...sale,
      percentage: totalSizeRevenue > 0 ? (sale.revenue / totalSizeRevenue) * 100 : 0
    }));

    // Chuyển đổi dữ liệu phân loại thành mảng và tính phần trăm
    const baseTypeSalesArray = Object.values(baseTypeSalesData).map(sale => ({
      ...sale,
      percentage: totalBaseTypeRevenue > 0 ? (sale.revenue / totalBaseTypeRevenue) * 100 : 0
    }));

    // Sắp xếp và lấy top/bottom pizza
    this.topSellingPizzas = [...pizzaSalesArray]
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);
    this.bottomSellingPizzas = [...pizzaSalesArray]
      .sort((a, b) => a.quantity_sold - b.quantity_sold)
      .slice(0, 5);

    // Sắp xếp và lấy top/bottom size
    this.topSellingSizes = [...sizeSalesArray]
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);
    this.bottomSellingSizes = [...sizeSalesArray]
      .sort((a, b) => a.quantity_sold - b.quantity_sold)
      .slice(0, 5);

    // Sắp xếp và lấy top/bottom phân loại
    this.topSellingBaseTypes = [...baseTypeSalesArray]
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 5);
    this.bottomSellingBaseTypes = [...baseTypeSalesArray]
      .sort((a, b) => a.quantity_sold - b.quantity_sold)
      .slice(0, 5);
  }
  
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
  
  formatPercentage(percentage: number): string {
    return percentage.toFixed(1) + '%';
  }
  
  generateDateRangeLabels(): void {
    this.dateRangeLabels = [];
    
    if (!this.startDate || !this.endDate) {
      return;
    }
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const daysDiff = this.getDaysDifference(start, end);
    
    // Generate date labels for the selected range
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = this.formatDate(currentDate);
      this.dateRangeLabels.push(this.formatDisplayDate(dateStr));
    }
  }
  
  generateWeekRangeLabels(): void {
    this.weekRangeLabels = [];
    
    if (!this.startDate || !this.endDate) {
      return;
    }
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const daysDiff = this.getDaysDifference(start, end);
    const weekCount = Math.ceil(daysDiff / 7);
    
    // Generate week labels for the selected range
    for (let i = 0; i < weekCount; i++) {
      const weekStartDate = new Date(start);
      weekStartDate.setDate(start.getDate() + (i * 7));
      
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      
      // Ensure we don't go beyond the end date
      if (weekEndDate > end) {
        weekEndDate.setTime(end.getTime());
      }
      
      const weekStartStr = this.formatDisplayDate(this.formatDate(weekStartDate));
      const weekEndStr = this.formatDisplayDate(this.formatDate(weekEndDate));
      this.weekRangeLabels.push(`${weekStartStr}-${weekEndStr}`);
    }
  }
  
  getDaysDifference(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  initDailyChart(): void {
    const ctx = document.getElementById('dailyChart') as HTMLCanvasElement;
    
    if (this.dailyChart) {
      this.dailyChart.destroy();
    }
    
    // Create a copy of labels and data to work with
    let labels = [...this.dateRangeLabels];
    let dailyData = [...this.dailyRevenueData];
    
    // Determine which points to keep - focus on days with data
    const MAX_POINTS_DISPLAY = 40; // Maximum days to display on chart
    
    // First, identify days with revenue
    const daysWithRevenue = dailyData.map((value, index) => ({ 
      index, 
      value, 
      label: labels[index],
      hasRevenue: value > 0
    }));
    
    // Always include the first and last day for context
    if (daysWithRevenue.length > 0) {
      daysWithRevenue[0].hasRevenue = true;
      daysWithRevenue[daysWithRevenue.length - 1].hasRevenue = true;
    }
    
    // Count days with revenue
    const revenuePointsCount = daysWithRevenue.filter(day => day.hasRevenue).length;
    
    // If we have too many points to display
    if (labels.length > MAX_POINTS_DISPLAY) {
      let pointsToKeep: typeof daysWithRevenue = [];
      
      // If revenue days are less than our max, keep all revenue days plus some context
      if (revenuePointsCount <= MAX_POINTS_DISPLAY) {
        // First, include all days with revenue
        pointsToKeep = daysWithRevenue.filter(day => day.hasRevenue);
        
        // Then add some context days around revenue days if needed
        if (pointsToKeep.length < MAX_POINTS_DISPLAY) {
          // For each revenue day, try to add a day before and after for context
          // (unless they're already included)
          const contextDays = new Set<number>(pointsToKeep.map(day => day.index));
          
          // First pass: add immediate adjacent days (one day before and after)
          for (const day of pointsToKeep) {
            const prevIndex = day.index - 1;
            const nextIndex = day.index + 1;
            
            if (prevIndex >= 0 && !contextDays.has(prevIndex) && contextDays.size < MAX_POINTS_DISPLAY) {
              contextDays.add(prevIndex);
            }
            
            if (nextIndex < daysWithRevenue.length && !contextDays.has(nextIndex) && contextDays.size < MAX_POINTS_DISPLAY) {
              contextDays.add(nextIndex);
            }
          }
          
          // Convert back to our point format and sort by index
          pointsToKeep = Array.from(contextDays)
            .map(idx => daysWithRevenue[idx])
            .sort((a, b) => a.index - b.index);
        }
      } else {
        // We have too many revenue days, need to select a representative sample
        // Keep all revenue days if possible, otherwise select evenly distributed points
        const skipFactor = Math.ceil(revenuePointsCount / MAX_POINTS_DISPLAY);
        
        // Get all revenue days
        const revenueDays = daysWithRevenue.filter(day => day.hasRevenue);
        
        // Select evenly distributed revenue days
        pointsToKeep = revenueDays.filter((day, idx) => 
          idx % skipFactor === 0 || idx === revenueDays.length - 1
        );
      }
      
      // Extract the filtered data
      const sortedPoints = pointsToKeep.sort((a, b) => a.index - b.index);
      labels = sortedPoints.map(point => point.label);
      dailyData = sortedPoints.map(point => point.value);
    }
    
    this.dailyChart = new Chart(ctx, {
      type: 'line', // Changed to line chart for better visualization of sparse data
      data: {
        labels: labels,
        datasets: [{
          label: 'Doanh thu theo ngày (VNĐ)',
          data: dailyData,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          tension: 0.1, // Slight curve for better readability
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' đ';
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 90,
              minRotation: 45,
              autoSkip: false // Don't automatically skip labels since we're managing them
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
  
  initWeeklyChart(): void {
    const ctx = document.getElementById('weeklyChart') as HTMLCanvasElement;
    
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }
    
    // Create a copy of labels and data to work with
    let labels = [...this.weekRangeLabels];
    let weeklyData = [...this.weeklyRevenueData];
    
    // Determine which points to keep - focus on weeks with data
    const MAX_POINTS_DISPLAY = 30; // Maximum weeks to display on chart
    
    // First, identify weeks with revenue
    const weeksWithRevenue = weeklyData.map((value, index) => ({ 
      index, 
      value, 
      label: labels[index],
      hasRevenue: value > 0
    }));
    
    // Always include the first and last week for context
    if (weeksWithRevenue.length > 0) {
      weeksWithRevenue[0].hasRevenue = true;
      weeksWithRevenue[weeksWithRevenue.length - 1].hasRevenue = true;
    }
    
    // Count weeks with revenue
    const revenuePointsCount = weeksWithRevenue.filter(week => week.hasRevenue).length;
    
    // If we have too many points to display
    if (labels.length > MAX_POINTS_DISPLAY) {
      let pointsToKeep: typeof weeksWithRevenue = [];
      
      // If revenue weeks are less than our max, keep all revenue weeks plus some context
      if (revenuePointsCount <= MAX_POINTS_DISPLAY) {
        // First, include all weeks with revenue
        pointsToKeep = weeksWithRevenue.filter(week => week.hasRevenue);
        
        // Then add some context weeks around revenue weeks if needed
        if (pointsToKeep.length < MAX_POINTS_DISPLAY) {
          // For each revenue week, try to add a week before and after for context
          // (unless they're already included)
          const contextWeeks = new Set<number>(pointsToKeep.map(week => week.index));
          
          // First pass: add immediate adjacent weeks
          for (const week of pointsToKeep) {
            const prevIndex = week.index - 1;
            const nextIndex = week.index + 1;
            
            if (prevIndex >= 0 && !contextWeeks.has(prevIndex) && contextWeeks.size < MAX_POINTS_DISPLAY) {
              contextWeeks.add(prevIndex);
            }
            
            if (nextIndex < weeksWithRevenue.length && !contextWeeks.has(nextIndex) && contextWeeks.size < MAX_POINTS_DISPLAY) {
              contextWeeks.add(nextIndex);
            }
          }
          
          // Convert back to our point format and sort by index
          pointsToKeep = Array.from(contextWeeks)
            .map(idx => weeksWithRevenue[idx])
            .sort((a, b) => a.index - b.index);
        }
      } else {
        // We have too many revenue weeks, need to select a representative sample
        const skipFactor = Math.ceil(revenuePointsCount / MAX_POINTS_DISPLAY);
        
        // Get all revenue weeks
        const revenueWeeks = weeksWithRevenue.filter(week => week.hasRevenue);
        
        // Select evenly distributed revenue weeks
        pointsToKeep = revenueWeeks.filter((week, idx) => 
          idx % skipFactor === 0 || idx === revenueWeeks.length - 1
        );
      }
      
      // Extract the filtered data
      const sortedPoints = pointsToKeep.sort((a, b) => a.index - b.index);
      labels = sortedPoints.map(point => point.label);
      weeklyData = sortedPoints.map(point => point.value);
    }
    
    this.weeklyChart = new Chart(ctx, {
      type: 'line', // Changed to line chart for better visualization of sparse data
      data: {
        labels: labels,
        datasets: [{
          label: 'Doanh thu theo tuần (VNĐ)',
          data: weeklyData,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.1, // Slight curve for better readability
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' đ';
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 90,
              minRotation: 45,
              autoSkip: false // Don't automatically skip labels since we're managing them
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
  
  initMonthlyChart(): void {
    const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    
    // Use the calculated labels or default if empty
    let labels = this.monthlyLabels.length > 0 ? this.monthlyLabels : 
                ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    
    // If there are too many months, consider limiting the display
    const MAX_MONTHS_DISPLAY = 24; // Maximum number of months to display
    let monthlyData = this.monthlyRevenueData;
    
    if (labels.length > MAX_MONTHS_DISPLAY) {
      // Keep only every nth label to reduce clutter, or use other strategies
      const skipFactor = Math.ceil(labels.length / MAX_MONTHS_DISPLAY);
      const filteredLabelsAndData = labels.map((label, index) => ({
        label,
        data: monthlyData[index],
        include: index % skipFactor === 0 || index === labels.length - 1 // Keep first, every nth, and last
      }));
      
      labels = filteredLabelsAndData.filter(item => item.include).map(item => item.label);
      monthlyData = filteredLabelsAndData.filter(item => item.include).map(item => item.data);
    }
    
    this.monthlyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Doanh thu theo tháng (VNĐ)',
          data: monthlyData,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' đ';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
  
  initYearlyChart(): void {
    const ctx = document.getElementById('yearlyChart') as HTMLCanvasElement;
    
    if (this.yearlyChart) {
      this.yearlyChart.destroy();
    }
    
    // Use the calculated labels or generate default if empty
    let labels = this.yearlyLabels.length > 0 ? this.yearlyLabels : 
                (() => {
                  const currentYear = new Date().getFullYear();
                  return Array.from({length: 5}, (_, i) => (currentYear - 4 + i).toString());
                })();
    
    // If there are too many years, consider limiting the display
    const MAX_YEARS_DISPLAY = 15; // Maximum number of years to display
    let yearlyData = this.yearlyRevenueData;
    
    if (labels.length > MAX_YEARS_DISPLAY) {
      // Keep only every nth label to reduce clutter
      const skipFactor = Math.ceil(labels.length / MAX_YEARS_DISPLAY);
      const filteredLabelsAndData = labels.map((label, index) => ({
        label,
        data: yearlyData[index],
        include: index % skipFactor === 0 || index === labels.length - 1 // Keep first, every nth, and last
      }));
      
      labels = filteredLabelsAndData.filter(item => item.include).map(item => item.label);
      yearlyData = filteredLabelsAndData.filter(item => item.include).map(item => item.data);
    }
    
    this.yearlyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Doanh thu theo năm (VNĐ)',
          data: yearlyData,
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' đ';
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
  
  showChart(view: 'day' | 'week' | 'month' | 'year'): void {
    this.currentView = view;
    
    // Hide all charts
    const dailyChartElement = document.getElementById('dailyChartContainer');
    const weeklyChartElement = document.getElementById('weeklyChartContainer');
    const monthlyChartElement = document.getElementById('monthlyChartContainer');
    const yearlyChartElement = document.getElementById('yearlyChartContainer');
    
    if (dailyChartElement) dailyChartElement.style.display = 'none';
    if (weeklyChartElement) weeklyChartElement.style.display = 'none';
    if (monthlyChartElement) monthlyChartElement.style.display = 'none';
    if (yearlyChartElement) yearlyChartElement.style.display = 'none';
    
    // Show selected chart
    switch (view) {
      case 'day':
        if (dailyChartElement) dailyChartElement.style.display = 'block';
        break;
      case 'week':
        if (weeklyChartElement) weeklyChartElement.style.display = 'block';
        break;
      case 'month':
        if (monthlyChartElement) monthlyChartElement.style.display = 'block';
        break;
      case 'year':
        if (yearlyChartElement) yearlyChartElement.style.display = 'block';
        break;
    }
  }
  
  applyDateFilter(): void {
    // Set loading state
    this.isLoading = true;
    
    // Generate new date labels based on the selected date range
    this.generateDateRangeLabels();
    this.generateWeekRangeLabels();
    
    // Re-initialize charts with new data
    this.initializeData();
    
    // For demo, just show a message
    const daysDiff = this.getDaysDifference(new Date(this.startDate), new Date(this.endDate));
    const weekCount = Math.ceil(daysDiff / 7);
    alert(`Đã áp dụng bộ lọc từ ngày ${this.startDate} đến ngày ${this.endDate} (${daysDiff + 1} ngày, ${weekCount} tuần)`);
  }
  
  navigateToOrders(): void {
    // In a real application, this would navigate to the orders page
    window.location.href = '/admin/orders';
  }
  
  // Helper method to get the most common year from filtered orders
  getYearFromFilteredOrders(orders: any[]): number | null {
    if (!orders || orders.length === 0) return null;
    
    // Count occurrences of each year
    const yearCounts: {[year: number]: number} = {};
    
    orders.forEach(order => {
      if (!order.order_time) return;
      
      let orderDate;
      if (typeof order.order_time === 'number') {
        orderDate = new Date(order.order_time);
      } else if (Array.isArray(order.order_time) && order.order_time.length >= 6) {
        const [year] = order.order_time;
        return year;
      } else {
        orderDate = new Date(order.order_time);
      }
      
      const year = orderDate.getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    // Find the most common year
    let mostCommonYear = null;
    let maxCount = 0;
    
    Object.entries(yearCounts).forEach(([year, count]) => {
      if (count > maxCount) {
        mostCommonYear = Number(year);
        maxCount = count;
      }
    });
    
    return mostCommonYear;
  }
}
