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
import { ForgotPasswordComponent } from "./components/forgot-password/forgot-password.component";
import { CartComponent } from "./components/cart/cart.component";
import { TablebookingComponent } from "./components/tablebooking/tablebooking.component";
import { OrderComponent } from "./components/order/order.component";
import { LienheComponent } from "./components/lienhe/lienhe.component";
import { QuestionComponent } from "./components/question/question.component";
import { TintucComponent } from "./components/tintuc/tintuc.component";
import { GioithieuComponent } from "./components/gioithieu/gioithieu.component";
import { PaymentCallbackComponent } from "./payment-callback/payment-callback.component";
import { OrdersComponent } from "./components/admin/orders/orders.component";
import { AdminPizzasComponent } from "./components/admin/admin-pizzas/admin-pizzas.component";
import { AdminUsersComponent } from "./components/admin/admin-users/admin-users.component";
import { ThongkeComponent } from "./components/admin/thongke/thongke.component";
import { AdminTablebookingComponent } from "./components/admin/admin-tablebooking/admin-tablebooking.component";
import { AdminMembershipComponent } from "./components/admin/admin-membership/admin-membership.component";
import { AdminTypesComponent } from "./components/admin/admin-types/admin-types.component";
import { AdminSizesComponent } from "./components/admin/admin-sizes/admin-sizes.component";
import { RoleGuard } from "./guards/role.guard";

const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'pizzas', component: PizzaComponent },
    {path: 'pizzas/:id', component: PizzaDetailComponent},
    {path: 'cart', component: CartComponent},
    {path: 'login', component: LoginComponent},
    {path: 'register', component: RegisterComponent},
    {path: 'forgot-password', component: ForgotPasswordComponent},
    {path: 'profile', component: ProfileComponent},
    {path: 'changepassword', component: ChangepasswordComponent},
    {path: 'myorder', component: MyOrderComponent},
    {path: 'tablebooking', component: TablebookingComponent},
    {path: 'order', component: OrderComponent},
    {path: 'tintuc', component: TintucComponent},
    {path: 'question', component: QuestionComponent},
    {path: 'lienhe', component: LienheComponent},
    {path: 'gioithieu', component: GioithieuComponent},
    {path: 'payments/payment-callback', component: PaymentCallbackComponent},
    
    
    // Admin routes with RoleGuard
    {
        path: 'admin/orders', 
        component: OrdersComponent, 
        canActivate: [RoleGuard]
    },
    {
        path: 'admin/pizzas', 
        component: AdminPizzasComponent,
        canActivate: [RoleGuard]
    },
    {
        path: 'admin/users', 
        component: AdminUsersComponent,
        canActivate: [RoleGuard]
    },
    {
        path: 'admin/statistics', 
        component: ThongkeComponent,
        canActivate: [RoleGuard]
    },
    {
        path: 'admin/tablebooking', 
        component: AdminTablebookingComponent,
        canActivate: [RoleGuard]
    },
    {
        path: 'admin/membership', 
        component: AdminMembershipComponent,
        canActivate: [RoleGuard]
    },
    {
        path: 'admin/types', 
        component: AdminTypesComponent,
        canActivate: [RoleGuard]
    },
    {
        path: 'admin/sizes', 
        component: AdminSizesComponent,
        canActivate: [RoleGuard]
    }
];

@NgModule({
    imports:[RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule{}
