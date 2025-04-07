import { Component, OnInit } from '@angular/core';
import { Pizza } from '../../model/pizza';
import { Size } from '../../model/size';
import { Type } from '../../model/type';
import { PizzaService } from '../../service/pizza.service';
import { Router } from '@angular/router';
import { max } from 'class-validator';
import { environment } from '../../environments/environments';


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  pizzas:Pizza[] = [];
  sizes: Size[] = [];
  type: Type[] = [];
  minPrice: number = 0;
  maxPrice: number = 10000000;
  sortBy='';
  currentPage: number = 0;
  itemsPerPage: number = 6;
  pages: number[] =[];
  totalPages:number = 0;
  visiblePages: number[] = [];
  keyword:string = "";

  constructor(
    private pizzaService: PizzaService,
    private router :Router
  ) {}

  ngOnInit(): void {
    this.getPizzas(this.sortBy, this.minPrice, this.maxPrice, this.keyword, this.currentPage, this.itemsPerPage);
  }

  searchPizzas(){
    this.currentPage = 0;
    this.itemsPerPage = 6;
    debugger
    this.getPizzas(this.sortBy, this.minPrice, this.maxPrice, this.keyword, this.currentPage, this.itemsPerPage);
  }


  getPizzas(sortBy: string, minPrice: number, maxPrice: number, keyword: string, currentPage: number, itemsPerPage: number) {
    debugger
    this.pizzaService.getProducts(sortBy, minPrice, maxPrice, keyword, currentPage, itemsPerPage).subscribe({
      next: (response:any) =>{
        debugger
        response.pizzas.forEach((pizza: Pizza) => { pizza.url=
          `${environment.apiBaseUrl}/pizzas/images/${pizza.thumbnail}`;
        });
        this.pizzas = response.pizzas;
        this.totalPages = response.totalPages;
        this.visiblePages = this.generateVisiblePageArray(this.currentPage, this.totalPages);

      },
      complete: ()=>{
        debugger;
      },
      error: (error: any)=>{
        debugger;
        console.error('Error fetching products', error);
      }
    });
  }  onPageChange(page: number){
    debugger;
    this.currentPage = page;
    this.getPizzas(this.sortBy, this.minPrice, this.maxPrice, this.keyword, this.currentPage, this.itemsPerPage);
  }
  generateVisiblePageArray(currentPage:number, totalPages:number):number[] {
    const maxVisiablePages = 5;
    const halfVisiablePages = Math.floor(maxVisiablePages /2);

    let startPage = Math.max(currentPage - halfVisiablePages, 1);
    let endPage = Math.min(currentPage + halfVisiablePages- 1, totalPages);

    if(endPage- startPage +1 < maxVisiablePages){
      startPage = Math.max(endPage-maxVisiablePages+1,1 );
    }
    return new Array(endPage-startPage +1).fill(0).map((_,index) => startPage+ index);
  }
  onProductClick(pizzzaId: number){
    debugger
    this.router.navigate(['/pizzas', pizzzaId]);
  }

}
