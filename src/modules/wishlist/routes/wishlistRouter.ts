import { multerUpload } from '@/common/config';
import {
	categoryController,
	contributionController,
	curatedItemController,
	wishlistController,
	wishlistItemController,
	wishlistTemplateController,
	wishlistTemplateItemController,
} from '../controller';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

/**
 * @openapi
 * /wishlist:
 *   get:
 *     summary: Get public wishlist by unique link
 *     description: Fetches a public wishlist using its unique shareable link. Only active and public wishlists are accessible. Automatically tracks views (IP, user agent, referrer).
 *     tags:
 *       - Wishlist
 *     parameters:
 *       - in: query
 *         name: uniqueLink
 *         required: true
 *         schema:
 *           type: string
 *         example: "birthday-dwe1-F"
 *         description: The slug part of the wishlist URL (everything after https://joygiver.co/)
 *     responses:
 *       200:
 *         description: Wishlist fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wishlist:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "f9b49a73-6d94-4afd-ab50-7c20ef0b6632"
 *                           name:
 *                             type: string
 *                             example: "My birthday wishlist"
 *                           description:
 *                             type: string
 *                             example: "My birthday wishlist description"
 *                           uniqueLink:
 *                             type: string
 *                             example: "https://joygiver.co/birthday-dwe1-F"
 *                           emoji:
 *                             type: string
 *                             example: "emoji"
 *                           colorTheme:
 *                             type: string
 *                             example: "colorTheme"
 *                           status:
 *                             type: string
 *                             example: "active"
 *                           totalContributed:
 *                             type: string
 *                             example: "0.00"
 *                           contributorsCount:
 *                             type: integer
 *                             example: 0
 *                           viewsCount:
 *                             type: integer
 *                             example: 0
 *                           isPublic:
 *                             type: boolean
 *                             example: true
 *                           celebrationEvent:
 *                             type: string
 *                             example: "Birthday"
 *                           celebrationDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-11T23:00:00.000Z"
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-19T00:00:00.000Z"
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T03:47:06.166Z"
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                               example: "Iphone 12 pro max"
 *                             imageUrl:
 *                               type: string
 *                               example: "https://iphone.com"
 *                             price:
 *                               type: string
 *                               example: "1500.00"
 *                             quantity:
 *                               type: integer
 *                               example: 1
 *                             amountContributed:
 *                               type: string
 *                               example: "0.00"
 *                             totalContributed:
 *                               type: string
 *                               example: "0.00"
 *                             contributorsCount:
 *                               type: integer
 *                               example: 0
 *                             viewsCount:
 *                               type: integer
 *                               example: 0
 *                             isFunded:
 *                               type: boolean
 *                               example: false
 *                             fundedAt:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                             uniqueLink:
 *                               type: string
 *                               example: "https://joygiver.co/iphone-12-pro-max-_whlPOPSOU"
 *                             availableBalance:
 *                               type: string
 *                               example: "0.00"
 *                             pendingBalance:
 *                               type: string
 *                               example: "0.00"
 *                             withdrawnAmount:
 *                               type: string
 *                               example: "0.00"
 *                             isWithdrawable:
 *                               type: boolean
 *                               example: true
 *                             lastWithdrawal:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                             wishlistId:
 *                               type: string
 *                               format: uuid
 *                             curatedItemId:
 *                               type: string
 *                               format: uuid
 *                             categoryId:
 *                               type: string
 *                               format: uuid
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                 message:
 *                   type: string
 *                   example: "Wishlist fetched successfully"
 *       400:
 *         description: Bad Request - Missing unique link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Unique link is required"
 *       403:
 *         description: Forbidden - Wishlist is private or not active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "This wishlist is not available"
 *       404:
 *         description: Not Found - Wishlist or items not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist not found"
 */
router.get('/', wishlistController.getWishlistByLink);
router.get('/id', wishlistController.getWishlistById);
/**
 * @openapi
 * /wishlist/contribute-item:
 *   post:
 *     summary: Initiate a contribution to a wishlist item
 *     description: Initiates a contribution to a specified wishlist item by providing contributor details, amount, and an optional message. The contribution is marked as pending until payment is completed via Paystack. Returns a payment URL to complete the transaction. Required fields include wishlist item ID, contributor name, email, and amount.
 *     tags:
 *       - Contributions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wishlistItemId:
 *                 type: string
 *                 format: uuid
 *                 example: "220031d9-b808-4f5a-a811-8c5a6271ecc7"
 *                 description: The unique identifier of the wishlist item
 *               contributorName:
 *                 type: string
 *                 example: "David Daviiiii"
 *                 description: The name of the contributor
 *               contributorEmail:
 *                 type: string
 *                 format: email
 *                 example: "daveuchenna2404@gmail.com"
 *                 description: The email address of the contributor
 *               contributorPhone:
 *                 type: string
 *                 example: "09154064012"
 *                 description: The phone number of the contributor (optional)
 *               amount:
 *                 type: string
 *                 example: "200.00"
 *                 description: The contribution amount
 *               message:
 *                 type: string
 *                 example: "Hello! Manage this small something"
 *                 description: An optional message from the contributor
 *               isAnonymous:
 *                 type: boolean
 *                 example: false
 *                 description: Indicates if the contribution is anonymous (defaults to false)
 *             required:
 *               - wishlistItemId
 *               - contributorName
 *               - contributorEmail
 *               - amount
 *     responses:
 *       200:
 *         description: Contribution initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       contribution:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "21c8b1c9-c4b1-438c-83c5-6f03f4d02f6b"
 *                             description: The unique identifier of the contribution
 *                           wishlistId:
 *                             type: string
 *                             format: uuid
 *                             example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *                             description: The ID of the wishlist the item belongs to
 *                           wishlistItemId:
 *                             type: string
 *                             format: uuid
 *                             example: "220031d9-b808-4f5a-a811-8c5a6271ecc7"
 *                             description: The ID of the wishlist item
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             example: null
 *                             description: The ID of the user making the contribution (if authenticated)
 *                           contributorName:
 *                             type: string
 *                             example: "David Daviiiii"
 *                             description: The name of the contributor
 *                           contributorEmail:
 *                             type: string
 *                             format: email
 *                             example: "daveuchenna2404@gmail.com"
 *                             description: The email address of the contributor
 *                           contributorPhone:
 *                             type: string
 *                             example: "09154064012"
 *                             description: The phone number of the contributor
 *                           message:
 *                             type: string
 *                             nullable: true
 *                             example: "Hello! Manage this small something"
 *                             description: Optional message provided by the contributor
 *                           isAnonymous:
 *                             type: boolean
 *                             example: false
 *                             description: Indicates if the contribution is anonymous
 *                           amount:
 *                             type: string
 *                             example: "200.00"
 *                             description: The contribution amount
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                             description: The status of the contribution (e.g., pending, completed)
 *                           paymentReference:
 *                             type: string
 *                             example: "CONT-jTJG2VO-xJvEBYCD"
 *                             description: The unique reference for the contribution payment
 *                           paymentMethod:
 *                             type: string
 *                             example: "paystack"
 *                             description: The payment method used for the contribution
 *                           paystackReference:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                             description: The Paystack reference for the payment (null until completed)
 *                           ownerReply:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                             description: The reply from the wishlist owner (if any)
 *                           repliedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                             description: Timestamp when the owner replied
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             example: null
 *                             description: Additional metadata for the contribution
 *                           paidAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                             description: Timestamp when the contribution was paid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T20:44:17.921Z"
 *                             description: Timestamp when the contribution was created
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T20:44:17.921Z"
 *                             description: Timestamp when the contribution was last updated
 *                       paymentUrl:
 *                         type: string
 *                         example: "https://checkout.paystack.com/gtdbq9ti8q22eu5"
 *                         description: The Paystack payment URL to complete the contribution
 *                 message:
 *                   type: string
 *                   example: "Contribution initialized successfully. Please complete payment"
 *       400:
 *         description: Bad Request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
 */
router.post('/contribute-item', contributionController.initiateContribution);
/**
 * @openapi
 * /wishlist/contribute-all-items:
 *   post:
 *     summary: Contribute to all items in a wishlist
 *     description: Initiates a single contribution that is distributed across all items in a specified wishlist based on the chosen allocation strategy (priority, equal, or proportional). Minimum contribution is ₦100. Returns a payment URL to complete the transaction via Paystack.
 *     tags:
 *       - Contributions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wishlistId:
 *                 type: string
 *                 format: uuid
 *                 example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *                 description: The unique identifier of the wishlist
 *               contributorName:
 *                 type: string
 *                 example: "contributorName"
 *                 description: The name of the contributor
 *               contributorEmail:
 *                 type: string
 *                 format: email
 *                 example: "1@2.com"
 *                 description: The email address of the contributor
 *               contributorPhone:
 *                 type: string
 *                 example: "08123456789"
 *                 description: The phone number of the contributor (optional)
 *               amount:
 *                 type: number
 *                 example: 500
 *                 description: The total contribution amount (minimum ₦100)
 *               message:
 *                 type: string
 *                 example: "Happy birthday!"
 *                 description: Optional message from the contributor
 *               isAnonymous:
 *                 type: boolean
 *                 example: false
 *                 description: Indicates if the contribution should be anonymous
 *               allocationStrategy:
 *                 type: string
 *                 enum: [priority, equal, proportional]
 *                 example: "priority"
 *                 description: Strategy to allocate the total amount across wishlist items
 *             required:
 *               - wishlistId
 *               - contributorName
 *               - contributorEmail
 *               - amount
 *     responses:
 *       200:
 *         description: Contribution initialized across all items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       contribution:
 *                         type: object
 *                         properties:
 *                           wishlistId:
 *                             type: string
 *                             format: uuid
 *                             example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *                             description: The ID of the wishlist
 *                           contributorName:
 *                             type: string
 *                             example: "contributorName"
 *                             description: The name of the contributor
 *                           contributorEmail:
 *                             type: string
 *                             format: email
 *                             example: "1@2.com"
 *                             description: The email of the contributor
 *                           reference:
 *                             type: string
 *                             example: "CONT-ALL-bmiH4JWd1ebq3uS5"
 *                             description: Unique reference for the bulk contribution
 *                           totalAmount:
 *                             type: number
 *                             example: 500
 *                             description: The total amount being contributed
 *                           itemsCount:
 *                             type: integer
 *                             example: 9
 *                             description: Number of wishlist items receiving allocation
 *                           itemAllocations:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 wishlistItemId:
 *                                   type: string
 *                                   format: uuid
 *                                   example: "30209555-95f3-4701-a645-48d49d802721"
 *                                   description: The ID of the wishlist item
 *                                 amount:
 *                                   type: number
 *                                   example: 59.99
 *                                   description: The amount allocated to this item
 *                       paymentUrl:
 *                         type: string
 *                         example: "https://checkout.paystack.com/lp1q68frfwb7fz8"
 *                         description: Paystack payment URL to complete the transaction
 *                 message:
 *                   type: string
 *                   example: "Contributing ₦500 to 9 items"
 *       400:
 *         description: Bad Request - Missing fields or amount below minimum
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Minimum contribution amount is ₦100"
 */
router.post('/contribute-all-items', contributionController.contributeToAll);
/**
 * @openapi
 * /wishlist/contributions:
 *   get:
 *     summary: Retrieve contributions for a wishlist
 *     description: Fetches a paginated list of contributions for a specific wishlist, excluding anonymous contributions for public view. Supports pagination through query parameters for page and limit. Requires the wishlist ID as a query parameter.
 *     tags:
 *       - Contributions
 *     parameters:
 *       - in: query
 *         name: wishlistId
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *         required: true
 *         description: The unique identifier of the wishlist
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *           default: 20
 *         description: The number of records to return per page
 *     responses:
 *       200:
 *         description: Contributions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "21c8b1c9-c4b1-438c-83c5-6f03f4d02f6b"
 *                             description: The unique identifier of the contribution
 *                           wishlistId:
 *                             type: string
 *                             format: uuid
 *                             example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *                             description: The ID of the wishlist
 *                           wishlistItemId:
 *                             type: string
 *                             format: uuid
 *                             example: "220031d9-b808-4f5a-a811-8c5a6271ecc7"
 *                             description: The ID of the wishlist item
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             example: null
 *                             description: The ID of the user making the contribution (if authenticated)
 *                           contributorName:
 *                             type: string
 *                             example: "David Daviiiii"
 *                             description: The name of the contributor
 *                           contributorEmail:
 *                             type: string
 *                             format: email
 *                             example: "daveuchenna2404@gmail.com"
 *                             description: The email address of the contributor
 *                           contributorPhone:
 *                             type: string
 *                             example: "09154064012"
 *                             description: The phone number of the contributor
 *                           message:
 *                             type: string
 *                             nullable: true
 *                             example: "Hello! Manage this small something"
 *                             description: Optional message provided by the contributor
 *                           isAnonymous:
 *                             type: boolean
 *                             example: false
 *                             description: Indicates if the contribution is anonymous
 *                           amount:
 *                             type: string
 *                             example: "200.00"
 *                             description: The contribution amount
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                             description: The status of the contribution (e.g., pending, completed)
 *                           paymentReference:
 *                             type: string
 *                             example: "CONT-jTJG2VO-xJvEBYCD"
 *                             description: The unique reference for the contribution payment
 *                           paymentMethod:
 *                             type: string
 *                             example: "paystack"
 *                             description: The payment method used for the contribution
 *                           paystackReference:
 *                             type: string
 *                             nullable: true
 *                             example: "CONT-jTJG2VO-xJvEBYCD"
 *                             description: The Paystack reference for the payment
 *                           ownerReply:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                             description: The reply from the wishlist owner (if any)
 *                           repliedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                             description: Timestamp when the owner replied
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             example: null
 *                             description: Additional metadata for the contribution
 *                           paidAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2025-10-12T21:09:59.273Z"
 *                             description: Timestamp when the contribution was paid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T20:44:17.921Z"
 *                             description: Timestamp when the contribution was created
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T21:09:59.273Z"
 *                             description: Timestamp when the contribution was last updated
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                           description: The current page number
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                           description: The number of records per page
 *                         total:
 *                           type: integer
 *                           example: 2
 *                           description: The total number of contributions
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                           description: The total number of pages
 *                 message:
 *                   type: string
 *                   example: "Contributions retrieved successfully"
 *       401:
 *         description: Bad Request - Missing wishlist ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist ID is required"
 */
router.get('/contributions', contributionController.getWishlistContributions);
/**
 * @openapi
 * /wishlist/item-contributions:
 *   get:
 *     summary: Retrieve contributions for a specific wishlist item
 *     description: Fetches a paginated list of contributions for a specific wishlist item, excluding anonymous contributions for public view. Supports pagination through query parameters for page and limit. Requires the wishlist item ID as a query parameter.
 *     tags:
 *       - Contributions
 *     parameters:
 *       - in: query
 *         name: wishlistItemId
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "220031d9-b808-4f5a-a811-8c5a6271ecc7"
 *         required: true
 *         description: The unique identifier of the wishlist item
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *           default: 20
 *         description: The number of records to return per page
 *     responses:
 *       200:
 *         description: Item contributions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "21c8b1c9-c4b1-438c-83c5-6f03f4d02f6b"
 *                             description: The unique identifier of the contribution
 *                           wishlistId:
 *                             type: string
 *                             format: uuid
 *                             example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *                             description: The ID of the wishlist
 *                           wishlistItemId:
 *                             type: string
 *                             format: uuid
 *                             example: "220031d9-b808-4f5a-a811-8c5a6271ecc7"
 *                             description: The ID of the wishlist item
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             example: null
 *                             description: The ID of the user making the contribution (if authenticated)
 *                           contributorName:
 *                             type: string
 *                             example: "David Daviiiii"
 *                             description: The name of the contributor
 *                           contributorEmail:
 *                             type: string
 *                             format: email
 *                             example: "daveuchenna2404@gmail.com"
 *                             description: The email address of the contributor
 *                           contributorPhone:
 *                             type: string
 *                             example: "09154064012"
 *                             description: The phone number of the contributor
 *                           message:
 *                             type: string
 *                             nullable: true
 *                             example: "Hello! Manage this small something"
 *                             description: Optional message provided by the contributor
 *                           isAnonymous:
 *                             type: boolean
 *                             example: false
 *                             description: Indicates if the contribution is anonymous
 *                           amount:
 *                             type: string
 *                             example: "200.00"
 *                             description: The contribution amount
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                             description: The status of the contribution (e.g., pending, completed)
 *                           paymentReference:
 *                             type: string
 *                             example: "CONT-jTJG2VO-xJvEBYCD"
 *                             description: The unique reference for the contribution payment
 *                           paymentMethod:
 *                             type: string
 *                             example: "paystack"
 *                             description: The payment method used for the contribution
 *                           paystackReference:
 *                             type: string
 *                             nullable: true
 *                             example: "CONT-jTJG2VO-xJvEBYCD"
 *                             description: The Paystack reference for the payment
 *                           ownerReply:
 *                             type: string
 *                             nullable: true
 *                             example: null
 *                             description: The reply from the wishlist owner (if any)
 *                           repliedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                             description: Timestamp when the owner replied
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             example: null
 *                             description: Additional metadata for the contribution
 *                           paidAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2025-10-12T21:09:59.273Z"
 *                             description: Timestamp when the contribution was paid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T20:44:17.921Z"
 *                             description: Timestamp when the contribution was created
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T21:09:59.273Z"
 *                             description: Timestamp when the contribution was last updated
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                           description: The current page number
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                           description: The number of records per page
 *                         total:
 *                           type: integer
 *                           example: 2
 *                           description: The total number of contributions
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                           description: The total number of pages
 *                 message:
 *                   type: string
 *                   example: "Item contributions retrieved successfully"
 *       401:
 *         description: Bad Request - Missing wishlist item ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist item ID is required"
 */
router.get('/item-contributions', contributionController.getItemContributions);
/**
 * @openapi
 * /wishlist/top-contributors:
 *   get:
 *     summary: Retrieve top contributors for a wishlist
 *     description: Fetches a list of top contributors for a specific wishlist, ordered by total contribution amount. Supports limiting the number of results through a query parameter. Requires the wishlist ID as a query parameter.
 *     tags:
 *       - Contributions
 *     parameters:
 *       - in: query
 *         name: wishlistId
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *         required: true
 *         description: The unique identifier of the wishlist
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *           default: 10
 *         description: The maximum number of top contributors to return
 *     responses:
 *       200:
 *         description: Top contributors retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                         example: 1
 *                         description: The rank of the contributor based on total contribution amount
 *                       contributorName:
 *                         type: string
 *                         example: "David Daviiiii"
 *                         description: The name of the contributor
 *                       contributorInitials:
 *                         type: string
 *                         example: "DD"
 *                         description: The initials of the contributor
 *                       totalAmount:
 *                         type: number
 *                         example: 300
 *                         description: The total amount contributed by the contributor
 *                       contributionCount:
 *                         type: integer
 *                         nullable: true
 *                         example: null
 *                         description: The number of contributions made by the contributor
 *                 message:
 *                   type: string
 *                   example: "Top contributors retrieved successfully"
 *       401:
 *         description: Bad Request - Missing wishlist ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist ID is required"
 */
router.get('/top-contributors', contributionController.getTopContributors);

router.use(protect);
/**
 * @openapi
 * /wishlist/create-category:
 *   post:
 *     summary: Create a new category
 *     description: Creates a new category for the wishlist with the provided name. Only authenticated users with admin privileges can create categories.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Tech & gadgets"
 *                 description: The name of the category
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "68f8b8c3-d071-4bcb-8811-65d4efedfbb4"
 *                         description: The unique identifier of the category
 *                       name:
 *                         type: string
 *                         example: "Tech & gadgets"
 *                         description: The name of the category
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the category is active
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-06T05:56:10.168Z"
 *                         description: Timestamp when the category was created
 *                 message:
 *                   type: string
 *                   example: "Category created successfully"
 *       400:
 *         description: Bad Request - Missing category name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Name is required"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to create a category"
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Only admins can create categories"
 *       500:
 *         description: Internal Server Error - Failed to create category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to create category"
 */
router.post('/create-category', categoryController.createCategory);
/**
 * @openapi
 * /wishlist/categories:
 *   get:
 *     summary: Retrieve all active categories
 *     description: Fetches all active categories from the wishlist. Requires user authentication to access the endpoint.
 *     tags:
 *       - Wishlist
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "6e4ac6d9-b2e1-44fb-bb0e-debf564f94de"
 *                         description: The unique identifier of the category
 *                       name:
 *                         type: string
 *                         example: "Just cash"
 *                         description: The name of the category
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the category is active
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-06T05:58:09.098Z"
 *                         description: Timestamp when the category was created
 *                 message:
 *                   type: string
 *                   example: "Categories fetched successfully"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to view categories"
 *       500:
 *         description: Internal Server Error - Failed to fetch active categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch active categories"
 */
router.get('/categories', categoryController.getCategories);
router.get('/category', categoryController.getCategoryById);

/**
 * @openapi
 * /wishlist/update-category:
 *   post:
 *     summary: Update an existing category
 *     description: Updates an existing category in the wishlist with the provided category ID, name, and/or icon URL. Only authenticated users with admin privileges can update categories. At least one field (name) must be provided to update.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "6e4ac6d9-b2e1-44fb-bb0e-debf564f94de"
 *                 description: The unique identifier of the category to update
 *               name:
 *                 type: string
 *                 nullable: true
 *                 example: "Just cash"
 *                 description: The updated name of the category
 *             required:
 *               - categoryId
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "6e4ac6d9-b2e1-44fb-bb0e-debf564f94de"
 *                         description: The unique identifier of the category
 *                       name:
 *                         type: string
 *                         example: "Just cash"
 *                         description: The name of the category
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the category is active
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-06T05:58:09.098Z"
 *                         description: Timestamp when the category was created
 *                 message:
 *                   type: string
 *                   example: "Category updated successfully"
 *       400:
 *         description: Bad Request - Missing category ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Category ID is required"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to update a category"
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Only admins can update categories"
 *       404:
 *         description: Not Found - Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Category not found"
 *       500:
 *         description: Internal Server Error - Failed to update category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to update category"
 */
router.post('/update-category', categoryController.updateCategory);
/**
 * @openapi
 * /wishlist/delete-category:
 *   post:
 *     summary: Delete a category
 *     description: Deletes an existing category from the wishlist using the provided category ID. Only authenticated users with admin privileges can delete categories.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "6e4ac6d9-b2e1-44fb-bb0e-debf564f94de"
 *                 description: The unique identifier of the category to delete
 *             required:
 *               - categoryId
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: null
 *                   example: null
 *                   description: No data returned for this response
 *                 message:
 *                   type: string
 *                   example: "Category deleted successfully"
 *       400:
 *         description: Bad Request - Missing category ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Category ID is required"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to delete a category"
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Only admins can delete categories"
 *       404:
 *         description: Not Found - Category not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Category not found"
 *       500:
 *         description: Internal Server Error - Failed to delete category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to delete category"
 */
router.post('/delete-category', categoryController.deleteCategory);

/**
 * @openapi
 * /wishlist/create-item:
 *   post:
 *     summary: Create a new curated item
 *     description: Creates a new curated item (global or custom). Only authenticated users can create items. Admins create **global** public items (visible to all users), while regular users create **custom** private items. Gender is automatically set from the user's profile for custom items. For global items, gender can be explicitly provided (male, female, or prefer_not_to_say). Either an image file or imageUrl must be provided.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Iphone XR"
 *                 description: The name of the curated item
 *               price:
 *                 type: string
 *                 example: "500.00"
 *                 description: The price of the item as a string (must be greater than 0)
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "94c25650-72ec-4551-b6c8-3255198043d2"
 *                 description: The ID of the category the item belongs to
 *               gender:
 *                 type: string
 *                 enum: [male, female, prefer_not_to_say]
 *                 example: "female"
 *                 description: Gender for global items (admin only). Ignored for custom items (uses user's gender). Defaults to 'prefer_not_to_say' if not provided by admin.
 *               imageUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://iphone.com"
 *                 description: Direct URL to the item image (optional if file is uploaded)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (optional if imageUrl is provided)
 *             required:
 *               - name
 *               - price
 *               - categoryId
 *     responses:
 *       201:
 *         description: Curated item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "31e32dfd-c1bc-4a0b-810f-9fb1b780bfde"
 *                       name:
 *                         type: string
 *                         example: "Iphone XR"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://iphone.com"
 *                       price:
 *                         type: string
 *                         example: "500.00"
 *                       popularity:
 *                         type: integer
 *                         example: 0
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       itemType:
 *                         type: string
 *                         enum: [global, custom]
 *                         example: "global"
 *                         description: global for admin-created items, custom for user-created
 *                       gender:
 *                         type: string
 *                         enum: [MALE, FEMALE, PREFER_NOT_TO_SAY]
 *                         example: "female"
 *                       isPublic:
 *                         type: boolean
 *                         example: true
 *                         description: true for global items, false for custom items
 *                       categoryId:
 *                         type: string
 *                         format: uuid
 *                         example: "94c25650-72ec-4551-b6c8-3255198043d2"
 *                       createdBy:
 *                         type: string
 *                         format: uuid
 *                         example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                         description: ID of the user who created the item
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-28T13:53:51.305Z"
 *                 message:
 *                   type: string
 *                   example: "Curated item created successfully"
 *       400:
 *         description: Bad Request - Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Either image file or image URL is required"
 *       401:
 *         description: Unauthorized - Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to create a curated item"
 *       404:
 *         description: Not Found - Category does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Category not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to create curated item"
 */
router.post('/create-item', multerUpload.single('image'), curatedItemController.createCuratedItem);
/**
 * @openapi
 * /wishlist/items:
 *   get:
 *     summary: Get curated items (filtered by category, budget, and user's gender)
 *     description: >
 *       Retrieves a paginated list of curated items tailored to the authenticated user.
 *
 *       • Items are filtered by the user's gender (unless the user has selected "prefer_not_to_say").
 *       • If the user's gender is "prefer_not_to_say", items from **all genders** are returned.
 *       • Supports filtering by one or more category IDs.
 *       • Use `categoryIds=all` (or omit the parameter) to fetch items from **all categories**.
 *       • Budget filtering is optional via `budgetMin` and `budgetMax`.
 *
 *       **Important**: Passing `categoryIds=all` explicitly returns items from every category (same as omitting the parameter).
 *     tags:
 *       - Wishlist
 *     parameters:
 *       - in: query
 *         name: categoryIds
 *         schema:
 *           type: string
 *         example: "94c25650-72ec-4551-b6c8-3255198043d2,68f8b8c3-d071-4bcb-8811-65d4efedfbb4"
 *         description: >
 *           Comma-separated list of category UUIDs to filter items.
 *           Use `all` to include items from **all categories** (recommended and explicit way).
 *           If omitted, behaves the same as `all`.
 *       - in: query
 *         name: budgetMin
 *         schema:
 *           type: number
 *           minimum: 0
 *         example: 500
 *         description: Minimum price filter (inclusive)
 *       - in: query
 *         name: budgetMax
 *         schema:
 *           type: number
 *           minimum: 0
 *         example: 2000
 *         description: Maximum price filter (inclusive). Must be greater than budgetMin.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Curated items fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "da545e55-13a8-4c59-bf73-9de9519b1bc0"
 *                           name:
 *                             type: string
 *                             example: "Iphone 12 pro max"
 *                           imageUrl:
 *                             type: string
 *                             example: "https://iphone.com"
 *                           price:
 *                             type: string
 *                             example: "1500.00"
 *                           categoryId:
 *                             type: string
 *                             format: uuid
 *                             example: "94c25650-72ec-4551-b6c8-3255198043d2"
 *                           gender:
 *                             type: string
 *                             enum: [MALE, FEMALE, PREFER_NOT_TO_SAY]
 *                             example: "male"
 *                           popularity:
 *                             type: integer
 *                             example: 0
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 2
 *                           description: Total number of matching items
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                           description: Total number of pages based on limit
 *                 message:
 *                   type: string
 *                   example: "Curated items fetched successfully"
 *       400:
 *         description: Bad Request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Budget minimum must be less than budget maximum"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to get curated items"
 *       404:
 *         description: Not Found - User not found in database
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal Server Error
 */
router.get('/items', curatedItemController.getCuratedItems);
/**
 * @openapi
 * /wishlist/update-item:
 *   patch:
 *     summary: Update a curated item (Admin only)
 *     description: >
 *       Allows admins to partially update a curated item. All fields are optional — only provided fields will be updated.
 *
 *       • Either `imageUrl` or an uploaded `file` can be used to update the image (uploading a file overrides imageUrl).
 *       • Gender must be one of: `male`, `female`, or `prefer_not_to_say`.
 *       • Price must be greater than 0 if provided.
 *       • Only **admin** users can perform this action.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               curatedItemId:
 *                 type: string
 *                 format: uuid
 *                 example: "35f8106c-c212-4719-8b4f-1e775faee29d"
 *                 description: The ID of the curated item to update
 *               name:
 *                 type: string
 *                 example: "Iphone 21 pro max"
 *                 description: New name for the item (optional)
 *               price:
 *                 type: string
 *                 example: "500.00"
 *                 description: New price as string (must be > 0 if provided)
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 example: "94c25650-72ec-4551-b6c8-3255198043d2"
 *                 description: New category ID (must exist)
 *               gender:
 *                 type: string
 *                 enum: [male, female, prefer_not_to_say]
 *                 example: "female"
 *                 description: New gender for the item (optional)
 *               imageUrl:
 *                 type: string
 *                 nullable: true
 *                 example: "https://iphone.com"
 *                 description: New image URL (optional if file is uploaded)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New image file to upload (takes priority over imageUrl)
 *             required:
 *               - curatedItemId
 *     responses:
 *       200:
 *         description: Curated item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "35f8106c-c212-4719-8b4f-1e775faee29d"
 *                       name:
 *                         type: string
 *                         example: "Iphone 21 pro max"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://iphone.com"
 *                       price:
 *                         type: string
 *                         example: "500.00"
 *                       popularity:
 *                         type: integer
 *                         example: 0
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       itemType:
 *                         type: string
 *                         enum: [global, custom]
 *                         example: "global"
 *                       gender:
 *                         type: string
 *                         enum: [MALE, FEMALE, PREFER_NOT_TO_SAY]
 *                         example: "female"
 *                       isPublic:
 *                         type: boolean
 *                         example: true
 *                       categoryId:
 *                         type: string
 *                         format: uuid
 *                         example: "94c25650-72ec-4551-b6c8-3255198043d2"
 *                       createdBy:
 *                         type: string
 *                         format: uuid
 *                         example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-28T13:47:26.402Z"
 *                 message:
 *                   type: string
 *                   example: "Curated item updated successfully"
 *       400:
 *         description: Bad Request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Price must be greater than 0"
 *       403:
 *         description: Forbidden - Not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Admin access required"
 *       404:
 *         description: Not Found - Item, category, or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Curated item not found"
 *       500:
 *         description: Internal Server Error - Update failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to update curated item"
 */
router.post('/update-item', curatedItemController.updateCuratedItem);
/**
 * @openapi
 * /wishlist/delete-item:
 *   post:
 *     summary: Delete a curated item
 *     description: Deletes an existing curated item from the wishlist using the provided curated item ID. Only authenticated users with admin privileges can delete curated items.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               curatedItemId:
 *                 type: string
 *                 format: uuid
 *                 example: "7e676ba5-2ed5-4b80-b25b-96609d401d13"
 *                 description: The unique identifier of the curated item to delete
 *             required:
 *               - curatedItemId
 *     responses:
 *       200:
 *         description: Curated item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: null
 *                   example: null
 *                   description: No data returned for this response
 *                 message:
 *                   type: string
 *                   example: "Curated item deleted successfully"
 *       400:
 *         description: Bad Request - Missing curated item ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Curated item ID is required"
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Admin access required"
 *       404:
 *         description: Not Found - User or curated item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Curated item not found"
 *       500:
 *         description: Internal Server Error - Failed to delete curated item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to delete curated item"
 */
router.post('/delete-item', curatedItemController.deleteCuratedItem);
//router.post('/seed-data', wishlistController.seedData);

/**
 * @openapi
 * /wishlist/create:
 *   post:
 *     summary: Create a new wishlist
 *     description: >
 *       Creates a new wishlist for the authenticated user. Requires all core fields and validates celebration date (must be in the future).
 *
 *       • Generates a unique public link: `https://joygiver.co/{slugified-event}-{6-char-id}`
 *       • Wishlist automatically expires 7 days after the celebration date.
 *       • Optional `items` array allows adding curated items at creation time.
 *       • Each item in `items` must contain a valid `curatedItemId` that exists in the system.
 *       • All operations are performed in a database transaction for consistency.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - emoji
 *               - colorTheme
 *               - celebrationEvent
 *               - celebrationDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My birthday wishlist"
 *                 description: Name of the wishlist
 *               description:
 *                 type: string
 *                 example: "My birthday wishlist description"
 *                 description: Detailed description of the wishlist
 *               emoji:
 *                 type: string
 *                 example: "birthday-cake"
 *                 description: Emoji representing the wishlist
 *               colorTheme:
 *                 type: string
 *                 example: "purple"
 *                 description: Color theme for the wishlist UI
 *               celebrationEvent:
 *                 type: string
 *                 example: "Birthday"
 *                 description: Name of the celebration (e.g., Birthday, Wedding, Graduation)
 *               celebrationDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-11T23:00:00.000Z"
 *                 description: Date and time of the celebration (must be in the future)
 *               items:
 *                 type: array
 *                 description: Optional list of curated items to add immediately
 *                 items:
 *                   type: object
 *                   required:
 *                     - curatedItemId
 *                   properties:
 *                     curatedItemId:
 *                       type: string
 *                       format: uuid
 *                       example: "35f8106c-c212-4719-8b4f-1e775faee29d"
 *                       description: ID of an existing curated item
 *     responses:
 *       201:
 *         description: Wishlist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "f9b49a73-6d94-4afd-ab50-7c20ef0b6632"
 *                       name:
 *                         type: string
 *                         example: "My birthday wishlist"
 *                       description:
 *                         type: string
 *                         example: "My birthday wishlist description"
 *                       uniqueLink:
 *                         type: string
 *                         example: "https://joygiver.co/birthday-dwe1-F"
 *                         description: Public shareable link for the wishlist
 *                       emoji:
 *                         type: string
 *                         example: "birthday-cake"
 *                       colorTheme:
 *                         type: string
 *                         example: "purple"
 *                       status:
 *                         type: string
 *                         enum: [active, expired, completed]
 *                         example: "active"
 *                       totalContributed:
 *                         type: string
 *                         example: "0.00"
 *                         description: Total amount contributed so far
 *                       contributorsCount:
 *                         type: integer
 *                         example: 0
 *                       viewsCount:
 *                         type: integer
 *                         example: 0
 *                       isPublic:
 *                         type: boolean
 *                         example: true
 *                       celebrationEvent:
 *                         type: string
 *                         example: "Birthday"
 *                       celebrationDate:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-12-11T23:00:00.000Z"
 *                       expiresAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-12-19T00:00:00.000Z"
 *                         description: Auto-set to 7 days after celebration date
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-29T03:47:06.166Z"
 *                 message:
 *                   type: string
 *                   example: "Wishlist created successfully with items"
 *                   description: Message varies depending on whether items were added
 *       400:
 *         description: Bad Request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Celebration date cannot be in the past"
 *       401:
 *         description: Unauthorized - Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to create a wishlist"
 *       404:
 *         description: Not Found - One or more curated items not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Curated item with ID abc123 not found"
 *       500:
 *         description: Internal Server Error - Failed to create wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to create wishlist"
 */
router.post('/create', wishlistController.createWishlist);
/**
 * @openapi
 * /wishlist/add-item:
 *   post:
 *     summary: Add items to user's wishlist
 *     description: Adds one or more curated items to an existing wishlist. Only the wishlist owner can add items. Duplicates are not allowed. Each added item gets a unique public link.
 *     tags:
 *       - Wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wishlistId
 *               - items
 *             properties:
 *               wishlistId:
 *                 type: string
 *                 format: uuid
 *                 example: "f9b49a73-6d94-4afd-ab50-7c20ef0b6632"
 *                 description: ID of the wishlist to add items to
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of curated items to add
 *                 items:
 *                   type: object
 *                   required:
 *                     - curatedItemId
 *                   properties:
 *                     curatedItemId:
 *                       type: string
 *                       format: uuid
 *                       example: "31e32dfd-c1bc-4a0b-810f-9fb1b780bfde"
 *                       description: ID of an existing curated item
 *     responses:
 *       201:
 *         description: Items added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "101111df-4f28-4640-ab85-f11decdea7cb"
 *                       name:
 *                         type: string
 *                         example: "Iphone XR"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://iphone.com"
 *                       price:
 *                         type: string
 *                         example: "500.00"
 *                       quantity:
 *                         type: integer
 *                         example: 1
 *                       amountContributed:
 *                         type: string
 *                         example: "0.00"
 *                       totalContributed:
 *                         type: string
 *                         example: "0.00"
 *                       contributorsCount:
 *                         type: integer
 *                         example: 0
 *                       viewsCount:
 *                         type: integer
 *                         example: 0
 *                       isFunded:
 *                         type: boolean
 *                         example: false
 *                       fundedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       uniqueLink:
 *                         type: string
 *                         example: "https://joygiver.co/iphone-xr-SJilz9chsQ"
 *                         description: Unique public link for this wishlist item
 *                       availableBalance:
 *                         type: string
 *                         example: "0.00"
 *                       pendingBalance:
 *                         type: string
 *                         example: "0.00"
 *                       withdrawnAmount:
 *                         type: string
 *                         example: "0.00"
 *                       isWithdrawable:
 *                         type: boolean
 *                         example: true
 *                       lastWithdrawal:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       wishlistId:
 *                         type: string
 *                         format: uuid
 *                       curatedItemId:
 *                         type: string
 *                         format: uuid
 *                       categoryId:
 *                         type: string
 *                         format: uuid
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-29T04:15:56.480Z"
 *                 message:
 *                   type: string
 *                   example: "Items added to wishlist successfully"
 *       400:
 *         description: Bad Request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Items array is required"
 *       401:
 *         description: Unauthorized - Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to add items to a wishlist"
 *       403:
 *         description: Forbidden - Not the wishlist owner
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Unauthorized to modify this wishlist"
 *       404:
 *         description: Not Found - Wishlist not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to add items to wishlist"
 */
router.post('/add-item', wishlistItemController.addItemsToWishlist);

/**
 * @openapi
 * /wishlist/my-wishlist:
 *   get:
 *     summary: Get authenticated user's active wishlist
 *     description: Returns the currently active and accessible wishlist belonging to the logged-in user along with all its items. Only returns the wishlist if it is public OR (if private) still has ACTIVE status.
 *     tags:
 *       - Wishlist
 *     responses:
 *       200:
 *         description: User's wishlist fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wishlist:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "f9b49a73-6d94-4afd-ab50-7c20ef0b6632"
 *                           name:
 *                             type: string
 *                             example: "My birthday wishlist"
 *                           description:
 *                             type: string
 *                             example: "My birthday wishlist description"
 *                           uniqueLink:
 *                             type: string
 *                             example: "https://joygiver.co/birthday-dwe1-F"
 *                           emoji:
 *                             type: string
 *                             example: "emoji"
 *                           colorTheme:
 *                             type: string
 *                             example: "colorTheme"
 *                           status:
 *                             type: string
 *                             example: "active"
 *                           totalContributed:
 *                             type: string
 *                             example: "0.00"
 *                           contributorsCount:
 *                             type: integer
 *                             example: 0
 *                           viewsCount:
 *                             type: integer
 *                             example: 1
 *                           isPublic:
 *                             type: boolean
 *                             example: true
 *                           celebrationEvent:
 *                             type: string
 *                             example: "Birthday"
 *                           celebrationDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-11T23:00:00.000Z"
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-12-19T00:00:00.000Z"
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T03:47:06.166Z"
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                               example: "Iphone 12 pro max"
 *                             imageUrl:
 *                               type: string
 *                               example: "https://iphone.com"
 *                             price:
 *                               type: string
 *                               example: "1500.00"
 *                             quantity:
 *                               type: integer
 *                               example: 1
 *                             amountContributed:
 *                               type: string
 *                               example: "0.00"
 *                             totalContributed:
 *                               type: string
 *                               example: "0.00"
 *                             contributorsCount:
 *                               type: integer
 *                               example: 0
 *                             viewsCount:
 *                               type: integer
 *                               example: 0
 *                             isFunded:
 *                               type: boolean
 *                               example: false
 *                             fundedAt:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                             uniqueLink:
 *                               type: string
 *                               example: "https://joygiver.co/iphone-12-pro-max-_whlPOPSOU"
 *                             availableBalance:
 *                               type: string
 *                               example: "0.00"
 *                             pendingBalance:
 *                               type: string
 *                               example: "0.00"
 *                             withdrawnAmount:
 *                               type: string
 *                               example: "0.00"
 *                             isWithdrawable:
 *                               type: boolean
 *                               example: true
 *                             lastWithdrawal:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                             wishlistId:
 *                               type: string
 *                               format: uuid
 *                             curatedItemId:
 *                               type: string
 *                               format: uuid
 *                             categoryId:
 *                               type: string
 *                               format: uuid
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                 message:
 *                   type: string
 *                   example: "Wishlists fetched successfully"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please login to view your wishlists"
 *       403:
 *         description: Forbidden - Wishlist is private and not active
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "This wishlist is not available"
 *       404:
 *         description: Not Found - No wishlist or items found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No wishlists found for this user"
 */
router.get('/my-wishlist', wishlistController.getUserWishlist);

router.get('/stats', wishlistController.getWishlistStats);
router.post('/withdraw-all-funds', wishlistController.withdrawAllFromWishlist);
/**
 * @openapi
 * /wishlist/item:
 *   get:
 *     summary: Retrieve a wishlist item by unique link
 *     description: Fetches a specific wishlist item using its unique link and tracks the view with the requester's IP address, user agent, and referrer. The unique link must be provided in the query parameters.
 *     tags:
 *       - Wishlist
 *     parameters:
 *       - in: query
 *         name: uniqueLink
 *         schema:
 *           type: string
 *           example: "wishlist-item-EOdxXz489N"
 *         required: true
 *         description: The unique link identifier for the wishlist item (e.g., the path portion after 'https://joygiver.co/')
 *     responses:
 *       200:
 *         description: Wishlist item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "220031d9-b808-4f5a-a811-8c5a6271ecc7"
 *                         description: The unique identifier of the wishlist item
 *                       name:
 *                         type: string
 *                         example: "Business Strategy Book"
 *                         description: The name of the wishlist item
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         example: "https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12"
 *                         description: The URL of the wishlist item's image
 *                       price:
 *                         type: string
 *                         example: "25.00"
 *                         description: The price of the wishlist item
 *                       quantity:
 *                         type: integer
 *                         example: 1
 *                         description: The requested quantity of the wishlist item
 *                       quantityFulfilled:
 *                         type: integer
 *                         example: 0
 *                         description: The quantity of the wishlist item that has been fulfilled
 *                       amountContributed:
 *                         type: string
 *                         example: "0.00"
 *                         description: The total amount contributed towards the wishlist item
 *                       priority:
 *                         type: integer
 *                         example: 4
 *                         description: The priority order of the wishlist item
 *                       wishlistId:
 *                         type: string
 *                         format: uuid
 *                         example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *                         description: The ID of the wishlist the item belongs to
 *                       curatedItemId:
 *                         type: string
 *                         format: uuid
 *                         example: "0e066f7c-004d-4756-b2bc-665133333247"
 *                         description: The ID of the curated item
 *                       categoryId:
 *                         type: string
 *                         format: uuid
 *                         example: "02929535-d11d-433e-afd8-07aca0dc19f2"
 *                         description: The ID of the category to which the item belongs
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-07T04:08:05.376Z"
 *                         description: Timestamp when the wishlist item was created
 *                       totalContributed:
 *                         type: string
 *                         example: "0.00"
 *                         description: The total amount contributed towards the wishlist item
 *                       contributorsCount:
 *                         type: integer
 *                         example: 0
 *                         description: The number of contributors to the wishlist item
 *                       isFunded:
 *                         type: boolean
 *                         example: false
 *                         description: Indicates if the wishlist item is fully funded
 *                       fundedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                         description: Timestamp when the wishlist item was fully funded
 *                       uniqueLink:
 *                         type: string
 *                         example: "https://joygiver.co/wishlist-item-EOdxXz489N"
 *                         description: The unique URL for accessing the wishlist item
 *                       viewsCount:
 *                         type: integer
 *                         example: 13
 *                         description: The number of views of the wishlist item
 *                 message:
 *                   type: string
 *                   example: "Wishlist item retrieved successfully"
 *       400:
 *         description: Bad Request - Missing unique link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Unique link is required"
 *       404:
 *         description: Not Found - Wishlist item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist not found"
 */
router.get('/item', wishlistItemController.getItemByLink);

router.get('/item-stats', wishlistItemController.getWishlistItemStats);
router.post('/item-withdraw', wishlistItemController.withdrawFromItem);
router.get('/item-balance', wishlistItemController.getItemBalance);

/**
 * @openapi
 * /wishlist/create-template:
 *   post:
 *     summary: Create a new wishlist template (Admin only)
 *     description: Allows admins to create reusable wishlist templates with predefined items. Templates include name, emoji, color theme, description, and optional curated items.
 *     tags:
 *       - Wishlist Template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - emoji
 *               - colorTheme
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My birthday wishlist Template"
 *                 description: Name of the template
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "My birthday wishlist description template"
 *                 description: Optional description
 *               emoji:
 *                 type: string
 *                 example: "party-popper"
 *                 description: Emoji representing the template
 *               colorTheme:
 *                 type: string
 *                 example: "purple"
 *                 description: Color theme for the template
 *               items:
 *                 type: array
 *                 description: Optional array of curated items to include in the template
 *                 items:
 *                   type: object
 *                   required:
 *                     - curatedItemId
 *                   properties:
 *                     curatedItemId:
 *                       type: string
 *                       format: uuid
 *                       example: "31e32dfd-c1bc-4a0b-810f-9fb1b780bfde"
 *                       description: ID of an existing curated item
 *     responses:
 *       201:
 *         description: Wishlist template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     oneOf:
 *                       # Wishlist Template Object
 *                       - properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                           name:
 *                             type: string
 *                             example: "My birthday wishlist Template"
 *                           description:
 *                             type: string
 *                             nullable: true
 *                             example: "My birthday wishlist description template"
 *                           emoji:
 *                             type: string
 *                             example: "emoji"
 *                           colorTheme:
 *                             type: string
 *                             example: "colorTheme"
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T04:35:56.846Z"
 *                       # Template Item Object
 *                       - properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "651f3d7c-9a73-4ad7-9d01-ab5a08b4b29e"
 *                           name:
 *                             type: string
 *                             example: "Iphone XR"
 *                           imageUrl:
 *                             type: string
 *                             example: "https://iphone.com"
 *                           price:
 *                             type: string
 *                             example: "500.00"
 *                           wishlistTemplateId:
 *                             type: string
 *                             format: uuid
 *                             example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                           curatedItemId:
 *                             type: string
 *                             format: uuid
 *                           categoryId:
 *                             type: string
 *                             format: uuid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T04:35:56.867Z"
 *                 message:
 *                   type: string
 *                   example: "Wishlist template created successfully with items"
 *                   description: Message changes if items were added or not
 *       400:
 *         description: Bad Request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Each item must have curatedItemId"
 *       401:
 *         description: Unauthorized - Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to create a wishlist template"
 *       403:
 *         description: Forbidden - Not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Only admins can create wishlist templates"
 *       404:
 *         description: Not Found - Curated item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Curated item with ID abc123 not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to create wishlist template"
 */
router.post('/create-template', wishlistTemplateController.createWishlistTemplate);
/**
 * @openapi
 * /wishlist/templates:
 *   get:
 *     summary: Get all wishlist templates
 *     description: Returns all available wishlist templates with their associated items. Only authenticated users can access this endpoint.
 *     tags:
 *       - Wishlist Template
 *     responses:
 *       200:
 *         description: Wishlist templates fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wishlistTemplate:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                           name:
 *                             type: string
 *                             example: "My birthday wishlist Template"
 *                           description:
 *                             type: string
 *                             nullable: true
 *                             example: "My birthday wishlist description template"
 *                           emoji:
 *                             type: string
 *                             example: "emoji"
 *                           colorTheme:
 *                             type: string
 *                             example: "colorTheme"
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T04:35:56.846Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T04:35:56.846Z"
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "651f3d7c-9a73-4ad7-9d01-ab5a08b4b29e"
 *                             name:
 *                               type: string
 *                               example: "Iphone XR"
 *                             imageUrl:
 *                               type: string
 *                               example: "https://iphone.com"
 *                             price:
 *                               type: string
 *                               example: "500.00"
 *                             wishlistTemplateId:
 *                               type: string
 *                               format: uuid
 *                               example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                             curatedItemId:
 *                               type: string
 *                               format: uuid
 *                             categoryId:
 *                               type: string
 *                               format: uuid
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-11-29T04:35:56.867Z"
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-11-29T04:35:56.867Z"
 *                 message:
 *                   type: string
 *                   example: "Wishlist templates fetched successfully"
 *       401:
 *         description: Unauthorized - Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please login to view wishlist templates"
 *       404:
 *         description: Not Found - No templates or items found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "No wishlist templates found for this user"
 */
router.get('/templates', wishlistTemplateController.getWishlistTemplates);
/**
 * @openapi
 * /wishlist/template:
 *   get:
 *     summary: Get a wishlist template by ID
 *     description: Retrieves a specific wishlist template along with all its associated items. Only authenticated users can access this endpoint.
 *     tags:
 *       - Wishlist Template
 *     parameters:
 *       - in: path
 *         name: wishlistTemplateId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *         description: The ID of the wishlist template to retrieve
 *     responses:
 *       200:
 *         description: Wishlist template fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       wishlistTemplate:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                           name:
 *                             type: string
 *                             example: "My birthday wishlist Template"
 *                           description:
 *                             type: string
 *                             nullable: true
 *                             example: "My birthday wishlist description template"
 *                           emoji:
 *                             type: string
 *                             example: "emoji"
 *                           colorTheme:
 *                             type: string
 *                             example: "colorTheme"
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T04:35:56.846Z"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-11-29T04:35:56.846Z"
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "651f3d7c-9a73-4ad7-9d01-ab5a08b4b29e"
 *                             name:
 *                               type: string
 *                               example: "Iphone XR"
 *                             imageUrl:
 *                               type: string
 *                               example: "https://iphone.com"
 *                             price:
 *                               type: string
 *                               example: "500.00"
 *                             wishlistTemplateId:
 *                               type: string
 *                               format: uuid
 *                               example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                             curatedItemId:
 *                               type: string
 *                               format: uuid
 *                             categoryId:
 *                               type: string
 *                               format: uuid
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-11-29T04:35:56.867Z"
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-11-29T04:35:56.867Z"
 *                 message:
 *                   type: string
 *                   example: "Wishlist template fetched successfully"
 *       401:
 *         description: Unauthorized - Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please login to view wishlist templates"
 *       404:
 *         description: Not Found - Template or items not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist Template not found"
 */
router.get('/template', wishlistTemplateController.getWishlistTemplateById);
/**
 * @openapi
 * /wishlist/template/add-items:
 *   post:
 *     summary: Add items to a wishlist template
 *     description: Adds one or more curated items to an existing wishlist template. Duplicates are not allowed (checked by curatedItemId). Only authenticated users can use this endpoint.
 *     tags:
 *       - Wishlist Template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - wishlistTemplateId
 *               - items
 *             properties:
 *               wishlistTemplateId:
 *                 type: string
 *                 format: uuid
 *                 example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                 description: ID of the wishlist template to add items to
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of curated items to add
 *                 items:
 *                   type: object
 *                   required:
 *                     - curatedItemId
 *                   properties:
 *                     curatedItemId:
 *                       type: string
 *                       format: uuid
 *                       example: "da545e55-13a8-4c59-bf73-9de9519b1bc0"
 *                       description: ID of an existing curated item
 *     responses:
 *       201:
 *         description: Items added to template successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "a2083c0e-2fdd-4276-bba3-fca7f07cb722"
 *                       name:
 *                         type: string
 *                         example: "Iphone 12 pro max"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://iphone.com"
 *                       price:
 *                         type: string
 *                         example: "1500.00"
 *                       wishlistTemplateId:
 *                         type: string
 *                         format: uuid
 *                         example: "67224c73-b6d4-44a2-8217-2a4fe1ec77e0"
 *                       curatedItemId:
 *                         type: string
 *                         format: uuid
 *                         example: "da545e55-13a8-4c59-bf73-9de9519b1bc0"
 *                       categoryId:
 *                         type: string
 *                         format: uuid
 *                         example: "94c25650-72ec-4551-b6c8-3255198043d2"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-29T05:04:39.044Z"
 *                 message:
 *                   type: string
 *                   example: "Items added to wishlist successfully"
 *       400:
 *         description: Bad Request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Each item must have a curatedItemId"
 *       401:
 *         description: Unauthorized - Not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in to add items to a wishlist"
 *       404:
 *         description: Not Found - Template not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Wishlist Template not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Failed to add items to wishlist"
 */
router.post('/template/add-items', wishlistTemplateItemController.addItemsToWishlistTemplate);

/**
 * @openapi
 * /wishlist/reply-contributor:
 *   post:
 *     summary: Reply to a contributor
 *     description: Allows the wishlist owner to send a reply to a contributor for a specific contribution. Requires user authentication and ensures the user owns the wishlist associated with the contribution. The reply message is required.
 *     tags:
 *       - Contributions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contributionId:
 *                 type: string
 *                 format: uuid
 *                 example: "21c8b1c9-c4b1-438c-83c5-6f03f4d02f6b"
 *                 description: The unique identifier of the contribution to reply to
 *               ownerReply:
 *                 type: string
 *                 example: "Thank you for your contribution!"
 *                 description: The reply message from the wishlist owner
 *             required:
 *               - contributionId
 *               - ownerReply
 *     responses:
 *       200:
 *         description: Reply sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: null
 *                   example: null
 *                   description: No data returned for this response
 *                 message:
 *                   type: string
 *                   example: "Reply sent successfully"
 *       400:
 *         description: Bad Request - Missing owner reply message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "ownerReply message is required"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in"
 *       403:
 *         description: Forbidden - User does not own the wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Not Found - Contribution or wishlist not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Contribution not found"
 */
router.post('/reply-contributor', contributionController.replyToContributor);
/**
 * @openapi
 * /wishlist/my-contributions:
 *   get:
 *     summary: Retrieve contributions for all user's wishlists
 *     description: Fetches a paginated list of all contributions across all wishlists owned by the authenticated user. Contributions are sorted by creation date in descending order. Supports pagination through query parameters for page and limit. Requires user authentication.
 *     tags:
 *       - Contributions
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *           default: 20
 *         description: The number of records to return per page
 *     responses:
 *       200:
 *         description: Contributions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "21c8b1c9-c4b1-438c-83c5-6f03f4d02f6b"
 *                             description: The unique identifier of the contribution
 *                           wishlistId:
 *                             type: string
 *                             format: uuid
 *                             example: "e9988d8b-d9c6-4dc8-aaf1-5d8e284eeae6"
 *                             description: The ID of the wishlist
 *                           wishlistItemId:
 *                             type: string
 *                             format: uuid
 *                             example: "220031d9-b808-4f5a-a811-8c5a6271ecc7"
 *                             description: The ID of the wishlist item
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             example: null
 *                             description: The ID of the user making the contribution (if authenticated)
 *                           contributorName:
 *                             type: string
 *                             example: "David Daviiiii"
 *                             description: The name of the contributor
 *                           contributorEmail:
 *                             type: string
 *                             format: email
 *                             example: "daveuchenna2404@gmail.com"
 *                             description: The email address of the contributor
 *                           contributorPhone:
 *                             type: string
 *                             example: "09154064012"
 *                             description: The phone number of the contributor
 *                           message:
 *                             type: string
 *                             nullable: true
 *                             example: "Hello! Manage this small something"
 *                             description: Optional message provided by the contributor
 *                           isAnonymous:
 *                             type: boolean
 *                             example: false
 *                             description: Indicates if the contribution is anonymous
 *                           amount:
 *                             type: string
 *                             example: "200.00"
 *                             description: The contribution amount
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                             description: The status of the contribution (e.g., pending, completed)
 *                           paymentReference:
 *                             type: string
 *                             example: "CONT-jTJG2VO-xJvEBYCD"
 *                             description: The unique reference for the contribution payment
 *                           paymentMethod:
 *                             type: string
 *                             example: "paystack"
 *                             description: The payment method used for the contribution
 *                           paystackReference:
 *                             type: string
 *                             nullable: true
 *                             example: "CONT-jTJG2VO-xJvEBYCD"
 *                             description: The Paystack reference for the payment
 *                           ownerReply:
 *                             type: string
 *                             nullable: true
 *                             example: "Thank you veru much for the gift"
 *                             description: The reply from the wishlist owner (if any)
 *                           repliedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2025-10-12T21:32:53.597Z"
 *                             description: Timestamp when the owner replied
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             example: null
 *                             description: Additional metadata for the contribution
 *                           paidAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: "2025-10-12T21:09:59.273Z"
 *                             description: Timestamp when the contribution was paid
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T20:44:17.921Z"
 *                             description: Timestamp when the contribution was created
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-12T21:32:53.598Z"
 *                             description: Timestamp when the contribution was last updated
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                           description: The current page number
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                           description: The number of records per page
 *                         total:
 *                           type: integer
 *                           example: 2
 *                           description: The total number of contributions
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *                           description: The total number of pages
 *                 message:
 *                   type: string
 *                   example: "Contributions retrieved successfully"
 *       401:
 *         description: Unauthorized - User not logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Please log in"
 */
router.get('/my-contributions', contributionController.getMyWishlistsContributions);
/**
 * @openapi
 * /wishlist/verify-payment:
 *   get:
 *     summary: Verify payment status for a contribution
 *     description: Retrieves the payment status of a contribution by its payment reference. Requires admin authentication. Returns details including the contribution status, amount, contributor name, and payment timestamp.
 *     tags:
 *       - Contributions
 *     parameters:
 *       - in: query
 *         name: reference
 *         schema:
 *           type: string
 *           example: "CONT-jTJG2VO-xJvEBYCD"
 *         required: true
 *         description: The payment reference of the contribution to verify
 *     responses:
 *       200:
 *         description: Payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                       description: The status of the contribution (e.g., pending, completed)
 *                     amount:
 *                       type: string
 *                       example: "200.00"
 *                       description: The contribution amount
 *                     contributorName:
 *                       type: string
 *                       example: "David Daviiiii"
 *                       description: The name of the contributor
 *                     paidAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2025-10-12T21:09:59.273Z"
 *                       description: Timestamp when the contribution was paid
 *                 message:
 *                   type: string
 *                   example: "Payment status retrieved successfully"
 *       403:
 *         description: Forbidden - User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Not Found - Reference or contribution not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "reference not found"
 */
router.get('/verify-payment', contributionController.verifyPayment);

router.get('/contributions-per-user', contributionController.getAllContributionsPerUser);

export { router as wishlistRouter };
