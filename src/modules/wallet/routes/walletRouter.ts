import { payoutController, walletController, withdrawalController } from '../controller';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();
router.use(protect);

// ==================== WALLET ROUTES ====================
/**
 * @openapi
 * /wallet/user:
 *   get:
 *     summary: Retrieve or create user wallet
 *     description: Fetches the wallet for the authenticated user. If no wallet exists for the user, a new wallet is created with initial balances set to zero. Requires user authentication.
 *     tags:
 *       - Wallet
 *     responses:
 *       201:
 *         description: Wallet retrieved or created successfully
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
 *                         example: "f8a12d2f-7e7b-484c-b0e4-d2839c459027"
 *                         description: The unique identifier of the wallet
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                         description: The ID of the user associated with the wallet
 *                       availableBalance:
 *                         type: string
 *                         example: "0.00"
 *                         description: The available balance in the wallet
 *                       pendingBalance:
 *                         type: string
 *                         example: "0.00"
 *                         description: The pending balance in the wallet
 *                       totalReceived:
 *                         type: string
 *                         example: "0.00"
 *                         description: The total amount received in the wallet
 *                       totalWithdrawn:
 *                         type: string
 *                         example: "0.00"
 *                         description: The total amount withdrawn from the wallet
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-10T09:45:53.611Z"
 *                         description: Timestamp when the wallet was created
 *                 message:
 *                   type: string
 *                   example: "Wallet created successfully"
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
 *                   example: "Please log in to create a wallet"
 */
router.get('/user', walletController.getUserWallet);
/**
 * @openapi
 * /wallet/summary:
 *   get:
 *     summary: Retrieve user wallet summary
 *     description: Fetches a comprehensive summary of the authenticated user's wallet, including wallet details, payout methods, the number of unique contributors, and the total number of wishlist items. Requires user authentication.
 *     tags:
 *       - Wallet
 *     responses:
 *       200:
 *         description: Wallet summary retrieved successfully
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
 *                       wallet:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "f8a12d2f-7e7b-484c-b0e4-d2839c459027"
 *                             description: The unique identifier of the wallet
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                             example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                             description: The ID of the user associated with the wallet
 *                           availableBalance:
 *                             type: string
 *                             example: "0.00"
 *                             description: The available balance in the wallet
 *                           pendingBalance:
 *                             type: string
 *                             example: "0.00"
 *                             description: The pending balance in the wallet
 *                           totalReceived:
 *                             type: string
 *                             example: "0.00"
 *                             description: The total amount received in the wallet
 *                           totalWithdrawn:
 *                             type: string
 *                             example: "0.00"
 *                             description: The total amount withdrawn from the wallet
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-10T09:45:53.611Z"
 *                             description: Timestamp when the wallet was created
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-10-10T09:45:53.611Z"
 *                             description: Timestamp when the wallet was last updated
 *                       payoutMethods:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "73961b36-d31f-4797-95f6-7c8aca98d2e3"
 *                               description: The unique identifier of the payout method
 *                             userId:
 *                               type: string
 *                               format: uuid
 *                               example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                               description: The ID of the user associated with the payout method
 *                             accountName:
 *                               type: string
 *                               example: "UCHENNA DAVID OKONKWO"
 *                               description: The name associated with the bank account
 *                             accountNumber:
 *                               type: string
 *                               example: "2403016646"
 *                               description: The bank account number
 *                             bankName:
 *                               type: string
 *                               example: "Zenith Bank"
 *                               description: The name of the bank
 *                             bankCode:
 *                               type: string
 *                               example: "057"
 *                               description: The code of the bank
 *                             bvn:
 *                               type: string
 *                               nullable: true
 *                               example: null
 *                               description: The Bank Verification Number (if provided)
 *                             recipientCode:
 *                               type: string
 *                               example: "RCP_ldux2s94ug8ug8k"
 *                               description: The recipient code generated by the Paystack service
 *                             isVerified:
 *                               type: boolean
 *                               example: true
 *                               description: Indicates if the payout method has been verified
 *                             isPrimary:
 *                               type: boolean
 *                               example: true
 *                               description: Indicates if this is the primary payout method
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-10-10T10:33:52.771Z"
 *                               description: Timestamp when the payout method was created
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-10-10T10:48:34.305Z"
 *                               description: Timestamp when the payout method was last updated
 *                       contributorsCount:
 *                         type: integer
 *                         example: 0
 *                         description: The number of unique contributors to the user's wishlists
 *                       wishlistItemsCount:
 *                         type: integer
 *                         example: 16
 *                         description: The total number of items in the user's wishlists
 *                 message:
 *                   type: string
 *                   example: "Wallet summary retrieved successfully"
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
 *                   example: "Please log in to view your wallet"
 *       404:
 *         description: Not Found - Wallet summary not found
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
 *                   example: "Wallet summary not found"
 */
router.get('/summary', walletController.getWalletSummary);
router.get('/transactions', walletController.getTransactionHistory);

// ==================== PAYOUT METHOD ROUTES ====================
/**
 * @openapi
 * /wallet/banks:
 *   get:
 *     summary: Retrieve list of banks
 *     description: Fetches a list of banks available through the Paystack service. Users can optionally filter banks by name or bank code using the search query parameter. Requires user authentication.
 *     tags:
 *       - Wallet
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: "Guaranty Trust Bank"
 *         description: Optional search term to filter banks by name or bank code
 *     responses:
 *       200:
 *         description: Banks retrieved successfully
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
 *                         type: integer
 *                         example: 9
 *                         description: The unique identifier of the bank
 *                       name:
 *                         type: string
 *                         example: "Guaranty Trust Bank"
 *                         description: The name of the bank
 *                       slug:
 *                         type: string
 *                         example: "guaranty-trust-bank"
 *                         description: The slugified name of the bank
 *                       code:
 *                         type: string
 *                         example: "058"
 *                         description: The bank code
 *                       longcode:
 *                         type: string
 *                         example: "058152036"
 *                         description: The long code for the bank
 *                       gateway:
 *                         type: string
 *                         example: "ibank"
 *                         description: The payment gateway used by the bank
 *                       pay_with_bank:
 *                         type: boolean
 *                         example: false
 *                         description: Indicates if direct bank payment is supported
 *                       supports_transfer:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the bank supports transfers
 *                       available_for_direct_debit:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the bank is available for direct debit
 *                       active:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the bank is active
 *                       country:
 *                         type: string
 *                         example: "Nigeria"
 *                         description: The country where the bank operates
 *                       currency:
 *                         type: string
 *                         example: "NGN"
 *                         description: The currency supported by the bank
 *                       type:
 *                         type: string
 *                         example: "nuban"
 *                         description: The type of bank account number format
 *                       is_deleted:
 *                         type: boolean
 *                         example: false
 *                         description: Indicates if the bank has been deleted
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2016-07-14T10:04:29.000Z"
 *                         description: Timestamp when the bank record was created
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-11-14T12:30:43.000Z"
 *                         description: Timestamp when the bank record was last updated
 *                 message:
 *                   type: string
 *                   example: "Banks retrieved successfully"
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
 *                   example: "Please log in to view banks"
 *       500:
 *         description: Internal Server Error - Failed to retrieve banks
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
 *                   example: "Failed to retrieve banks"
 */
router.get('/banks', payoutController.getBanks);
/**
 * @openapi
 * /wallet/verify-account:
 *   post:
 *     summary: Verify a bank account number
 *     description: Verifies a bank account number using the provided account number and bank code. Requires user authentication.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "2403016646"
 *                 description: The bank account number to verify
 *               bankCode:
 *                 type: string
 *                 example: "058"
 *                 description: The code of the bank associated with the account
 *             required:
 *               - accountNumber
 *               - bankCode
 *     responses:
 *       200:
 *         description: Account verified successfully
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
 *                       account_number:
 *                         type: string
 *                         example: "2403016646"
 *                         description: The verified bank account number
 *                       account_name:
 *                         type: string
 *                         example: "UCHENNA DAVID OKONKWO"
 *                         description: The name associated with the bank account
 *                       bank_id:
 *                         type: integer
 *                         example: 21
 *                         description: The unique identifier of the bank
 *                 message:
 *                   type: string
 *                   example: "Account verified successfully"
 *       400:
 *         description: Bad Request - Missing account number or bank code, or verification failed
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
 *                   example: "Account number and bank code are required"
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
 *                   example: "Please log in to verify account"
 */
router.post('/verify-account', payoutController.verifyAccountNumber);
/**
 * @openapi
 * /wallet/payout-method:
 *   post:
 *     summary: Add a new payout method
 *     description: Adds a new payout method for the authenticated user by verifying the provided account number and bank code using the Paystack service. Ensures the account does not already exist for the user and optionally sets the payout method as primary. If set as primary, unsets other primary payout methods for the user.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountNumber:
 *                 type: string
 *                 example: "2403016646"
 *                 description: The bank account number to add as a payout method
 *               bankCode:
 *                 type: string
 *                 example: "057"
 *                 description: The code of the bank associated with the account
 *               isPrimary:
 *                 type: boolean
 *                 example: true
 *                 description: Indicates if this payout method should be set as the primary method
 *             required:
 *               - accountNumber
 *               - bankCode
 *     responses:
 *       201:
 *         description: Payout method added successfully
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
 *                         example: "73961b36-d31f-4797-95f6-7c8aca98d2e3"
 *                         description: The unique identifier of the payout method
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                         description: The ID of the user associated with the payout method
 *                       accountName:
 *                         type: string
 *                         example: "UCHENNA DAVID OKONKWO"
 *                         description: The name associated with the bank account
 *                       accountNumber:
 *                         type: string
 *                         example: "2403016646"
 *                         description: The bank account number
 *                       bankName:
 *                         type: string
 *                         example: "Zenith Bank"
 *                         description: The name of the bank
 *                       bankCode:
 *                         type: string
 *                         example: "057"
 *                         description: The code of the bank
 *                       bvn:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                         description: The Bank Verification Number (if provided)
 *                       recipientCode:
 *                         type: string
 *                         example: "RCP_ldux2s94ug8ug8k"
 *                         description: The recipient code generated by the Paystack service
 *                       isVerified:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the payout method has been verified
 *                       isPrimary:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if this is the primary payout method
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-10T10:33:52.771Z"
 *                         description: Timestamp when the payout method was created
 *                 message:
 *                   type: string
 *                   example: "Payout method added successfully"
 *       400:
 *         description: Bad Request - Missing account number or bank code, account already exists, or verification failed
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
 *                   example: "Account number and bank code are required"
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
 *                   example: "Please log in to add a payout method"
 */
router.post('/payout-method', payoutController.addPayoutMethod);
/**
 * @openapi
 * /wallet/payout-methods:
 *   get:
 *     summary: Retrieve user payout methods
 *     description: Fetches all payout methods associated with the authenticated user. Requires user authentication.
 *     tags:
 *       - Wallet
 *     responses:
 *       200:
 *         description: Payout methods retrieved successfully
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
 *                         example: "73961b36-d31f-4797-95f6-7c8aca98d2e3"
 *                         description: The unique identifier of the payout method
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                         description: The ID of the user associated with the payout method
 *                       accountName:
 *                         type: string
 *                         example: "UCHENNA DAVID OKONKWO"
 *                         description: The name associated with the bank account
 *                       accountNumber:
 *                         type: string
 *                         example: "2403016646"
 *                         description: The bank account number
 *                       bankName:
 *                         type: string
 *                         example: "Zenith Bank"
 *                         description: The name of the bank
 *                       bankCode:
 *                         type: string
 *                         example: "057"
 *                         description: The code of the bank
 *                       bvn:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                         description: The Bank Verification Number (if provided)
 *                       recipientCode:
 *                         type: string
 *                         example: "RCP_ldux2s94ug8ug8k"
 *                         description: The recipient code generated by the Paystack service
 *                       isVerified:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the payout method has been verified
 *                       isPrimary:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if this is the primary payout method
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-10T10:33:52.771Z"
 *                         description: Timestamp when the payout method was created
 *                 message:
 *                   type: string
 *                   example: "Payout methods retrieved successfully"
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
 *                   example: "Please log in to view payout methods"
 */
router.get('/payout-methods', payoutController.getPayoutMethods);
/**
 * @openapi
 * /wallet/primary/payout-method:
 *   post:
 *     summary: Set a payout method as primary
 *     description: Sets the specified payout method as the primary method for the authenticated user. Unsets any existing primary payout method for the user before setting the new one. Requires user authentication and the payout method must belong to the user.
 *     tags:
 *       - Wallet
 *     parameters:
 *       - in: query
 *         name: payoutMethodId
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "73961b36-d31f-4797-95f6-7c8aca98d2e3"
 *         required: true
 *         description: The unique identifier of the payout method to set as primary
 *     responses:
 *       200:
 *         description: Primary payout method updated successfully
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
 *                         example: "73961b36-d31f-4797-95f6-7c8aca98d2e3"
 *                         description: The unique identifier of the payout method
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                         description: The ID of the user associated with the payout method
 *                       accountName:
 *                         type: string
 *                         example: "UCHENNA DAVID OKONKWO"
 *                         description: The name associated with the bank account
 *                       accountNumber:
 *                         type: string
 *                         example: "2403016646"
 *                         description: The bank account number
 *                       bankName:
 *                         type: string
 *                         example: "Zenith Bank"
 *                         description: The name of the bank
 *                       bankCode:
 *                         type: string
 *                         example: "057"
 *                         description: The code of the bank
 *                       bvn:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                         description: The Bank Verification Number (if provided)
 *                       recipientCode:
 *                         type: string
 *                         example: "RCP_ldux2s94ug8ug8k"
 *                         description: The recipient code generated by the Paystack service
 *                       isVerified:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if the payout method has been verified
 *                       isPrimary:
 *                         type: boolean
 *                         example: true
 *                         description: Indicates if this is the primary payout method
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-10T10:33:52.771Z"
 *                         description: Timestamp when the payout method was created
 *                 message:
 *                   type: string
 *                   example: "Primary payout method updated successfully"
 *       400:
 *         description: Bad Request - Missing payout method ID
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
 *                   example: "Payout method ID is required"
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
 *         description: Forbidden - User not authorized to modify the payout method
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
 *         description: Not Found - Payout method not found
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
 *                   example: "Payout method not found"
 */
router.post('/primary/payout-method', payoutController.setPrimaryPayoutMethod);
/**
 * @openapi
 * /wallet/remove/payout-method:
 *   post:
 *     summary: Delete a payout method
 *     description: Deletes a specified payout method for the authenticated user. Ensures the payout method belongs to the user and has no pending or processing withdrawal requests. Requires user authentication.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payoutMethodId:
 *                 type: string
 *                 format: uuid
 *                 example: "73961b36-d31f-4797-95f6-7c8aca98d2e3"
 *                 description: The unique identifier of the payout method to delete
 *             required:
 *               - payoutMethodId
 *     responses:
 *       200:
 *         description: Payout method deleted successfully
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
 *                   example: "Payout method deleted successfully"
 *       400:
 *         description: Bad Request - Missing payout method ID or pending withdrawals exist
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
 *                   example: "Payout method ID is required"
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
 *         description: Forbidden - User not authorized to delete the payout method
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
 *         description: Not Found - Payout method not found
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
 *                   example: "Payout method not found"
 */
router.post('/remove/payout-method', payoutController.deletePayoutMethod);

// ==================== WITHDRAWAL ROUTES ====================
/**
 * @openapi
 * /wallet/withdraw:
 *   post:
 *     summary: Create a withdrawal request
 *     description: Creates a withdrawal request for the authenticated user with the specified amount and optional payout method ID. If no payout method ID is provided, the primary payout method is used. Validates the withdrawal amount against minimum limits and available balance, calculates fees, and initiates a transfer via Paystack. The operation is performed within a transaction to ensure consistency.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *                 example: "2000.00"
 *                 description: The amount to withdraw (must be greater than the minimum withdrawal limit)
 *               payoutMethodId:
 *                 type: string
 *                 format: uuid
 *                 example: "4f04e72b-f91c-42bf-984f-42ee2bc18009"
 *                 description: The ID of the payout method to use (optional; defaults to primary payout method)
 *             required:
 *               - amount
 *     responses:
 *       201:
 *         description: Withdrawal request created successfully
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
 *                         example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *                         description: The unique identifier of the withdrawal request
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                         description: The ID of the user making the withdrawal
 *                       walletId:
 *                         type: string
 *                         format: uuid
 *                         example: "f8a12d2f-7e7b-484c-b0e4-d2839c459027"
 *                         description: The ID of the wallet from which the withdrawal is made
 *                       payoutMethodId:
 *                         type: string
 *                         format: uuid
 *                         example: "4f04e72b-f91c-42bf-984f-42ee2bc18009"
 *                         description: The ID of the payout method used for the withdrawal
 *                       amount:
 *                         type: string
 *                         example: "2000.00"
 *                         description: The requested withdrawal amount
 *                       fee:
 *                         type: string
 *                         example: "20.00"
 *                         description: The fee charged for the withdrawal
 *                       netAmount:
 *                         type: string
 *                         example: "1980.00"
 *                         description: The net amount to be transferred after fees
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                         description: The status of the withdrawal request (e.g., pending, processing)
 *                       paymentReference:
 *                         type: string
 *                         example: "WTH-x7nJV0HZJCVwsyXt"
 *                         description: The unique reference for the withdrawal transaction
 *                       transferCode:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                         description: The transfer code generated by Paystack (null until processed)
 *                       failureReason:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                         description: The reason for failure, if the withdrawal fails
 *                       processedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                         description: Timestamp when the withdrawal was processed
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-11T03:20:52.793Z"
 *                         description: Timestamp when the withdrawal request was created
 *                 message:
 *                   type: string
 *                   example: "Withdrawal request created successfully"
 *       400:
 *         description: Bad Request - Invalid amount, insufficient balance, invalid payout method, or unverified payout method
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
 *                   example: "Invalid withdrawal amount"
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
 *                   example: "Please log in to withdraw funds"
 *       404:
 *         description: Not Found - Wallet or payout method not found
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
 *                   example: "Wallet not found"
 */
router.post('/withdraw', withdrawalController.createWithdrawal);
/**
 * @openapi
 * /wallet/withdrawal-history:
 *   get:
 *     summary: Retrieve user withdrawal history
 *     description: Fetches the withdrawal history for the authenticated user, including details of each withdrawal request. Supports pagination through query parameters for page and limit. Requires user authentication.
 *     tags:
 *       - Wallet
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
 *         description: Withdrawal history retrieved successfully
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
 *                       withdrawals:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                               example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *                               description: The unique identifier of the withdrawal request
 *                             userId:
 *                               type: string
 *                               format: uuid
 *                               example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                               description: The ID of the user who made the withdrawal
 *                             walletId:
 *                               type: string
 *                               format: uuid
 *                               example: "f8a12d2f-7e7b-484c-b0e4-d2839c459027"
 *                               description: The ID of the wallet from which the withdrawal was made
 *                             payoutMethodId:
 *                               type: string
 *                               format: uuid
 *                               example: "4f04e72b-f91c-42bf-984f-42ee2bc18009"
 *                               description: The ID of the payout method used for the withdrawal
 *                             amount:
 *                               type: string
 *                               example: "2000.00"
 *                               description: The requested withdrawal amount
 *                             fee:
 *                               type: string
 *                               example: "20.00"
 *                               description: The fee charged for the withdrawal
 *                             netAmount:
 *                               type: string
 *                               example: "1980.00"
 *                               description: The net amount transferred after fees
 *                             status:
 *                               type: string
 *                               example: "processing"
 *                               description: The status of the withdrawal request (e.g., pending, processing, failed)
 *                             paymentReference:
 *                               type: string
 *                               example: "WTH-x7nJV0HZJCVwsyXt"
 *                               description: The unique reference for the withdrawal transaction
 *                             transferCode:
 *                               type: string
 *                               nullable: true
 *                               example: "TRF_m1v15l7s3g14c8c2"
 *                               description: The transfer code generated by Paystack (null if not yet processed)
 *                             failureReason:
 *                               type: string
 *                               nullable: true
 *                               example: null
 *                               description: The reason for failure, if the withdrawal failed
 *                             processedAt:
 *                               type: string
 *                               format: date-time
 *                               nullable: true
 *                               example: null
 *                               description: Timestamp when the withdrawal was processed
 *                             created_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-10-11T03:20:52.793Z"
 *                               description: Timestamp when the withdrawal request was created
 *                             updated_at:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-10-11T03:20:53.987Z"
 *                               description: Timestamp when the withdrawal request was last updated
 *                       pagination:
 *                         type: object
 *                         properties:
 *                           page:
 *                             type: integer
 *                             example: 1
 *                             description: The current page number
 *                           limit:
 *                             type: integer
 *                             example: 20
 *                             description: The number of records per page
 *                           total:
 *                             type: integer
 *                             example: 6
 *                             description: The total number of withdrawal records
 *                           totalPages:
 *                             type: integer
 *                             example: 1
 *                             description: The total number of pages
 *                 message:
 *                   type: string
 *                   example: "Withdrawal history retrieved successfully"
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
 *                   example: "Please log in to view withdrawal history"
 */
router.get('/withdrawal-history', withdrawalController.getWithdrawalHistory);
/**
 * @openapi
 * /wallet/withdrawal-details:
 *   get:
 *     summary: Retrieve details of a specific withdrawal
 *     description: Fetches details of a specific withdrawal request for the authenticated user using the provided withdrawal ID. Ensures the withdrawal belongs to the user. Requires user authentication.
 *     tags:
 *       - Wallet
 *     parameters:
 *       - in: query
 *         name: withdrawalId
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *         required: true
 *         description: The unique identifier of the withdrawal request to retrieve
 *     responses:
 *       200:
 *         description: Withdrawal details retrieved successfully
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
 *                         example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *                         description: The unique identifier of the withdrawal request
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                         description: The ID of the user who made the withdrawal
 *                       walletId:
 *                         type: string
 *                         format: uuid
 *                         example: "f8a12d2f-7e7b-484c-b0e4-d2839c459027"
 *                         description: The ID of the wallet from which the withdrawal was made
 *                       payoutMethodId:
 *                         type: string
 *                         format: uuid
 *                         example: "4f04e72b-f91c-42bf-984f-42ee2bc18009"
 *                         description: The ID of the payout method used for the withdrawal
 *                       amount:
 *                         type: string
 *                         example: "2000.00"
 *                         description: The requested withdrawal amount
 *                       fee:
 *                         type: string
 *                         example: "20.00"
 *                         description: The fee charged for the withdrawal
 *                       netAmount:
 *                         type: string
 *                         example: "1980.00"
 *                         description: The net amount transferred after fees
 *                       status:
 *                         type: string
 *                         example: "processing"
 *                         description: The status of the withdrawal request (e.g., pending, processing, failed)
 *                       paymentReference:
 *                         type: string
 *                         example: "WTH-x7nJV0HZJCVwsyXt"
 *                         description: The unique reference for the withdrawal transaction
 *                       transferCode:
 *                         type: string
 *                         nullable: true
 *                         example: "TRF_m1v15l7s3g14c8c2"
 *                         description: The transfer code generated by Paystack (null if not yet processed)
 *                       failureReason:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                         description: The reason for failure, if the withdrawal failed
 *                       processedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                         description: Timestamp when the withdrawal was processed
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-11T03:20:52.793Z"
 *                         description: Timestamp when the withdrawal request was created
 *                 message:
 *                   type: string
 *                   example: "Withdrawal details retrieved successfully"
 *       400:
 *         description: Bad Request - Missing withdrawal ID
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
 *                   example: "Withdrawal ID is required"
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
 *       404:
 *         description: Not Found - Withdrawal not found
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
 *                   example: "Withdrawal not found"
 */
router.get('/withdrawal-details', withdrawalController.getWithdrawalDetails);
/**
 * @openapi
 * /wallet/cancel-withdrawal:
 *   post:
 *     summary: Cancel a pending withdrawal request
 *     description: Cancels a specified pending withdrawal request for the authenticated user. Reverts the withdrawal amount from pending to available balance and records the cancellation. Only pending withdrawals can be cancelled. Requires user authentication.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               withdrawalId:
 *                 type: string
 *                 format: uuid
 *                 example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *                 description: The unique identifier of the withdrawal request to cancel
 *             required:
 *               - withdrawalId
 *     responses:
 *       200:
 *         description: Withdrawal cancelled successfully
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
 *                   example: "Withdrawal cancelled successfully"
 *       400:
 *         description: Bad Request - Missing withdrawal ID or withdrawal is not pending
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
 *                   example: "Withdrawal ID is required"
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
 *       404:
 *         description: Not Found - Withdrawal request or wallet balance not found
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
 *                   example: "Withdrawal request not found"
 */
router.post('/cancel-withdrawal', withdrawalController.cancelWithdrawal);

// ==================== ADMIN ROUTES ====================
/**
 * @openapi
 * /wallet/admin/pending-withdrawal:
 *   get:
 *     summary: Retrieve all pending withdrawal requests
 *     description: Fetches a list of all pending withdrawal requests across all users. Requires admin authentication.
 *     tags:
 *       - Wallet
 *     responses:
 *       200:
 *         description: Pending withdrawals retrieved successfully
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
 *                         example: "99661a12-848b-4ac2-9a1b-03a054dff3de"
 *                         description: The unique identifier of the withdrawal request
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "09127216-c1a9-468e-9a96-d712ab67edd9"
 *                         description: The ID of the user who made the withdrawal
 *                       walletId:
 *                         type: string
 *                         format: uuid
 *                         example: "f8a12d2f-7e7b-484c-b0e4-d2839c459027"
 *                         description: The ID of the wallet from which the withdrawal was made
 *                       payoutMethodId:
 *                         type: string
 *                         format: uuid
 *                         example: "4f04e72b-f91c-42bf-984f-42ee2bc18009"
 *                         description: The ID of the payout method used for the withdrawal
 *                       amount:
 *                         type: string
 *                         example: "2000.00"
 *                         description: The requested withdrawal amount
 *                       fee:
 *                         type: string
 *                         example: "20.00"
 *                         description: The fee charged for the withdrawal
 *                       netAmount:
 *                         type: string
 *                         example: "1980.00"
 *                         description: The net amount transferred after fees
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                         description: The status of the withdrawal request (pending in this case)
 *                       paymentReference:
 *                         type: string
 *                         example: "WTH-j1HZ22VLnpboPnql"
 *                         description: The unique reference for the withdrawal transaction
 *                       transferCode:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                         description: The transfer code generated by Paystack (null if not yet processed)
 *                       failureReason:
 *                         type: string
 *                         nullable: true
 *                         example: "Your balance is not enough to fulfil this request"
 *                         description: The reason for failure, if applicable
 *                       processedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-10-11T03:00:53.405Z"
 *                         description: Timestamp when the withdrawal was processed
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-11T03:00:52.233Z"
 *                         description: Timestamp when the withdrawal request was created
 *                 message:
 *                   type: string
 *                   example: "Pending withdrawals retrieved successfully"
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
 *                   example: "Unauthorized. Admin access required"
 *       500:
 *         description: Internal Server Error - Failed to retrieve pending withdrawals
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
 *                   example: "Failed to retrieve pending withdrawals"
 */
router.get('/admin/pending-withdrawal', withdrawalController.getPendingWithdrawals);
/**
 * @openapi
 * /wallet/admin/process-withdrawal:
 *   post:
 *     summary: Process a withdrawal request
 *     description: Initiates the processing of a specified withdrawal request by an admin user. Updates the withdrawal status to 'processing' and initiates a transfer via Paystack. If the transfer fails, the withdrawal is marked as failed and the balance is reverted. Requires admin authentication.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               withdrawalId:
 *                 type: string
 *                 format: uuid
 *                 example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *                 description: The unique identifier of the withdrawal request to process
 *             required:
 *               - withdrawalId
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
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
 *                   example: "Withdrawal processed successfully"
 *       400:
 *         description: Bad Request - Missing withdrawal ID or withdrawal is not pending
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
 *                   example: "Withdrawal ID is required"
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
 *                   example: "Unauthorized. Admin access required"
 *       404:
 *         description: Not Found - Withdrawal request or payout method not found
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
 *                   example: "Withdrawal request not found"
 */
router.post('/admin/process-withdrawal', withdrawalController.processWithdrawal);
/**
 * @openapi
 * /wallet/admin/complete-withdrawal:
 *   post:
 *     summary: Complete a processing withdrawal request
 *     description: Marks a withdrawal request as completed by an admin user. Updates the withdrawal status to 'completed', records the processing timestamp, moves the amount from pending balance to total withdrawn in the wallet. The withdrawal must be in 'processing' state. Requires admin authentication.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               withdrawalId:
 *                 type: string
 *                 format: uuid
 *                 example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *                 description: The unique identifier of the withdrawal request to complete
 *             required:
 *               - withdrawalId
 *     responses:
 *       200:
 *         description: Withdrawal completed successfully
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
 *                   example: "Withdrawal completed successfully"
 *       400:
 *         description: Bad Request - Missing withdrawal ID or withdrawal is not in processing state
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
 *                   example: "Withdrawal ID is required"
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
 *                   example: "Unauthorized. Admin access required"
 *       404:
 *         description: Not Found - Withdrawal request not found
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
 *                   example: "Withdrawal request not found"
 */
router.post('/admin/complete-withdrawal', withdrawalController.completeWithdrawal);
/**
 * @openapi
 * /wallet/admin/fail-withdrawal:
 *   post:
 *     summary: Mark a withdrawal request as failed
 *     description: Marks a specified pending withdrawal request as failed by an admin user, providing a reason for the failure. Reverts the withdrawal amount from pending to available balance and records a refund transaction. Requires admin authentication.
 *     tags:
 *       - Wallet
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               withdrawalId:
 *                 type: string
 *                 format: uuid
 *                 example: "4e58c398-b285-49d8-8ca5-563466c65f2b"
 *                 description: The unique identifier of the withdrawal request to mark as failed
 *               reason:
 *                 type: string
 *                 example: "Insufficient funds"
 *                 description: The reason for marking the withdrawal as failed
 *             required:
 *               - withdrawalId
 *               - reason
 *     responses:
 *       200:
 *         description: Withdrawal marked as failed and balance refunded
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
 *                   example: "Withdrawal marked as failed and balance refunded"
 *       400:
 *         description: Bad Request - Missing withdrawal ID, reason, or withdrawal is not pending
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
 *                   example: "Withdrawal ID is required"
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
 *                   example: "Unauthorized. Admin access required"
 *       404:
 *         description: Not Found - Withdrawal request or wallet balance not found
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
 *                   example: "Withdrawal request not found"
 */
router.post('/admin/fail-withdrawal', withdrawalController.failWithdrawal);

export { router as walletRouter };
