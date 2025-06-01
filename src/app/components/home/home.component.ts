import { Component, OnInit } from '@angular/core';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { PizzaService } from '../../service/pizza.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environments';
import { SizeService } from '../../service/size.service';
import { TypeService } from '../../service/type.service';
import { CartService } from '../../service/cart.service';
import { PizzaImage } from '../../model/pizza.image';
import { MessageService } from 'primeng/api';
import { AiChatService, ChatMessage } from '../../service/ai-chat.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [MessageService]
})
export class HomeComponent implements OnInit {
  pizzas:Pizza[] = [];
  sizes: Size[] = [];
  types: Type[] = [];
  minPrice: number = 0;
  maxPrice: number = 10000000;
  sortBy='';
  currentPage: number = 0;
  itemsPerPage: number = 6;
  pages: number[] =[];
  totalPages:number = 0;
  visiblePages: number[] = [];
  keyword:string = "";
  
  // Popup related properties
  selectedPizza: Pizza | null = null;
  selectedSizeId: number = 0;
  selectedTypeId: number = 0;
  selectedPizzaPrice: number = 0;
  orderNote: string = '';
  popupVisible: boolean = false;
  quantity: number = 1;

  // AI Chat related properties
  isChatOpen: boolean = false;
  isChatMinimized: boolean = true;
  userMessage: string = '';
  chatMessages: ChatMessage[] = [];
  isLoading: boolean = false;
  showQuickQuestions: boolean = true;

  // Quick questions for AI chat
  quickQuestions = [
    {
      id: 'greeting',
      text: '👋 Xin chào',
      answer: 'Xin chào! Chào mừng bạn đến với PizZing - Cửa hàng pizza số 1 tại Việt Nam! 🍕\n\nTôi có thể giúp bạn:\n• Tư vấn về sản phẩm pizza\n• Hướng dẫn đặt hàng\n• Thông tin về khuyến mãi\n• Chính sách giao hàng\n\nBạn cần tôi hỗ trợ gì nào? 😊'
    },
    {
      id: 'about',
      text: '🍕 PizZing là gì?',
      answer: 'PizZing là chuỗi cửa hàng pizza hàng đầu tại Việt Nam! 🇻🇳\n\n🌟 Chúng tôi tự hào với:\n• Pizza được làm từ nguyên liệu tươi ngon nhất\n• Đế pizza giòn rụm, phô mai kéo sợi\n• Hơn 20+ loại pizza đa dạng\n• Giao hàng nhanh chóng trong 30 phút\n• Phục vụ 24/7\n\n💝 Sứ mệnh: Mang đến những chiếc pizza ngon nhất với giá cả hợp lý cho mọi gia đình Việt!'
    },
    {
      id: 'hot-products',
      text: '🔥 Sản phẩm hot',
      answer: 'Đây là top 4 pizza bán chạy nhất tại PizZing! 🔥\n\n🍕 **Pizza Margherita Classic**\n- Phô mai Mozzarella, cà chua, húng quế tươi\n- Giá từ 149,000đ\n\n🍕 **Pizza Pepperoni Supreme**\n- Xúc xích Pepperoni, phô mai, ớt chuông\n- Giá từ 179,000đ\n\n🍕 **Pizza Hải Sản Đặc Biệt**\n- Tôm, mực, cua, phô mai đặc biệt\n- Giá từ 229,000đ\n\n🍕 **Pizza Thịt Nướng BBQ**\n- Thịt nướng BBQ, hành tây, phô mai\n- Giá từ 199,000đ\n\n💰 Đặt ngay để nhận ưu đãi!'
    },
    {
      id: 'order-guide',
      text: '📖 Hướng dẫn đặt hàng',
      answer: 'Hướng dẫn đặt hàng pizza tại PizZing rất đơn giản! 📱\n\n**Bước 1:** Chọn pizza yêu thích\n• Click vào pizza để xem chi tiết\n• Chọn size (S, M, L, XL)\n• Chọn loại đế (Mỏng, Dày, Phô mai)\n\n**Bước 2:** Thêm vào giỏ hàng\n• Điều chỉnh số lượng\n• Thêm ghi chú đặc biệt (nếu có)\n• Click "Thêm vào giỏ"\n\n**Bước 3:** Thanh toán\n• Kiểm tra giỏ hàng\n• Nhập thông tin giao hàng\n• Chọn phương thức thanh toán\n• Hoàn tất đặt hàng\n\n🚚 Giao hàng trong 30 phút!\n💳 Thanh toán: COD hoặc VNPay'
    },
    {
      id: 'promotion',
      text: '🎁 Khuyến mãi hiện tại',
      answer: 'Những khuyến mãi siêu hấp dẫn đang diễn ra! 🎉\n\n🔥 **Flash Sale Cuối Tuần**\n• Giảm 30% tất cả pizza size L\n• Áp dụng: Thứ 7 - Chủ nhật\n\n👥 **Combo Gia Đình**\n• 2 Pizza + 2 Nước ngọt = Chỉ 299,000đ\n• Tiết kiệm đến 100,000đ\n\n🆕 **Khách hàng mới**\n• Giảm 20% đơn hàng đầu tiên\n• Freeship cho đơn từ 200,000đ\n\n💎 **Thành viên VIP**\n• Tích điểm mỗi đơn hàng\n• Đổi điểm lấy pizza miễn phí\n\n⏰ Ưu đãi có hạn, đặt ngay!'
    },

  ];

  constructor(
    private pizzaService: PizzaService,
    private router: Router,
    private sizeService: SizeService,
    private typeService: TypeService,
    private cartService: CartService,
    private messageService: MessageService,
    private aiChatService: AiChatService
  ) {}

  ngOnInit(): void {
    // First, load sizes
    this.sizeService.getSizes().subscribe({
      next: (sizes: Size[]) => {
        this.sizes = sizes;
        console.log('Sizes loaded:', this.sizes);
        
        // Then load types
        this.typeService.getTypes().subscribe({
          next: (types: Type[]) => {
            this.types = types;
            console.log('Types loaded:', this.types);
            
            // Once both are loaded, fetch pizzas
            this.getPizzas();
          },
          error: (error: any) => {
            console.error('Error fetching types', error);
            this.types = [];
          }
        });
      },
      error: (error: any) => {
        console.error('Error fetching sizes', error);
        this.sizes = [];
      }
    });

    // Load chat history
    this.chatMessages = this.aiChatService.getChatHistory();
    // Always show quick questions
    this.showQuickQuestions = true;
  }

  getPizzas() {
    this.pizzaService.bestSellPizzas().subscribe({
      next: (response:any) =>{
        response.pizzas.forEach((pizza: Pizza) => { 
          if(pizza.pizza_images && pizza.pizza_images.length > 0) {
            pizza.pizza_images.forEach((pizza_image: PizzaImage) => {
              pizza_image.image_url = `${environment.apiBaseUrl}/pizzas/images/${pizza_image.image_url}`;
            });
            pizza.url = pizza.pizza_images[pizza.pizza_images.length - 1 ].image_url;
          }
          // Set URL for main image if not already set
          if (!pizza.url) {
            pizza.url = `${environment.apiBaseUrl}/pizzas/images/${pizza.thumbnail}`;
          }
        });
        this.pizzas = response.pizzas.slice(0, 4); // Get only the first 4 pizzas
      },
      complete: ()=>{
        console.log('Completed fetching best selling pizzas');
      },
      error: (error: any)=>{
        console.error('Error fetching products', error);
      }
    });
  }
  
  getPriceByIds(pizzaId: number, sizeId: number, typeId: number): number {
    const pizza = this.pizzas.find(pizza => pizza.id === pizzaId);
    const size = this.sizes.find(size => size.id === sizeId);
    const type = this.types.find(type => type.id === typeId);

    if(pizza && size && type) {
      return pizza.base_price * size.price_multiplier + type.price;
    }
    return pizza?.base_price ?? 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }

  openPopup(pizza: Pizza): void {
    console.log('Opening popup for pizza:', pizza);
    
    // Check if sizes and types are loaded
    if (!this.sizes || this.sizes.length === 0) {
      console.warn('No sizes available');
      return;
    }
    
    if (!this.types || this.types.length === 0) {
      console.warn('No types available');
      return;
    }
    
    this.selectedPizza = pizza;
    this.selectedSizeId = this.sizes[0].id;
    this.selectedTypeId = this.types[0].id;
    this.selectedPizzaPrice = this.getPriceByIds(pizza.id, this.selectedSizeId, this.selectedTypeId);
    this.orderNote = '';
    this.quantity = 1;
    this.popupVisible = true;
  }

  closePopup(): void {
    this.popupVisible = false;
    this.selectedPizza = null;
    this.selectedSizeId = 0;
    this.selectedTypeId = 0;
    this.selectedPizzaPrice = 0;
    this.orderNote = '';
    this.quantity = 1;
  }

  selectSize(sizeId: number): void {
    this.selectedSizeId = sizeId;
    if (this.selectedPizza) {
      this.selectedPizzaPrice = this.getPriceByIds(
        this.selectedPizza.id,
        this.selectedSizeId,
        this.selectedTypeId
      );
    }
  }

  selectType(typeId: number): void {
    this.selectedTypeId = typeId;
    if (this.selectedPizza) {
      this.selectedPizzaPrice = this.getPriceByIds(
        this.selectedPizza.id,
        this.selectedSizeId,
        this.selectedTypeId
      );
    }
  }

  updateOrderNote(event: any): void {
    this.orderNote = event.target.value;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  increaseQuantity(): void {
    if (this.quantity < 50) {
      this.quantity++;
    }
  }

  addToCart(): void {
    if (!this.selectedPizza) return;
    
    // Create cart item object
    const selectedSize = this.sizes.find(s => s.id === this.selectedSizeId);
    const selectedType = this.types.find(t => t.id === this.selectedTypeId);
    
    if (!selectedSize || !selectedType) return;
    
    const cartItem = {
      pizzaId: this.selectedPizza.id,
      sizeId: this.selectedSizeId,
      typeId: this.selectedTypeId,
      quantity: this.quantity,
      price: this.selectedPizzaPrice
    };
    
    // Add to cart using CartService
    this.cartService.addToCart(cartItem);
    
    this.closePopup();
    
    // Show a success message
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã thêm sản phẩm vào giỏ hàng'
    });
  }

  // AI Chat methods
  toggleChat(): void {
    this.isChatMinimized = !this.isChatMinimized;
    if (!this.isChatMinimized) {
      // When opening the chat, scroll to the bottom
      setTimeout(() => this.scrollChatToBottom(), 0);
      // Always show quick questions
      this.showQuickQuestions = true;
    }
  }

  closeChat(): void {
    this.isChatMinimized = true;
  }

  // Handle quick question click
  selectQuickQuestion(question: any): void {
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: question.text,
      timestamp: new Date()
    };
    this.chatMessages.push(userMessage);

    // Scroll to bottom immediately after user message
    setTimeout(() => this.scrollChatToBottom(), 50);

    // Add bot response
    setTimeout(() => {
      const botMessage: ChatMessage = {
        role: 'assistant',
        content: question.answer,
        timestamp: new Date()
      };
      this.chatMessages.push(botMessage);
      
      // Save to service
      this.aiChatService.addMessageToHistory(userMessage);
      this.aiChatService.addMessageToHistory(botMessage);
      
      // Scroll to bottom after bot message
      setTimeout(() => this.scrollChatToBottom(), 50);
    }, 500);
  }

  sendMessage(): void {
    if (!this.userMessage.trim()) return;
    
    const message = this.userMessage.trim();
    this.userMessage = '';
    
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.chatMessages.push(userMessage);
    this.aiChatService.addMessageToHistory(userMessage);
    
    // Scroll to bottom after user message
    setTimeout(() => this.scrollChatToBottom(), 50);
    
    // Check if it's a predefined question
    const quickQuestion = this.quickQuestions.find(q => 
      message.toLowerCase().includes(q.text.toLowerCase().replace(/[^\w\s]/gi, '')) ||
      this.isQuestionSimilar(message, q.text)
    );
    
    if (quickQuestion) {
      // Use predefined answer
      setTimeout(() => {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: quickQuestion.answer,
          timestamp: new Date()
        };
        this.chatMessages.push(botMessage);
        this.aiChatService.addMessageToHistory(botMessage);
        setTimeout(() => this.scrollChatToBottom(), 50);
      }, 500);
    } else {
      // Default response for unrecognized questions
      setTimeout(() => {
        const botMessage: ChatMessage = {
          role: 'assistant',
          content: 'Xin lỗi, tôi không hiểu câu hỏi của bạn. 😅\n\nVui lòng chọn một trong các câu hỏi có sẵn hoặc liên hệ trực tiếp với chúng tôi:\n📞 Hotline: 1900-1234\n📧 Email: support@pizzing.vn\n\nTôi có thể giúp bạn về:\n• Thông tin sản phẩm\n• Hướng dẫn đặt hàng\n• Chính sách giao hàng\n• Khuyến mãi hiện tại',
          timestamp: new Date()
        };
        this.chatMessages.push(botMessage);
        this.aiChatService.addMessageToHistory(botMessage);
        setTimeout(() => this.scrollChatToBottom(), 50);
      }, 500);
    }
  }

  // Helper method to check if question is similar to predefined ones
  private isQuestionSimilar(userQuestion: string, predefinedQuestion: string): boolean {
    const userWords = userQuestion.toLowerCase().split(' ');
    const predefinedWords = predefinedQuestion.toLowerCase().replace(/[^\w\s]/gi, '').split(' ');
    
    // Check for key words match
    const keyWords = ['pizza', 'pizzing', 'giao hàng', 'đặt hàng', 'khuyến mãi', 'sản phẩm', 'hot'];
    
    for (let keyword of keyWords) {
      if (userWords.some(word => word.includes(keyword)) && 
          predefinedWords.some(word => word.includes(keyword))) {
        return true;
      }
    }
    return false;
  }

  clearChat(): void {
    this.aiChatService.clearChatHistory();
    this.chatMessages = [];
    // Quick questions always remain visible
  }

  scrollChatToBottom(): void {
    const chatMessages = document.querySelector('.chat-messages');
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  onPizzaClick(pizzaId: number) {
    this.router.navigate(['/pizzas', pizzaId]);
  }
}
