import{
    IsString, 
    IsNotEmpty, 
    IsPhoneNumber, 
    IsDate
    
}from 'class-validator';
export class ReviewDTO{

    user_id: number;
    pizza_id: number;
    orderdetail_id: number;
    rating: number;
    comment: string;
    review_time: Date;


    constructor(data: any){
        this.user_id = data.user_id;
        this.pizza_id = data.pizza_id;
        this.orderdetail_id = data.orderdetail_id;
        this.rating = data.rating;
        this.comment = data.comment;
        this.review_time = data.review_time;
    }
}