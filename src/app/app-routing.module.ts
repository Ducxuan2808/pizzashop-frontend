import { NgModule, importProvidersFrom } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./components/home/home.component";
import { PizzaComponent } from "./components/pizza/pizza.component";
import { PizzaDetailComponent } from "./components/pizza-detail/pizza-detail.component";
import { MyOrderComponent } from "./components/account/my-order/my-order.component";
import { ChangepasswordComponent } from "./components/account/changepassword/changepassword.component";
import { ProfileComponent } from "./components/account/profile/profile.component";
import { RegisterComponent } from "./components/register/register.component";
import { LoginComponent } from "./components/login/login.component";
import { CartComponent } from "./components/cart/cart.component";
import { TablebookingComponent } from "./components/tablebooking/tablebooking.component";
import { OrderComponent } from "./components/order/order.component";
import { LienheComponent } from "./components/lienhe/lienhe.component";
import { QuestionComponent } from "./components/question/question.component";
import { TintucComponent } from "./components/tintuc/tintuc.component";
import { GioithieuComponent } from "./components/gioithieu/gioithieu.component";

const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'pizzas', component: PizzaComponent },
    {path: 'pizzas/:id', component: PizzaDetailComponent},
    {path: 'cart', component: CartComponent},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'profile', component: ProfileComponent},
    {path: 'changepassword', component: ChangepasswordComponent},
    {path: 'myorder', component: MyOrderComponent},
    {path: 'tablebooking', component: TablebookingComponent},
    {path: 'order', component: OrderComponent},
    {path: 'tintuc', component: TintucComponent},
    {path: 'question', component: QuestionComponent},
    {path: 'lienhe', component: LienheComponent},
    {path: 'gioithieu', component: GioithieuComponent}
    
];

@NgModule({
    imports:[RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule{}
