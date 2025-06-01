import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './components/home/home.component';
import { HeaderComponent } from './components/header/header.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FooterComponent } from './components/footer/footer.component';
import { PizzaComponent } from './components/pizza/pizza.component';
import { AppRoutingModule } from './app-routing.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app/app.component';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { 
  provideHttpClient, 
  HttpClientModule, 
  HTTP_INTERCEPTORS } from '@angular/common/http';
// PrimeNG Modules
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';

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
import { PaymentCallbackComponent } from './payment-callback/payment-callback.component';
import { AdminHeaderComponent } from './components/admin/admin-header/admin-header.component';
import { OrdersComponent } from './components/admin/orders/orders.component';
import { ThongkeComponent } from './components/admin/thongke/thongke.component';
import { AdminPizzasComponent } from './components/admin/admin-pizzas/admin-pizzas.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { DashboardComponent } from './components/admin/dashboard/dashboard.component';
import { AdminTablebookingComponent } from './components/admin/admin-tablebooking/admin-tablebooking.component';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { MessageService } from 'primeng/api';
import { AdminMembershipComponent } from './components/admin/admin-membership/admin-membership.component';
import { AdminTypesComponent } from './components/admin/admin-types/admin-types.component';
import { AdminSizesComponent } from './components/admin/admin-sizes/admin-sizes.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

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
    PaymentCallbackComponent,
    AdminHeaderComponent,
    OrdersComponent,
    ThongkeComponent,
    AdminPizzasComponent,
    AdminUsersComponent,
    DashboardComponent,
    AdminTablebookingComponent,
    AdminMembershipComponent,
    AdminTypesComponent,
    AdminSizesComponent,
    ForgotPasswordComponent
  ],
  imports: [
    BrowserModule,
    ToastModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    CommonModule,
    NgbModule,
    RouterModule,
    ReactiveFormsModule,
    AppRoutingModule,
    
    // PrimeNG Modules
   
    ConfirmDialogModule,
    ButtonModule
  ],
  providers: [
    { //provide: DOCUMENT, 
      //useFactory: () => document,
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
      
    },
    MessageService
  ],
  bootstrap: [
    AppComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Add this to support custom elements
})
export class AppModule {}
