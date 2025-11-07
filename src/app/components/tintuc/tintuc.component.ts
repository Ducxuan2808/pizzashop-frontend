import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

// News category interface
interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

// News article interface
interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string;
  publishDate: Date;
  categoryId: number;
  featured: boolean;
}

@Component({
  selector: 'app-tintuc',
  standalone: false,
  templateUrl: './tintuc.component.html',
  styleUrl: './tintuc.component.scss'
})
export class TintucComponent implements OnInit {
  pageTitle: string = 'Tin tức';
  
  // News data
  allNews: NewsArticle[] = [];
  displayedNews: NewsArticle[] = [];
  featuredNews: NewsArticle[] = [];
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  
  // Categories
  categories: NewsCategory[] = [];
  selectedCategoryId: number | null = null;
  
  // Search
  searchTerm: string = '';

  constructor(private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Tin tức - PizZing pizza');
    this.loadCategories();
    this.loadNews();
    this.applyFilters();
  }

  loadCategories(): void {
    this.categories = [
      { id: 1, name: 'Tin tức mới', slug: 'tin-tuc-moi', count: 12 },
      { id: 2, name: 'Khuyến mãi', slug: 'khuyen-mai', count: 8 },
      { id: 3, name: 'Món ăn mới', slug: 'mon-an-moi', count: 6 },
      { id: 4, name: 'Cửa hàng', slug: 'cua-hang', count: 4 },
      { id: 5, name: 'Sự kiện', slug: 'su-kien', count: 5 }
    ];
  }

  loadNews(): void {
    const sampleNews: NewsArticle[] = [
      {
        id: 1,
        title: 'Khai trương cửa hàng Pizza mới tại Quận 7',
        slug: 'khai-truong-cua-hang-pizza-moi-tai-quan-7',
        summary: 'Chúng tôi vui mừng thông báo khai trương cửa hàng Pizza mới tại Quận 7, TP. Hồ Chí Minh với nhiều ưu đãi hấp dẫn.',
        content: 'Nội dung chi tiết về sự kiện khai trương...',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-10-15'),
        categoryId: 4,
        featured: true
      },
      {
        id: 2,
        title: 'Khuyến mãi đặc biệt nhân dịp 20/11',
        slug: 'khuyen-mai-dac-biet-nhan-dip-20-11',
        summary: 'Nhân dịp 20/11, chúng tôi gửi đến quý khách hàng chương trình khuyến mãi đặc biệt khi đặt Pizza.',
        content: 'Chi tiết chương trình khuyến mãi 20/11...',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-11-10'),
        categoryId: 2,
        featured: true
      },
      {
        id: 3,
        title: 'Ra mắt Pizza hương vị mới - Pizza Hải Sản Pesto',
        slug: 'ra-mat-pizza-huong-vi-moi-pizza-hai-san-pesto',
        summary: 'Chúng tôi vừa ra mắt hương vị Pizza mới - Pizza Hải Sản Pesto với hương vị độc đáo và hấp dẫn.',
        content: 'Chi tiết về Pizza Hải Sản Pesto...',
        image: 'https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-09-28'),
        categoryId: 3,
        featured: false
      },
      {
        id: 4,
        title: 'Tuyển dụng nhân viên phục vụ tại các cửa hàng',
        slug: 'tuyen-dung-nhan-vien-phuc-vu-tai-cac-cua-hang',
        summary: 'Chúng tôi đang tuyển dụng nhân viên phục vụ tại các cửa hàng trên toàn quốc với nhiều chế độ đãi ngộ hấp dẫn.',
        content: 'Chi tiết về tuyển dụng...',
        image: 'https://images.unsplash.com/photo-1625409293436-be2f4133019d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-10-05'),
        categoryId: 1,
        featured: false
      },
      {
        id: 5,
        title: 'Lịch sử hình thành và phát triển của món pizza',
        slug: 'lich-su-hinh-thanh-va-phat-trien-cua-mon-pizza',
        summary: 'Câu chuyện thú vị về nguồn gốc và quá trình phát triển của món pizza từ ẩm thực đường phố Ý đến món ăn toàn cầu.',
        content: 'Nội dung chi tiết về lịch sử hình thành và phát triển của món pizza...',
        image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-11-25'),
        categoryId: 5,
        featured: true
      },
      {
        id: 6,
        title: 'Pizza và sức khỏe: Những điều bạn cần biết',
        slug: 'pizza-va-suc-khoe-nhung-dieu-ban-can-biet',
        summary: 'Phân tích giá trị dinh dưỡng của pizza và cách thưởng thức pizza một cách cân bằng cho sức khỏe.',
        content: 'Nội dung chi tiết về pizza và sức khỏe...',
        image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-11-20'),
        categoryId: 2,
        featured: true
      },
      {
        id: 7,
        title: 'Xu hướng pizza thân thiện với môi trường',
        slug: 'xu-huong-pizza-than-thien-voi-moi-truong',
        summary: 'Khám phá cách các nhà hàng pizza đang chuyển đổi sang các nguyên liệu và quy trình thân thiện với môi trường.',
        content: 'Nội dung chi tiết về xu hướng pizza thân thiện với môi trường...',
        image: 'https://images.unsplash.com/photo-1561350111-7daa4f284bc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-11-15'),
        categoryId: 5,
        featured: true
      },
      {
        id: 8,
        title: 'Cuộc thi làm bánh pizza sáng tạo 2023',
        slug: 'cuoc-thi-lam-banh-pizza-sang-tao-2023',
        summary: 'Thông tin về cuộc thi làm bánh pizza sáng tạo sắp diễn ra với nhiều giải thưởng hấp dẫn.',
        content: 'Nội dung chi tiết về cuộc thi làm bánh pizza sáng tạo...',
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-11-10'),
        categoryId: 3,
        featured: true
      },
      {
        id: 9,
        title: 'Pizza và rượu vang: Sự kết hợp hoàn hảo',
        slug: 'pizza-va-ruou-vang-su-ket-hop-hoan-hao',
        summary: 'Hướng dẫn ghép cặp rượu vang phù hợp với các loại pizza khác nhau để tạo nên trải nghiệm ẩm thực tuyệt vời.',
        content: 'Nội dung chi tiết về pizza và rượu vang...',
        image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-11-05'),
        categoryId: 2,
        featured: true
      },
      {
        id: 10,
        title: 'Giới thiệu đầu bếp mới: Chuyên gia pizza từ Ý',
        slug: 'gioi-thieu-dau-bep-moi-chuyen-gia-pizza-tu-y',
        summary: 'Pizza Shop vừa đón chào đầu bếp mới đến từ Ý với hơn 20 năm kinh nghiệm làm bánh pizza truyền thống.',
        content: 'Nội dung chi tiết về đầu bếp mới...',
        image: 'https://images.unsplash.com/photo-1605478371310-a9f1e96b4ff4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-11-01'),
        categoryId: 1,
        featured: true
      },
      {
        id: 11,
        title: 'Tuyển dụng nhân viên phục vụ và đầu bếp',
        slug: 'tuyen-dung-nhan-vien-phuc-vu-va-dau-bep',
        summary: 'Pizza Shop đang tuyển dụng nhiều vị trí nhân viên phục vụ và đầu bếp cho các chi nhánh mới mở rộng.',
        content: 'Nội dung chi tiết về tuyển dụng...',
        image: 'https://images.unsplash.com/photo-1576096876569-414a1750a174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-10-25'),
        categoryId: 3,
        featured: true
      },
      {
        id: 12,
        title: 'Workshop: Học làm bánh pizza cùng chuyên gia',
        slug: 'workshop-hoc-lam-banh-pizza-cung-chuyen-gia',
        summary: 'Thông tin về workshop học làm bánh pizza sắp diễn ra tại Pizza Shop với sự hướng dẫn của các chuyên gia đầu ngành.',
        content: 'Nội dung chi tiết về workshop...',
        image: 'https://images.unsplash.com/photo-1506354666786-959d6d497f1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80',
        publishDate: new Date('2023-10-20'),
        categoryId: 2,
        featured: true
      }
    ];
    
    // Sort by date (newest first)
    this.allNews = sampleNews.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
    
    // Extract featured news
    this.featuredNews = this.allNews.filter(news => news.featured).slice(0, 3);
    
    // Calculate total pages
    this.calculateTotalPages();
  }

  // Apply filters (search term and category)
  applyFilters(): void {
    let filtered = [...this.allNews];
    
    // Filter by category if selected
    if (this.selectedCategoryId !== null) {
      filtered = filtered.filter(item => item.categoryId === this.selectedCategoryId);
    }
    
    // Filter by search term
    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.summary.toLowerCase().includes(term)
      );
    }
    
    // Update filtered news
    this.displayedNews = this.getPaginatedResults(filtered);
    
    // Recalculate total pages
    this.calculateTotalPages(filtered.length);
  }
  
  // Handle search
  onSearch(): void {
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }
  
  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }
  
  // Select category
  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }
  
  // Pagination methods
  getPaginatedResults(data: NewsArticle[]): NewsArticle[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return data.slice(startIndex, startIndex + this.itemsPerPage);
  }
  
  calculateTotalPages(totalItems?: number): void {
    const items = totalItems || this.allNews.length;
    this.totalPages = Math.ceil(items / this.itemsPerPage);
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }
  
  // Get page numbers for pagination
  getPageNumbers(): number[] {
    const pages: number[] = [];
    
    // Show max 5 page numbers
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    // Adjust start page if end page is maxed out
    if (endPage === this.totalPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  // Format date
  formatDate(date: Date): string {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Toggle submenu for categories (if needed)
  toggleSubmenu(event: Event): void {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.classList.toggle('active');
    
    const submenu = target.nextElementSibling as HTMLElement;
    if (submenu && submenu.classList.contains('submenu')) {
      submenu.classList.toggle('open');
    }
  }
}
