export interface TableBooking{
    id: number;
    user_id: number;
    name: string;
    table_number: Number;
    number_of_people: string;
    booking_time: Date;
    status: string;
    phone: string;
    note: string;
    is_active: boolean;
}