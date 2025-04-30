export interface TableBooking{
    id: number;
    user_id: number;
    name: string;
    table_number: number;
    number_of_people: number;
    booking_time: Date;
    status: string;
    phone: string;
    note: string;
    is_active: boolean;
}