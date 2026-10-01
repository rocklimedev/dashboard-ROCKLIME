import { Model as MongoModel } from 'mongoose';
import { Cart } from './schemas/cart.schema';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { AddProductToCartDto, AddToCartDto, ClearCartDto, RemoveFromCartDto, UpdateCartDto } from './dto/cart.dto';
export declare class CartService {
    private readonly cartModel;
    private readonly productModel;
    private readonly userModel;
    constructor(cartModel: MongoModel<Cart>, productModel: typeof Product, userModel: typeof User);
    addProductToCart(dto: AddProductToCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    addToCart(dto: AddToCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    getCart(userId: string): Promise<{
        cart: {
            items: never[];
        };
    } | {
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    removeFromCart(dto: RemoveFromCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateCart(dto: UpdateCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    clearCart(dto: ClearCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    getCartWithFreshPrices(userId: string): Promise<{
        cart: {
            items: never[];
        };
    } | {
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    getAllCarts(): Promise<{
        success: boolean;
        carts: (import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    reduceQuantity(dto: RemoveFromCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, Cart, {}, {}> & Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    convertQuotationToCart(): never;
}
