import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const authRegisterValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
];

export const authLoginValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const authVerifyOtpValidator: ValidationChain[] = [
  body('otp').trim().notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

export const contactMessageValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('phone').optional().trim(),
];

export const updateMessageStatusValidator: ValidationChain[] = [
  body('status').trim().notEmpty().withMessage('Status is required'),
  body('reply').optional().trim(),
];

export const validateCouponValidator: ValidationChain[] = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('orderAmount').isFloat({ min: 0 }).withMessage('Order amount must be a valid number'),
];

export const createCouponValidator: ValidationChain[] = [
  body('code').trim().notEmpty().withMessage('Coupon code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be a valid number'),
  body('minOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be a valid number'),
  body('maxDiscount').optional().isFloat({ min: 0 }).withMessage('Maximum discount must be a valid number'),
  body('expiryDate').optional().isISO8601().toDate().withMessage('Expiry date must be a valid date'),
];

export const updateCouponValidator: ValidationChain[] = [
  body('code').optional().trim().notEmpty().withMessage('Coupon code cannot be empty'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  body('discountValue').optional().isFloat({ min: 0 }).withMessage('Discount value must be a valid number'),
  body('minOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be a valid number'),
  body('maxDiscount').optional().isFloat({ min: 0 }).withMessage('Maximum discount must be a valid number'),
  body('expiryDate').optional().isISO8601().toDate().withMessage('Expiry date must be a valid date'),
];

export const createOrderValidator: ValidationChain[] = [
  body('items').isArray({ min: 1 }).withMessage('Items are required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('paymentMethod').trim().notEmpty().isIn(['cash', 'cod']).withMessage('Payment method must be cash or cod'),
  body('couponCode').optional().trim(),
  body('channel').optional().trim(),
];

export const updateOrderValidator: ValidationChain[] = [
  body('orderStatus').optional().trim(),
  body('paymentStatus').optional().trim(),
  body('trackingInfo').optional().isObject().withMessage('Tracking info must be an object'),
  body('staffNote').optional().trim(),
  body('cancelReason').optional().trim(),
  body('isCashCollected').optional().isBoolean().withMessage('isCashCollected must be a boolean'),
];

export const paymentInitiateValidator: ValidationChain[] = [
  body('orderId').isMongoId().withMessage('Valid order ID is required'),
];

export const eSewaVerifyValidator: ValidationChain[] = [
  query('oid').trim().notEmpty().withMessage('Order ID is required'),
  query('amt').trim().notEmpty().withMessage('Amount is required'),
  query('refId').trim().notEmpty().withMessage('Reference ID is required'),
];

export const paymentVerifyKhaltiValidator: ValidationChain[] = [
  body('token').trim().notEmpty().withMessage('Khalti token is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a valid number'),
];

export const posOrderValidator: ValidationChain[] = [
  body('items').isArray({ min: 1 }).withMessage('Items are required'),
  body('items.*.product').isMongoId().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('paymentMethod').trim().notEmpty().withMessage('Payment method is required'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be a valid number'),
  body('tenderedAmount').optional().isFloat({ min: 0 }).withMessage('Tendered amount must be a valid number'),
  body('customerName').optional().trim(),
  body('customerId').optional().isMongoId().withMessage('Valid customer ID is required'),
  body('notes').optional().trim(),
];

export const holdSaleValidator: ValidationChain[] = [
  body('items').isArray({ min: 1 }).withMessage('Held sale must contain items'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a valid number'),
  body('discountAmount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be a valid number'),
  body('customerName').optional().trim(),
  body('customerId').optional().isMongoId().withMessage('Valid customer ID is required'),
  body('notes').optional().trim(),
];

export const updateStockValidator: ValidationChain[] = [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
];

export const startTillValidator: ValidationChain[] = [
  body('startingCash').isFloat({ min: 0 }).withMessage('Starting cash must be a valid number'),
];

export const closeTillValidator: ValidationChain[] = [
  body('countedCash').isFloat({ min: 0 }).withMessage('Counted cash must be a valid number'),
];

export const reviewValidator: ValidationChain[] = [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().trim(),
  body('comment').optional().trim(),
];

export const profileUpdateValidator: ValidationChain[] = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('address').optional().custom((value) => typeof value === 'string' || typeof value === 'object').withMessage('Address must be an object or JSON string'),
];

export const wishlistValidator: ValidationChain[] = [
  body('productId').isMongoId().withMessage('Valid product ID is required'),
];

export const searchUsersByPhoneValidator: ValidationChain[] = [
  query('phone').trim().notEmpty().withMessage('Phone query is required'),
];

export const updateUserRoleValidator: ValidationChain[] = [
  body('role').isIn(['user', 'admin', 'cashier']).withMessage('Role must be user, admin, or cashier'),
];

export const createCategoryValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('order').optional().isInt().withMessage('Order must be an integer'),
];

export const updateCategoryValidator: ValidationChain[] = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('description').optional().trim(),
  body('image').optional().trim(),
  body('order').optional().isInt().withMessage('Order must be an integer'),
];

export const createPostValidator: ValidationChain[] = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('excerpt').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('featuredImage').optional().trim(),
  body('seoTitle').optional().trim(),
  body('seoDescription').optional().trim(),
];

export const updatePostValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid post ID is required'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('excerpt').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('featuredImage').optional().trim(),
  body('seoTitle').optional().trim(),
  body('seoDescription').optional().trim(),
];

export const idParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid ID is required'),
];

export const productIdParamValidator: ValidationChain[] = [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
];

export const slugParamValidator: ValidationChain[] = [
  param('slug').trim().notEmpty().withMessage('Slug is required'),
];

export const queryProductReviewsValidator: ValidationChain[] = [
  query('productId').trim().notEmpty().withMessage('Product ID query is required'),
];

export const deleteWishlistValidator: ValidationChain[] = [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
];

export const closeTillParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid till session ID is required'),
];

export const heldSaleIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid held sale ID is required'),
];

export const updateUserRoleParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid user ID is required'),
];

export const couponIdParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid coupon ID is required'),
];

export const categoryIdParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid category ID is required'),
];

export const blogIdParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid blog post ID is required'),
];

export const productIdParamRouteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid product ID is required'),
];

export const userWishlistProductParamValidator: ValidationChain[] = [
  param('productId').isMongoId().withMessage('Valid product ID is required'),
];

export const orderIdParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid order ID is required'),
];

export const categoryIdRouteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid category ID is required'),
];

export const blogSlugParamValidator: ValidationChain[] = [
  param('slug').trim().notEmpty().withMessage('Slug is required'),
];

export const createProductValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('quantity').optional({ nullable: true }).custom((value) => value === undefined || value === null || value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)).withMessage('Quantity must be a non-negative integer'),
  body('packagesInStock').optional({ nullable: true }).custom((value) => value === undefined || value === null || value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)).withMessage('Packages in stock must be a non-negative integer'),
  body('weight').optional().isString(),
  body('packaging').optional().isString(),
  body('tags').optional({ nullable: true }).custom((value) => value === undefined || value === null || value === '' || Array.isArray(value) || (typeof value === 'string' && (() => { try { const parsed = JSON.parse(value); return Array.isArray(parsed); } catch { return false; } })())).withMessage('Tags must be an array or a JSON array string'),
  body('specifications').optional().isObject().withMessage('Specifications must be an object'),
  body('seoTitle').optional().trim(),
  body('seoDescription').optional().trim(),
];

export const updateProductValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid product ID is required'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('quantity').optional({ nullable: true }).custom((value) => value === undefined || value === null || value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)).withMessage('Quantity must be a non-negative integer'),
  body('packagesInStock').optional({ nullable: true }).custom((value) => value === undefined || value === null || value === '' || (Number.isInteger(Number(value)) && Number(value) >= 0)).withMessage('Packages in stock must be a non-negative integer'),
  body('weight').optional().isString(),
  body('packaging').optional().isString(),
  body('tags').optional({ nullable: true }).custom((value) => value === undefined || value === null || value === '' || Array.isArray(value) || (typeof value === 'string' && (() => { try { const parsed = JSON.parse(value); return Array.isArray(parsed); } catch { return false; } })())).withMessage('Tags must be an array or a JSON array string'),
  body('specifications').optional().isObject().withMessage('Specifications must be an object'),
  body('seoTitle').optional().trim(),
  body('seoDescription').optional().trim(),
];

export const contactMessageIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid message ID is required'),
];

export const userIdParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid user ID is required'),
];

export const heldSalesIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid held sale ID is required'),
];

export const tillSessionIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid till session ID is required'),
];

export const productIdRouteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid product ID is required'),
];

export const orderIdRouteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid order ID is required'),
];

export const blogDeleteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid post ID is required'),
];

export const categoryDeleteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid category ID is required'),
];

export const couponDeleteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid coupon ID is required'),
];

export const updateCategoryIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid category ID is required'),
];

export const updateProductIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid product ID is required'),
];

export const updateUserRoleIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid user ID is required'),
];

export const updateBlogIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid blog post ID is required'),
];

export const heldSaleDeleteValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid held sale ID is required'),
];

export const closeTillSessionIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid till session ID is required'),
];

export const categoryGetIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid category ID is required'),
];

export const productGetIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid product ID is required'),
];

export const orderGetIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid order ID is required'),
];

export const deleteWishlistProductValidator: ValidationChain[] = [
  param('productId').isMongoId().withMessage('Valid wishlist product ID is required'),
];

export const heldSaleGetIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid held sale ID is required'),
];

export const blogPublishValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid post ID is required'),
];

export const categoryDeleteIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid category ID is required'),
];

export const couponUpdateIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid coupon ID is required'),
];

export const productDeleteIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid product ID is required'),
];

export const orderDeleteIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid order ID is required'),
];

export const usersIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid user ID is required'),
];

export const blogSlugValidator: ValidationChain[] = [
  param('slug').trim().notEmpty().withMessage('Slug is required'),
];

export const contactIdParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid message ID is required'),
];

export const productParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid product ID is required'),
];

export const orderParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid order ID is required'),
];

export const userRoleParamValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Valid user ID is required'),
];
