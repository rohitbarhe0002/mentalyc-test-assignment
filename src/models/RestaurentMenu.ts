
import mongoose, { Document } from 'mongoose';

interface IRestaurentMenu extends Document {
    id: string;
    name: string;
    price: Number;
    quantity: Number;
}

const RestaurentMenuSchema = new mongoose.Schema<IRestaurentMenu>({
    id:{
        type:String,
        required:true,   
    },
    name:{
        type:String,
        required:true,   
    },
    price:{
        type:Number,
        required:true,
    },
    quantity:{
        type:Number,
        default:1,
        required:true
    }
});

const RestaurentMenu = mongoose.model<IRestaurentMenu>('RestaurentMenu', RestaurentMenuSchema);

export default RestaurentMenu;
