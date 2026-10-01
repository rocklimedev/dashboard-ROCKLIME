import { CartService } from './cart.service';
import { AddProductToCartDto, AddToCartDto, ClearCartDto, ConvertQuotationToCartDto, RemoveFromCartDto, UpdateCartDto } from './dto/cart.dto';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    addToCart(dto: AddToCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    addProductToCart(dto: AddProductToCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    getAllCarts(): Promise<{
        success: boolean;
        carts: (import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        })[];
    }>;
    removeFromCart(dto: RemoveFromCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    updateCart(dto: UpdateCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    clearCart(dto: ClearCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    reduceQuantity(dto: RemoveFromCartDto): Promise<{
        message: string;
        cart: import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
    convertQuotationToCart(quotationId: string, dto: ConvertQuotationToCartDto): never;
    getCart(userId: string): Promise<{
        cart: {
            items: never[];
        };
    } | {
        cart: import("mongoose").Document<unknown, {}, import("./schemas/cart.schema").Cart, {}, {}> & import("./schemas/cart.schema").Cart & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        };
    }>;
}
