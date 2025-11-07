import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

interface FaqCategory {
  id: number;
  name: string;
}

interface FaqItem {
  id: number;
  categoryId: number;
  question: string;
  answer: string;
  expanded: boolean;
}

@Component({
  selector: 'app-question',
  standalone: false,
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss'
})
export class QuestionComponent implements OnInit {
  categories: FaqCategory[] = [];
  faqs: FaqItem[] = [];
  filteredFaqs: FaqItem[] = [];
  selectedCategoryId: number | null = null;
  searchTerm: string = '';
  expandedFaqId: number | null = null;

  constructor(private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Câu Hỏi Thường Gặp - PizZing pizza');
    this.loadCategories();
    this.loadFaqs();
    this.filteredFaqs = [...this.faqs];
  }

  loadCategories(): void {
    this.categories = [
      { id: 1, name: 'Đặt hàng' },
      { id: 2, name: 'Thanh toán' },
      { id: 3, name: 'Giao hàng' },
      { id: 4, name: 'Sản phẩm' },
      { id: 5, name: 'Tài khoản' }
    ];
  }

  loadFaqs(): void {
    this.faqs = [
      {
        id: 1,
        categoryId: 1,
        question: 'Làm thế nào để đặt hàng trực tuyến?',
        answer: 'Để đặt hàng trực tuyến, bạn chỉ cần truy cập trang web của PizZing pizza, chọn các món ăn mong muốn, thêm vào giỏ hàng và tiến hành thanh toán. Bạn cũng có thể gọi đến hotline của chúng tôi để được hỗ trợ đặt hàng.',
        expanded: false
      },
      {
        id: 2,
        categoryId: 1,
        question: 'Tôi có thể thay đổi hoặc hủy đơn hàng sau khi đã đặt không?',
        answer: 'Bạn có thể thay đổi hoặc hủy đơn hàng trong vòng 5 phút sau khi đặt. Sau thời gian này, vui lòng liên hệ với bộ phận chăm sóc khách hàng của chúng tôi để được hỗ trợ.',
        expanded: false
      },
      {
        id: 3,
        categoryId: 2,
        question: 'PizZing pizza chấp nhận những phương thức thanh toán nào?',
        answer: 'PizZing pizza chấp nhận nhiều phương thức thanh toán khác nhau bao gồm: thanh toán khi nhận hàng (COD), thẻ tín dụng/ghi nợ, ví điện tử như Momo, ZaloPay, và chuyển khoản ngân hàng.',
        expanded: false
      },
      {
        id: 4,
        categoryId: 2,
        question: 'Tôi có nhận được hóa đơn khi mua hàng không?',
        answer: 'Có, bạn sẽ nhận được hóa đơn điện tử qua email sau khi đơn hàng được xác nhận. Nếu bạn cần hóa đơn VAT, vui lòng yêu cầu khi đặt hàng.',
        expanded: false
      },
      {
        id: 5,
        categoryId: 3,
        question: 'Thời gian giao hàng là bao lâu?',
        answer: 'Thời gian giao hàng thông thường là từ 30-45 phút tùy thuộc vào khoảng cách và tình trạng giao thông. Trong giờ cao điểm hoặc điều kiện thời tiết xấu, thời gian giao hàng có thể kéo dài hơn.',
        expanded: false
      },
      {
        id: 6,
        categoryId: 3,
        question: 'Phí giao hàng được tính như thế nào?',
        answer: 'Phí giao hàng được tính dựa trên khoảng cách từ cửa hàng đến địa điểm giao. Đối với đơn hàng có giá trị từ 200.000đ trở lên và trong bán kính 5km, chúng tôi sẽ miễn phí giao hàng.',
        expanded: false
      },
      {
        id: 7,
        categoryId: 4,
        question: 'PizZing pizza có cung cấp sản phẩm cho người ăn chay không?',
        answer: 'Có, chúng tôi có nhiều lựa chọn cho khách hàng ăn chay bao gồm pizza chay với các loại rau củ tươi ngon và nước sốt đặc biệt.',
        expanded: false
      },
      {
        id: 8,
        categoryId: 4,
        question: 'Bánh pizza có kích thước nào?',
        answer: 'PizZing pizza cung cấp 3 kích thước bánh: nhỏ (6 inch), vừa (9 inch) và lớn (12 inch) để phù hợp với nhu cầu của từng khách hàng.',
        expanded: false
      },
      {
        id: 9,
        categoryId: 5,
        question: 'Làm thế nào để tạo tài khoản trên website PizZing pizza?',
        answer: 'Để tạo tài khoản, hãy nhấp vào "Đăng ký" ở góc phải trên cùng của trang web, sau đó điền thông tin cá nhân theo yêu cầu. Sau khi xác nhận qua email, tài khoản của bạn sẽ được kích hoạt.',
        expanded: false
      },
      {
        id: 10,
        categoryId: 5,
        question: 'Tôi quên mật khẩu, phải làm thế nào?',
        answer: 'Nếu bạn quên mật khẩu, hãy nhấp vào "Đăng nhập" sau đó chọn "Quên mật khẩu". Nhập email đã đăng ký và làm theo hướng dẫn để đặt lại mật khẩu mới.',
        expanded: false
      }
    ];
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.filterFaqs();
  }

  onSearch(): void {
    this.filterFaqs();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterFaqs();
  }

  filterFaqs(): void {
    if (!this.searchTerm && this.selectedCategoryId === null) {
      this.filteredFaqs = [...this.faqs];
      return;
    }

    this.filteredFaqs = this.faqs.filter(faq => {
      const matchesCategory = this.selectedCategoryId === null || faq.categoryId === this.selectedCategoryId;
      const matchesSearch = !this.searchTerm || 
        faq.question.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        faq.answer.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }

  toggleFaq(faqId: number): void {
    this.faqs = this.faqs.map(faq => ({
      ...faq,
      expanded: faq.id === faqId ? !faq.expanded : faq.expanded
    }));

    this.filteredFaqs = this.filteredFaqs.map(faq => ({
      ...faq,
      expanded: faq.id === faqId ? !faq.expanded : faq.expanded
    }));
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  }

  getGroupedFaqs() {
    const groupedFaqs: { [key: number]: FaqItem[] } = {};
    
    this.filteredFaqs.forEach(faq => {
      if (!groupedFaqs[faq.categoryId]) {
        groupedFaqs[faq.categoryId] = [];
      }
      groupedFaqs[faq.categoryId].push(faq);
    });
    
    return Object.entries(groupedFaqs).map(([categoryId, faqs]) => ({
      categoryId: parseInt(categoryId),
      categoryName: this.getCategoryName(parseInt(categoryId)),
      faqs
    }));
  }
}
