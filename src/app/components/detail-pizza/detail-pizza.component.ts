import { Component, OnInit } from '@angular/core';
import { PizzaService } from '../../service/pizza.service';
import { CartService } from '../../service/cart.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Pizza } from '../../model/pizza';
import { environment } from '../../environments/environments';
import { PizzaImage } from '../../model/pizza.image';


@Component({
  selector: 'app-detail-pizza',
  standalone: false,
  templateUrl: './detail-pizza.component.html',
  styleUrl: './detail-pizza.component.scss'
})
export class DetailPizzaComponent implements OnInit {
  pizza?: Pizza;
  pizzaId: number = 0;
  quantity: number = 1;
  isPressedAddToCart:boolean = false;
  sizeId: number = 1;
  typeId: number = 1;
  price: number = 0;
  constructor(
    private pizzaService: PizzaService,
    private cartService: CartService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

   ngOnInit(): void {
    //lay pizzaId tu URL
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    // debugger
    // const idParam = 2;
    if(idParam!==null){
      this.pizzaId = +idParam;
    }
    if(!isNaN(this.pizzaId)){
      this.pizzaService.getDetailPizza(this.pizzaId).subscribe({
        next: (response: any) =>{
          debugger
          if(response.thumbnail && response.pizza_images.length > 0){
            response.url.forEach((pizza_images:PizzaImage)=>{
              pizza_images.image_url = `${environment.apiBaseUrl}/pizzas/images/${pizza_images.image_url}`;
            });
          }
          debugger
          this.pizza = response
          
        },
        complete: ()=>{
          debugger;
        },
        error: (error: any)=>{
          debugger;
          console.error('Error fetching detail:',error);
        }
        
      });
    }else{
      console.error('Invalid pizzaId:', idParam);
    }
  }

  addToCart():void{
    debugger
    this.isPressedAddToCart = true;
    if(this.pizza){
      this.cartService.addToCart(this.pizza.id,this.sizeId, this.typeId, this.quantity, this.price);
    }else{
      console.error('Không thể thêm vào giỏ hàng do sản phẩm không tồn tại');
    }
    
  }

}
