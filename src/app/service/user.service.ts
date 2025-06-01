import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterDTO } from '../dtos/user/register.dto';
import { LoginDTO } from '../dtos/user/login.dto';
import { environment } from '../environments/environments';
import { HttpUtilService } from './http.util.service';
import { UserResponse } from '../responses/user/user.response';
import { UpdateUserDTO } from '../dtos/user/update.user.dto';
import { User } from '../model/user';
import { UserAdminDTO } from '../dtos/user/user.admin.dto';
import { ChangPasswordDTO } from '../dtos/user/changePassword.dto';
import { ForgotPasswordDTO } from '../dtos/user/forgotPassword.dto';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiRegister = `${environment.apiBaseUrl}/users/register`;
  private apiLogin = `${environment.apiBaseUrl}/users/login`;
  private apiUserDetail = `${environment.apiBaseUrl}/users/details`;
  private apiUser = `${environment.apiBaseUrl}/users`;
  private apiForgotPassword = `${environment.apiBaseUrl}/users/forgot-password`;
  private apiConfig: { headers: HttpHeaders };
  constructor(private http: HttpClient,
    private httpUtilService: HttpUtilService
  ) {
    this.apiConfig = {
        headers: this.httpUtilService.createHeader()
      };
   }


  register(registerDTO: RegisterDTO):Observable<any>{
    return this.http.post(this.apiRegister, registerDTO,this.apiConfig)
  }

  login(loginDTO: LoginDTO):Observable<any>{
     return this.http.post(this.apiLogin, loginDTO,this.apiConfig)
   }

  getUserDetail(token:string){
    debugger
    console.log(`Bearer ${token}`);
    return this.http.post(this.apiUserDetail,{},{
      headers:new HttpHeaders({
        'Content-Type':'application/json',
        Authorization: `Bearer ${token}`
      })
    })
  }
  saveUserResponseToLocalStorage(userResponse?:UserResponse){
    try{
      debugger
      if(userResponse == null || !userResponse){
        return;
      }
      const userResponseJSON = JSON.stringify(userResponse);
      localStorage.setItem('user',userResponseJSON);
      console.log('User response saved to local storage.');
    } catch (error) {
      console.error('Error saving user response to local storage:', error);
    
    }
  }

  getUserResponseFromLocalStorage(){
    try{
      const userResponseJSON = localStorage.getItem('user');
      if(userResponseJSON== null||userResponseJSON==undefined){
        return null;
      }
      const userResponse = JSON.parse(userResponseJSON);
      console.log('User response retrieved from local storage.');
      return userResponse;
    } catch (error) {
      console.error('Error retrieving user response from local storage:', error);
      return null; // Return null or handle the error as needed
    }
  }
  removeUserFromLocalStorage():void{
    try{
      localStorage.removeItem('user');;
      console.log('User data removed from local storage.');
    } catch (error) {
      console.error('Error removing user data from local storage:', error);
      // Handle the error as needed
    }
  }

  updateUserDetail(token: string, updateUserDTO: UpdateUserDTO) {
    debugger
    let userResponse = this.getUserResponseFromLocalStorage();        
    return this.http.put(`${this.apiUserDetail}/${userResponse?.id}`,updateUserDTO,{
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      })
    })
  }

  getUsers(keyword:string,page:number,limit:number):Observable<User[]>{
    const params = new HttpParams()
    .set('keyword', keyword)
    .set('page', page.toString())
    .set('limit',limit.toString());
    return this.http.get<User[]>(this.apiUser,{ params });
    }

    registerUserAdmin(registerUserAdminDTO: UserAdminDTO):Observable<any>{
      return this.http.post(this.apiRegister, registerUserAdminDTO,this.apiConfig)
    }

    updateUser(updateUserDTO: any): Observable<any> {
      return this.http.put(`${this.apiUser}/${updateUserDTO.id}`, updateUserDTO, this.apiConfig);
    }

    deleteUser(userId: number): Observable<any> {
      return this.http.delete(`${this.apiUser}/${userId}`, {responseType: 'text'});
    }

    forgotPassword(forgotPasswordDTO: ForgotPasswordDTO): Observable<any> {
      debugger       
      return this.http.post(this.apiForgotPassword,forgotPasswordDTO, this.apiConfig);
    }
    
}
