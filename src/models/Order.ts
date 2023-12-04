
import mongoose, { Document } from 'mongoose';

interface IOrder extends Document {
    orderID: string;
    price: Number;
    deliveryAddress: string;
    status: string;
}

const orderSchema = new mongoose.Schema<IOrder>({
    
    orderID: {
        type: String,
        required: true,
        unique: true,
    },
    price: {
        type: Number,
        required: true,
    },
    deliveryAddress: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        required: true,
    }
});

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
