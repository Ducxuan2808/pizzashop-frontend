import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

interface Size {
  id: number;
  name: string;
  extraPrice: number;
}

interface CrustType {
  id: number;
  name: string;
  extraPrice: number;
}

interface Product {
  id: number;
  name: string;
  basePrice: number;
  discountPercent: number;
  image: string;
  description: string;
  inStock: boolean;
}

@Component({
  selector: 'app-pizza-detail',
  standalone: false,
  templateUrl: './pizza-detail.component.html',
  styleUrl: './pizza-detail.component.scss'
})
export class PizzaDetailComponent implements OnInit {
  product: Product = {
    id: 1,
    name: 'Pizza Xúc Xích Ý',
    basePrice: 139000,
    discountPercent: 0,
    image: 'assets/images/pizza-xuc-xich-y.jpg',
    description: `
      <p>Bánh Pizza xúc xích cay kiểu Ý trên nền sốt cà chua mang lại hương vị trộn lẫn giữa cay cay và chua chua.</p>
      <h2>1. Ăn vỏ bánh trước tiên: Nhóm người tạo ảnh hưởng, thích sự khác biệt</h2>
      <p>Đây là kiểu người thường bắt đầu ăn pizza bằng cách cắn phần vỏ bánh trước, sau đó mới ăn đến phần nhân (ăn phần rìa của bánh pizza trước). Cách ăn này khá "lạ", không giống với đa số mọi người nên đôi khi bạn sẽ bắt gặp những ánh mắt ngạc nhiên nhìn mình đấy.</p>
      <p>Nếu thích ăn vỏ bánh pizza trước tiên thì bạn là kiểu người tạo ảnh hưởng, yêu thích sự khác biệt. Bạn không ngần ngại thể hiện cá tính, luôn làm mới bản thân, không giới hạn mình trong bất kỳ một khuôn khổ nào. Chưa kể bạn còn rất nhanh nhẹn, nắm bắt xu hướng nhanh chóng và thân thiện với mọi người.</p>
    `,
    inStock: true
  };

  sizes: Size[] = [
    { id: 1, name: 'Nhỏ 6"', extraPrice: 0 },
    { id: 2, name: 'Vừa 9"', extraPrice: 30000 },
    { id: 3, name: 'Lớn 12"', extraPrice: 60000 }
  ];

  crustTypes: CrustType[] = [
    { id: 1, name: 'Đế mỏng', extraPrice: 0 },
    { id: 2, name: 'Đế dày', extraPrice: 10000 },
    { id: 3, name: 'Đế giòn xốp', extraPrice: 15000 },
    { id: 4, name: 'Đế viền phô mai', extraPrice: 25000 }
  ];

  relatedProducts: Product[] = [
    {
      id: 2,
      name: 'Pizza Puff Gà BBQ Nướng Dứa',
      basePrice: 89000,
      discountPercent: 0,
      image: 'assets/images/pizza-ga-bbq.jpg',
      description: 'Gà nướng dứa cùng phô mai thơm béo và sốt Thousand Island.',
      inStock: true
    },
    {
      id: 3,
      name: 'Pizza Chất Gà Nướng Dứa',
      basePrice: 89000,
      discountPercent: 0,
      image: 'assets/images/pizza-ga-nuong-dua.jpg',
      description: 'Hoà quyện vị giác với thịt gà nướng cùng với dứa và nhiều loại phô mai thượng hạng',
      inStock: true
    },
    {
      id: 4,
      name: 'Pizza Chất Giăm Bông & Thịt Xông Khói',
      basePrice: 89000,
      discountPercent: 0,
      image: 'assets/images/pizza-giam-bong.jpg',
      description: 'Vị truyền thống với thịt xông khói và thịt nguội hoà trộn với cà chua, phô mai và sốt béo',
      inStock: true
    },
    {
      id: 5,
      name: 'Pizza Thịt Nguội & Nấm',
      basePrice: 139000,
      discountPercent: 10,
      image: 'assets/images/pizza-thit-nguoi.jpg',
      description: 'Pizza giăm bông và nấm đem đến cho bạn những trải nghiệm thú vị.',
      inStock: true
    }
  ];

  selectedSizeId: number = 1;
  selectedCrustTypeId: number = 1;
  quantity: number = 1;
  orderNote: string = '';
  
  // Derived values
  get selectedSize(): Size {
    return this.sizes.find(size => size.id === this.selectedSizeId) || this.sizes[0];
  }
  
  get selectedCrustType(): CrustType {
    return this.crustTypes.find(type => type.id === this.selectedCrustTypeId) || this.crustTypes[0];
  }
  
  get selectedPrice(): number {
    const basePrice = this.product.basePrice;
    const discount = this.product.discountPercent > 0 ? (basePrice * this.product.discountPercent / 100) : 0;
    const discountedPrice = basePrice - discount;
    
    return (discountedPrice + this.selectedSize.extraPrice + this.selectedCrustType.extraPrice) * this.quantity;
  }
  
  get originalPrice(): number {
    return (this.product.basePrice + this.selectedSize.extraPrice + this.selectedCrustType.extraPrice) * this.quantity;
  }

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    // In a real app, we would fetch the product ID from the route
    // and load the product data from an API
    this.route.params.subscribe(params => {
      const productId = +params['id'];
      // Here we would call a service to get the product by ID
      console.log('Loading product with ID:', productId);
    });
  }

  selectSize(sizeId: number): void {
    this.selectedSizeId = sizeId;
  }

  selectCrustType(typeId: number): void {
    this.selectedCrustTypeId = typeId;
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

  onQuantityChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = parseInt(target.value);
    
    if (isNaN(value) || value < 1) {
      value = 1;
    } else if (value > 50) {
      value = 50;
    }
    
    this.quantity = value;
    target.value = value.toString();
  }

  addToCart(): void {
    // In a real app, we would call a service to add the product to the cart
    console.log('Adding to cart:', {
      product: this.product,
      size: this.selectedSize,
      crustType: this.selectedCrustType,
      quantity: this.quantity,
      note: this.orderNote,
      totalPrice: this.selectedPrice
    });
    
    // Show success message or navigate to cart page
    alert('Sản phẩm đã được thêm vào giỏ hàng!');
  }

  quickAdd(productId: number): void {
    // In a real app, we would fetch the product details and show a popup
    // or directly add the product to cart with default options
    console.log('Quick adding product with ID:', productId);
    alert(`Đã thêm sản phẩm ID ${productId} vào giỏ hàng!`);
  }
}
