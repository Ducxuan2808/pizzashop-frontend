import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FooterComponent } from './components/footer/footer.component';
import { HttpClientModule } from '@angular/common/http';
import { PizzaComponent } from './components/pizza/pizza.component';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app/app.component';

// Comment out components that might not exist yet or fix their paths
// import { DetailPizzaComponent } from './detail-pizza/detail-pizza.component';
// import { LoginComponent } from './login/login.component';
// import { OrderComponent } from './order/order.component';
// import { OrderConfirmComponent } from './order-confirm/order-confirm.component';
// import { RegisterComponent } from './register/register.component';
// import { UserProfileComponent } from './user-profile/user-profile.component';
 import { TablebookingComponent } from './components/tablebooking/tablebooking.component';
import { CartComponent } from './components/cart/cart.component';
import { MyOrderComponent } from './components/account/my-order/my-order.component';
import { ChangepasswordComponent } from './components/account/changepassword/changepassword.component';
import { OrderComponent } from './components/order/order.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/account/profile/profile.component';
import { PizzaDetailComponent } from './components/pizza-detail/pizza-detail.component';
import { GioithieuComponent } from './components/gioithieu/gioithieu.component';
import { TintucComponent } from './components/tintuc/tintuc.component';
import { QuestionComponent } from './components/question/question.component';
import { LienheComponent } from './components/lienhe/lienhe.component';


@NgModule({
  declarations: [
    AppComponent,
    TablebookingComponent,
    HomeComponent,
     HeaderComponent,
     FooterComponent,
    PizzaComponent,
    CartComponent,
     MyOrderComponent,
     ChangepasswordComponent,
    // AddressesComponent,
    TablebookingComponent,
    //DetailPizzaComponent,
     LoginComponent,
     OrderComponent,
     RegisterComponent,

    ProfileComponent,
     PizzaDetailComponent,
     GioithieuComponent,
     TintucComponent,
     QuestionComponent,
     LienheComponent,
     
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this to support custom elements
})
export class AppModule {}
