import { NextFunction, Request, RequestHandler, Response } from 'express';
import { z, ZodType } from 'zod';

type Source = 'body' | 'query' | 'params';
const text = () => z.string().trim();
const requiredText = (message: string) => text().min(1, message);
const optionalText = () => text().optional();
const mongoId = (message: string) => text().regex(/^[a-f\d]{24}$/i, message);
const nonNegativeNumber = (message: string) => z.coerce.number().min(0, message);
const nonNegativeInteger = (message: string) => z.coerce.number().int().min(0, message);
const positiveInteger = (message: string) => z.coerce.number().int().min(1, message);
const objectSchema = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough();

const validator = (schemas: Partial<Record<Source, ZodType>>): RequestHandler => (req, res, next) => {
  const errors: Array<{ type: string; path: string; msg: string }> = [];
  for (const source of ['body', 'query', 'params'] as Source[]) {
    const schema = schemas[source];
    if (!schema) continue;
    const result = schema.safeParse(req[source]);
    if (result.success) {
      (req as Request & Record<Source, unknown>)[source] = result.data;
    } else {
      errors.push(...result.error.issues.map((issue) => ({ type: 'field', path: issue.path.join('.') || source, msg: issue.message })));
    }
  }
  if (errors.length) {
    res.status(422).json({ success: false, message: 'Validation failed', errors });
    return;
  }
  next();
};

export const validateRequest: RequestHandler = (_req, _res, next) => next();
const bodyValidator = <T extends z.ZodRawShape>(shape: T) => validator({ body: objectSchema(shape) });
const bodyParamsValidator = <B extends z.ZodRawShape, P extends z.ZodRawShape>(body: B, params: P) => validator({ body: objectSchema(body), params: objectSchema(params) });
const paramsValidator = <T extends z.ZodRawShape>(shape: T) => validator({ params: objectSchema(shape) });

export const authRegisterValidator = bodyValidator({ name: requiredText('Name is required'), email: text().email('Valid email is required'), password: text().min(6, 'Password must be at least 6 characters'), phone: requiredText('Phone is required') });
export const authLoginValidator = bodyValidator({ email: text().email('Valid email is required'), password: text().min(6, 'Password must be at least 6 characters') });
export const googleLoginValidator = bodyValidator({ credential: requiredText('Google credential is required') });
export const authVerifyOtpValidator = bodyValidator({ otp: text().length(6, 'OTP must be 6 digits') });
export const forgotPasswordValidator = bodyValidator({ email: text().email('Valid email is required') });
export const resetPasswordValidator = bodyParamsValidator({ password: text().min(6, 'Password must be at least 6 characters'), confirmPassword: requiredText('Please confirm your password') }, { token: requiredText('Reset token is required') });

export const contactMessageValidator = bodyValidator({ name: requiredText('Name is required'), email: text().email('Valid email is required'), subject: requiredText('Subject is required'), message: requiredText('Message is required'), phone: optionalText() });
export const updateMessageStatusValidator = bodyValidator({ status: requiredText('Status is required'), reply: optionalText() });
export const validateCouponValidator = bodyValidator({ code: requiredText('Coupon code is required'), orderAmount: nonNegativeNumber('Order amount must be a valid number') });
const couponFields = { code: optionalText(), discountType: z.enum(['percentage', 'fixed']).optional(), discountValue: nonNegativeNumber('Discount value must be a valid number').optional(), minOrderAmount: nonNegativeNumber('Minimum order amount must be a valid number').optional(), maxDiscount: nonNegativeNumber('Maximum discount must be a valid number').optional(), expiryDate: z.coerce.date({ message: 'Expiry date must be a valid date' }).optional() };
export const createCouponValidator = bodyValidator({ ...couponFields, code: requiredText('Coupon code is required'), discountType: z.enum(['percentage', 'fixed']), discountValue: nonNegativeNumber('Discount value must be a valid number') });
export const updateCouponValidator = bodyValidator(couponFields);

const orderStatus = z.enum(['pending', 'processing', 'shipped', 'delivered', 'completed', 'returned', 'cancelled']);
const orderItem = objectSchema({ product: mongoId('Valid product ID is required').optional().nullable(), quantity: positiveInteger('Quantity must be at least 1') });
const shippingAddress = objectSchema({ name: requiredText('Full name is required'), phone: text().regex(/^(?:\+977|977)?9\d{9}$/, 'Valid Nepali phone number is required'), street: optionalText(), address: optionalText(), email: text().email('Valid email is required').optional() });
export const createOrderValidator = bodyValidator({ items: z.array(orderItem).min(1, 'Items are required'), shippingAddress, deliveryZone: z.enum(['inside-butwal', 'outside-butwal']).optional(), paymentMethod: z.enum(['cash', 'cod', 'fonepay']), couponCode: optionalText(), channel: optionalText() });
export const updateOrderValidator = bodyValidator({ transactionType: z.enum(['customer_sale', 'partner_product_taken', 'partner_sale']).optional(), status: orderStatus.optional(), orderStatus: orderStatus.optional(), paymentStatus: z.enum(['pending', 'paid', 'cancelled']).optional(), trackingInfo: z.record(z.string(), z.unknown()).optional(), soldBy: z.enum(['Bishal', 'Krishna', 'Ukesh']).optional(), staffNote: optionalText(), notes: optionalText(), cancelReason: optionalText(), isCashCollected: z.boolean().optional() });
export const paymentInitiateValidator = bodyValidator({ orderId: mongoId('Valid order ID is required') });
export const genericPaymentInitiateValidator = bodyValidator({ orderId: mongoId('Valid order ID is required'), method: z.enum(['cod', 'cash', 'esewa', 'khalti', 'fonepay']), amount: nonNegativeNumber('Amount must be a valid number').optional() });
export const genericPaymentVerifyValidator = bodyValidator({ transactionId: requiredText('Transaction ID is required'), orderId: mongoId('Valid order ID is required').optional() });
export const eSewaVerifyValidator = validator({ query: objectSchema({ oid: requiredText('Order ID is required'), amt: requiredText('Amount is required'), refId: requiredText('Reference ID is required') }) });
export const paymentVerifyKhaltiValidator = bodyValidator({ token: requiredText('Khalti token is required'), amount: nonNegativeNumber('Amount must be a valid number') });

export const posOrderValidator = bodyValidator({ transactionType: z.enum(['customer_sale', 'partner_product_taken', 'partner_sale']), items: z.array(z.unknown()).min(1, 'Items are required'), paymentMethod: z.enum(['cash', 'cod', 'fonepay']), soldBy: z.enum(['Bishal', 'Krishna', 'Ukesh']) });
export const holdSaleValidator = bodyValidator({ items: z.array(z.unknown()).min(1, 'Held sale must contain items'), subtotal: nonNegativeNumber('Subtotal must be a valid number'), discountAmount: nonNegativeNumber('Discount amount must be a valid number').optional(), customerName: optionalText(), customerId: mongoId('Valid customer ID is required').optional(), notes: optionalText() });
export const updateStockValidator = bodyParamsValidator({ quantity: nonNegativeInteger('Quantity must be a non-negative integer') }, { productId: mongoId('Valid product ID is required') });
export const startTillValidator = bodyValidator({ startingCash: nonNegativeNumber('Starting cash must be a valid number') });
export const closeTillValidator = bodyValidator({ countedCash: nonNegativeNumber('Counted cash must be a valid number') });
export const reviewValidator = bodyValidator({ productId: mongoId('Valid product ID is required'), rating: z.coerce.number().int().min(1).max(5), title: optionalText(), comment: optionalText() });
export const profileUpdateValidator = bodyValidator({ name: optionalText(), phone: optionalText(), address: z.union([z.string(), z.record(z.string(), z.unknown())]).optional() });
export const wishlistValidator = bodyValidator({ productId: mongoId('Valid product ID is required') });
export const searchUsersByPhoneValidator = validator({ query: objectSchema({ phone: requiredText('Phone query is required') }) });
export const updateUserRoleValidator = bodyValidator({ role: z.enum(['user', 'admin', 'cashier']) });
export const createCategoryValidator = bodyValidator({ name: requiredText('Category name is required'), description: optionalText(), image: optionalText(), order: z.coerce.number().int().optional() });
export const updateCategoryValidator = bodyValidator({ name: optionalText(), description: optionalText(), image: optionalText(), order: z.coerce.number().int().optional() });
export const createPostValidator = bodyValidator({ title: requiredText('Title is required'), content: requiredText('Content is required'), category: requiredText('Category is required'), excerpt: optionalText(), tags: z.array(z.unknown()).optional(), featuredImage: optionalText(), seoTitle: optionalText(), seoDescription: optionalText() });
export const updatePostValidator = bodyParamsValidator({ title: optionalText(), content: optionalText(), category: optionalText(), excerpt: optionalText(), tags: z.array(z.unknown()).optional(), featuredImage: optionalText(), seoTitle: optionalText(), seoDescription: optionalText() }, { id: mongoId('Valid post ID is required') });

const idValidator = (message = 'Valid ID is required') => paramsValidator({ id: mongoId(message) });
const productValidator = (message = 'Valid product ID is required') => paramsValidator({ id: mongoId(message) });
const productIdValidator = (message = 'Valid product ID is required') => paramsValidator({ productId: mongoId(message) });
const slugValidator = () => paramsValidator({ slug: requiredText('Slug is required') });
export const idParamValidator = idValidator();
export const productIdParamValidator = productIdValidator();
export const slugParamValidator = slugValidator();
export const queryProductReviewsValidator = validator({ query: objectSchema({ productId: requiredText('Product ID query is required') }) });
export const deleteWishlistValidator = productIdValidator();
export const closeTillParamValidator = idValidator('Valid till session ID is required');
export const heldSaleIdValidator = idValidator('Valid held sale ID is required');
export const updateUserRoleParamValidator = idValidator('Valid user ID is required');
export const couponIdParamValidator = idValidator('Valid coupon ID is required');
export const categoryIdParamValidator = idValidator('Valid category ID is required');
export const blogIdParamValidator = idValidator('Valid blog post ID is required');
export const productIdParamRouteValidator = productValidator();
export const userWishlistProductParamValidator = productIdValidator();
export const orderIdParamValidator = idValidator('Valid order ID is required');
export const categoryIdRouteValidator = categoryIdParamValidator;
export const blogSlugParamValidator = slugValidator();
export const contactMessageIdValidator = idValidator('Valid message ID is required');
export const userIdParamValidator = idValidator('Valid user ID is required');
export const heldSalesIdValidator = idValidator('Valid held sale ID is required');
export const tillSessionIdValidator = idValidator('Valid till session ID is required');
export const productIdRouteValidator = productValidator();
export const orderIdRouteValidator = idValidator('Valid order ID is required');
export const blogDeleteValidator = idValidator('Valid post ID is required');
export const categoryDeleteValidator = idValidator('Valid category ID is required');
export const couponDeleteValidator = idValidator('Valid coupon ID is required');
export const updateCategoryIdValidator = idValidator('Valid category ID is required');
export const updateProductIdValidator = productValidator();
export const updateUserRoleIdValidator = idValidator('Valid user ID is required');
export const updateBlogIdValidator = idValidator('Valid blog post ID is required');
export const heldSaleDeleteValidator = idValidator('Valid held sale ID is required');
export const closeTillSessionIdValidator = idValidator('Valid till session ID is required');
export const categoryGetIdValidator = idValidator('Valid category ID is required');
export const productGetIdValidator = productValidator();
export const orderGetIdValidator = idValidator('Valid order ID is required');
export const deleteWishlistProductValidator = productIdValidator('Valid wishlist product ID is required');
export const heldSaleGetIdValidator = idValidator('Valid held sale ID is required');
export const blogPublishValidator = idValidator('Valid post ID is required');
export const categoryDeleteIdValidator = idValidator('Valid category ID is required');
export const couponUpdateIdValidator = idValidator('Valid coupon ID is required');
export const productDeleteIdValidator = productValidator();
export const orderDeleteIdValidator = idValidator('Valid order ID is required');
export const usersIdValidator = idValidator('Valid user ID is required');
export const blogSlugValidator = slugValidator();
export const contactIdParamValidator = idValidator('Valid message ID is required');
export const productParamValidator = productValidator();
export const orderParamValidator = idValidator('Valid order ID is required');
export const userRoleParamValidator = idValidator('Valid user ID is required');
