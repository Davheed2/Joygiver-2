import { friendsController, userController } from '../controller';
import { protect } from '@/middlewares/protect';
import express from 'express';

const router = express.Router();

/**
 * @openapi
 * /user/sign-up:
 *   post:
 *     summary: Initiate user registration
 *     description: |
 *       Creates a new user with either an email or phone number (at least one is required).
 *       If the email/phone already exists, returns the existing user with a 200 status.
 *       On successful creation, generates a 6-digit OTP, stores it with a 5-minute expiry,
 *       increments OTP retry count, and sends the OTP via email or SMS.
 *       Registration remains incomplete until OTP is verified and profile is fully updated.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "uchennadavid2404@gmail.com"
 *                 description: User's email address (provide if registering with email)
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *                 description: User's phone number in international format (provide if registering with phone)
 *             additionalProperties: false
 *             oneOf:
 *               - required: [email]
 *               - required: [phone]
 *           examples:
 *             With Email:
 *               value:
 *                 email: "uchennadavid2404@gmail.com"
 *             With Phone:
 *               value:
 *                 phone: "+2348012345678"
 *     responses:
 *       201:
 *         description: User created successfully and OTP sent
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
 *                         example: "8b6a69bd-8a89-4bd8-b853-311d21bdfec3"
 *                       email:
 *                         type: string
 *                         nullable: true
 *                         example: "uchennadavid2404@gmail.com"
 *                       firstName:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       lastName:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       username:
 *                         type: string
 *                         example: ""
 *                       lastActive:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       role:
 *                         type: string
 *                         example: "user"
 *                       gender:
 *                         type: string
 *                         example: ""
 *                       dob:
 *                         type: string
 *                         example: ""
 *                       phone:
 *                         type: string
 *                         example: ""
 *                       isRegistrationComplete:
 *                         type: boolean
 *                         example: false
 *                       isSuspended:
 *                         type: boolean
 *                         example: false
 *                       isDeleted:
 *                         type: boolean
 *                         example: false
 *                       referredBy:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       referralCount:
 *                         type: integer
 *                         example: 0
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T02:19:35.116Z"
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *             example:
 *               status: "success"
 *               data:
 *                 - id: "8b6a69bd-8a89-4bd8-b853-311d21bdfec3"
 *                   email: "uchennadavid2404@gmail.com"
 *                   firstName: null
 *                   lastName: null
 *                   username: ""
 *                   lastActive: null
 *                   photo: null
 *                   role: "user"
 *                   gender: ""
 *                   dob: ""
 *                   phone: ""
 *                   isRegistrationComplete: false
 *                   isSuspended: false
 *                   isDeleted: false
 *                   referredBy: null
 *                   referralCount: 0
 *                   created_at: "2025-11-15T02:19:35.116Z"
 *               message: "User created successfully"
 *
 *       200:
 *         description: User already exists
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
 *                       email:
 *                         type: string
 *                         nullable: true
 *                       # ... same user fields as above
 *                 message:
 *                   type: string
 *                   example: "User with this email already exists"
 *
 *       400:
 *         description: Bad request - Neither email nor phone provided
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
 *                   example: "Either email or phone number is required"
 *
 *       429:
 *         description: Too many OTP requests in the last hour
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
 *                   example: "Too many OTP requests. Please try again in an hour."
 *
 *       500:
 *         description: Internal server error
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
 *                   example: "Failed to create user"
 */
router.post('/sign-up', userController.signUp);
/**
 * @openapi
 * /user/sign-in:
 *   post:
 *     summary: Sign in with email/phone and password
 *     description: |
 *       Authenticate a user using either email or phone number along with their password.
 *       On success: resets login retries, updates `lastLogin`, generates access & refresh tokens,
 *       sets secure HttpOnly cookies, sends a login notification email (if email exists),
 *       and returns the user profile.
 *       Failed attempts are rate-limited: after 5 wrong attempts, login is blocked for 12 hours.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "uchennadavid2404@gmail.com"
 *                 description: Registered email address
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *                 description: Registered phone number (international format)
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "MySecurePass123!"
 *                 description: User's account password
 *             required:
 *               - password
 *             oneOf:
 *               - required: [email]
 *               - required: [phone]
 *             additionalProperties: false
 *           examples:
 *             Login with Email:
 *               value:
 *                 email: "uchennadavid2404@gmail.com"
 *                 password: "MySecurePass123!"
 *             Login with Phone:
 *               value:
 *                 phone: "+2348012345678"
 *                 password: "MySecurePass123!"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "accessToken=eyJhb...; Path=/; HttpOnly; Secure; SameSite=Strict"
 *             description: accessToken and refreshToken are set as secure HttpOnly cookies
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
 *                         example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                       email:
 *                         type: string
 *                         nullable: true
 *                         example: "uchennadavid2404@gmail.com"
 *                       firstName:
 *                         type: string
 *                         nullable: true
 *                         example: "David"
 *                       lastName:
 *                         type: string
 *                         nullable: true
 *                         example: "David"
 *                       username:
 *                         type: string
 *                         example: "Davheed"
 *                       lastActive:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-11-15T03:01:47.403Z"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                       role:
 *                         type: string
 *                         example: "user"
 *                       gender:
 *                         type: string
 *                         example: ""
 *                       dob:
 *                         type: string
 *                         example: ""
 *                       phone:
 *                         type: string
 *                         example: ""
 *                       isRegistrationComplete:
 *                         type: boolean
 *                         example: false
 *                       isSuspended:
 *                         type: boolean
 *                         example: false
 *                       isDeleted:
 *                         type: boolean
 *                         example: false
 *                       referredBy:
 *                         type: string
 *                         nullable: true
 *                       referralCount:
 *                         type: integer
 *                         example: 0
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T02:53:04.888Z"
 *                 message:
 *                   type: string
 *                   example: "User logged in successfully"
 *             example:
 *               status: "success"
 *               data:
 *                 - id: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                   email: "uchennadavid2404@gmail.com"
 *                   firstName: "David"
 *                   lastName: "David"
 *                   username: "Davheed"
 *                   lastActive: "2025-11-15T03:01:47.403Z"
 *                   photo: null
 *                   role: "user"
 *                   gender: ""
 *                   dob: ""
 *                   phone: ""
 *                   isRegistrationComplete: false
 *                   isSuspended: false
 *                   isDeleted: false
 *                   referredBy: null
 *                   referralCount: 0
 *                   created_at: "2025-11-15T02:53:04.888Z"
 *               message: "User logged in successfully"
 *
 *       400:
 *         description: Bad Request — Missing email/phone or password
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
 *                   example: "Either email or phone number and password required"
 *
 *       401:
 *         description: Unauthorized — Invalid credentials, account suspended, or login blocked
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
 *               examples:
 *                 invalid_credentials:
 *                   value:
 *                     status: "error"
 *                     message: "Invalid credentials"
 *                 suspended:
 *                   value:
 *                     status: "error"
 *                     message: "Your account is currently suspended"
 *                 rate_limited:
 *                   value:
 *                     status: "error"
 *                     message: "login retries exceeded!"
 *
 *       404:
 *         description: Not Found — User does not exist or account deleted
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
 *                   examples:
 *                     not_found:
 *                       value: { status: "error", message: "User not found" }
 *                     deleted:
 *                       value: { status: "error", message: "Account not found" }
 */
router.post('/sign-in', userController.signIn);
/**
 * @openapi
 * /user/send-otp:
 *   post:
 *     summary: Resend OTP for login or verification
 *     description: |
 *       Triggers a new OTP to be generated and sent to a registered user's email or phone number.
 *       Used when a user requests to log in, verify their account, or recover access.
 *       Rate-limited to 5 attempts per hour. Returns success even if OTP is sent — no user data is exposed.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "uchennadavid2404@gmail.com"
 *                 description: Registered email address
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *                 description: Registered phone number in international format
 *             additionalProperties: false
 *             oneOf:
 *               - required: [email]
 *               - required: [phone]
 *           examples:
 *             Via Email:
 *               value:
 *                 email: "uchennadavid2404@gmail.com"
 *             Via Phone:
 *               value:
 *                 phone: "+2348012345678"
 *     responses:
 *       200:
 *         description: OTP successfully sent to user's email or phone
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
 *                 message:
 *                   type: string
 *                   example: "OTP sent. Please verify to continue."
 *             example:
 *               status: "success"
 *               data: null
 *               message: "OTP sent. Please verify to continue."
 *
 *       400:
 *         description: Bad Request — Neither email nor phone provided, or user has no valid contact
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
 *               examples:
 *                 missing_contact:
 *                   value:
 *                     status: "error"
 *                     message: "Either email or phone number is required"
 *                 no_contact_method:
 *                   value:
 *                     status: "error"
 *                     message: "User does not have a valid contact method"
 *
 *       401:
 *         description: Unauthorized — Account is suspended
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
 *                   example: "Your account is currently suspended"
 *
 *       404:
 *         description: Not Found — User does not exist or account deleted
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
 *               examples:
 *                 not_found:
 *                   value:
 *                     status: "error"
 *                     message: "User not found"
 *                 deleted:
 *                   value:
 *                     status: "error"
 *                     message: "Account not found"
 *
 *       429:
 *         description: Too Many Requests — OTP limit exceeded
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
 *                   example: "Too many OTP requests. Please try again in an hour."
 *
 *       500:
 *         description: Internal Server Error — Failed to send SMS (email fallback not applicable)
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
 *                   example: "Failed to send OTP via SMS. Please try again."
 */
router.post('/send-otp', userController.sendOtp);
/**
 * @openapi
 * /user/verify-otp:
 *   post:
 *     summary: Verify OTP and complete login/registration
 *     description: |
 *       Validates the 6-digit OTP sent to the user's email or phone.
 *       On success: clears OTP, resets retry count, updates lastLogin, generates access & refresh tokens,
 *       sets secure HttpOnly cookies, and returns the user object.
 *       If registration was incomplete, this step allows the user to proceed to profile completion.
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "uchennadavid2404@gmail.com"
 *                 description: Registered email (use if OTP was sent to email)
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *                 description: Registered phone number (use if OTP was sent to phone)
 *               otp:
 *                 type: string
 *                 pattern: ^\d{6}$
 *                 example: "222222"
 *                 description: The 6-digit OTP received by the user
 *             required:
 *               - otp
 *             oneOf:
 *               - required: [email]
 *               - required: [phone]
 *             additionalProperties: false
 *           examples:
 *             Verify with Email:
 *               value:
 *                 email: "uchennadavid2404@gmail.com"
 *                 otp: "222222"
 *             Verify with Phone:
 *               value:
 *                 phone: "+2348012345678"
 *                 otp: "222222"
 *     responses:
 *       200:
 *         description: OTP verified successfully — user is now logged in
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: "accessToken=eyJhb...; Path=/; HttpOnly; Secure; SameSite=Strict"
 *             description: accessToken and refreshToken are set as HttpOnly cookies
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
 *                         example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                       email:
 *                         type: string
 *                         nullable: true
 *                         example: "uchennadavid2404@gmail.com"
 *                       firstName:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       lastName:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       username:
 *                         type: string
 *                         example: ""
 *                       lastActive:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                       role:
 *                         type: string
 *                         example: "user"
 *                       gender:
 *                         type: string
 *                         example: ""
 *                       dob:
 *                         type: string
 *                         example: ""
 *                       phone:
 *                         type: string
 *                         example: ""
 *                       isRegistrationComplete:
 *                         type: boolean
 *                         example: false
 *                       isSuspended:
 *                         type: boolean
 *                         example: false
 *                       isDeleted:
 *                         type: boolean
 *                         example: false
 *                       referredBy:
 *                         type: string
 *                         nullable: true
 *                       referralCount:
 *                         type: integer
 *                         example: 0
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T02:53:04.888Z"
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *             example:
 *               status: "success"
 *               data:
 *                 - id: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                   email: "uchennadavid2404@gmail.com"
 *                   firstName: null
 *                   lastName: null
 *                   username: ""
 *                   lastActive: null
 *                   photo: null
 *                   role: "user"
 *                   gender: ""
 *                   dob: ""
 *                   phone: ""
 *                   isRegistrationComplete: false
 *                   isSuspended: false
 *                   isDeleted: false
 *                   referredBy: null
 *                   referralCount: 0
 *                   created_at: "2025-11-15T02:53:04.888Z"
 *               message: "OTP verified successfully"
 *
 *       400:
 *         description: Bad Request — Missing email/phone or OTP
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
 *                   example: "Email or phone number and OTP are required"
 *
 *       401:
 *         description: Unauthorized — Invalid or expired OTP
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
 *                   example: "Invalid or expired OTP"
 *
 *       404:
 *         description: Not Found — User does not exist
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
 *
 *       500:
 *         description: Internal Server Error — Failed to update user after verification
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
 *                   example: "Failed to retrieve updated user"
 */
router.post('/verify-otp', userController.verifyOtp);
/**
 * @openapi
 * /user/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     description: |
 *       Initiates the password reset flow by sending a secure, time-limited reset link to the user's registered email.
 *
 *       Security features:
 *       • Rate-limited: After 6 requests, the account is automatically **suspended**
 *       • Reset token expires in **15 minutes**
 *       • Token is cryptographically signed and never exposed in plain text
 *       • Link is sent via email only (no leakage in response)
 *
 *       Even if the email doesn't exist, no information is disclosed (security best practice).
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "uchennadavid2404@gmail.com"
 *                 description: The email address associated with the user account
 *             required:
 *               - email
 *             additionalProperties: false
 *           example:
 *             email: "uchennadavid2404@gmail.com"
 *     responses:
 *       200:
 *         description: Password reset link sent successfully (even if email doesn't exist — no info leak)
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
 *                 message:
 *                   type: string
 *                   example: "Password reset link sent to uchennadavid2404@gmail.com"
 *             example:
 *               status: "success"
 *               data: null
 *               message: "Password reset link sent to uchennadavid2404@gmail.com"
 *
 *       400:
 *         description: Bad Request — Email not provided
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
 *                   example: "Email is required"
 *
 *       401:
 *         description: Unauthorized — Too many reset attempts → account automatically suspended
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
 *                   example: "Password reset retries exceeded! and account suspended"
 *
 *       404:
 *         description: Not Found — No user with provided email (still returns 200 in production for security, but documented here for clarity)
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
 *                   example: "No user found with provided email"
 *             # Note: In production, this should return 200 with generic message to prevent email enumeration
 */
router.post('/forgot-password', userController.forgotPassword);
/**
 * @openapi
 * /user/reset-password:
 *   post:
 *     summary: Reset password using token from email
 *     description: |
 *       Completes the password reset flow by validating a signed reset token and updating the user's password.
 *
 *       Security features:
 *       • Token must be valid, signed, and not expired (15-minute window from forgot-password)
 *       • New password cannot be the same as the current one
 *       • On success: clears reset token, resets retry counters, updates `passwordChangedAt`
 *       • Sends confirmation email to user
 *
 *       This endpoint is **public** — no authentication required (uses token-based validation).
 *     tags:
 *       - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx..."
 *                 description: The signed password reset token received via email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "MyNewSecurePass123!"
 *                 description: New desired password
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "MyNewSecurePass123!"
 *                 description: Must exactly match the new password
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             additionalProperties: false
 *           example:
 *             token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx..."
 *             password: "MyNewSecurePass123!"
 *             confirmPassword: "MyNewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *             example:
 *               status: "success"
 *               data: null
 *               message: "Password reset successfully"
 *
 *       400:
 *         description: Bad Request — Token expired/invalid, or password reuse
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
 *               examples:
 *                 token_invalid:
 *                   value:
 *                     status: "error"
 *                     message: "Password reset token is invalid or has expired"
 *                 same_password:
 *                   value:
 *                     status: "error"
 *                     message: "New password cannot be the same as the old password"
 *                 reset_failed:
 *                   value:
 *                     status: "error"
 *                     message: "Password reset failed"
 *
 *       401:
 *         description: Unauthorized — Token signature invalid or malformed
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
 *                   example: "Invalid token"
 *
 *       403:
 *         description: Forbidden — Missing fields or passwords don't match
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
 *               examples:
 *                 missing_fields:
 *                   value:
 *                     status: "error"
 *                     message: "All fields are required"
 *                 mismatch:
 *                   value:
 *                     status: "error"
 *                     message: "Passwords do not match"
 */
router.post('/reset-password', userController.resetPassword);

router.use(protect);
/**
 * @openapi
 * /user/sign-out:
 *   post:
 *     summary: Sign out and revoke session
 *     description: |
 *       Logs out the currently authenticated user by:
 *       • Invalidating the entire refresh token family (revokes all related sessions)
 *       • Clearing both `accessToken` and `refreshToken` cookies (with immediate expiration)
 *       • Returning a clean success response
 *
 *       This ensures complete session termination across all devices if a refresh token is present.
 *       Requires a valid authenticated session.
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out — all sessions revoked where applicable
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: |
 *                 accessToken=expired; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict
 *                 refreshToken=expired; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict
 *             description: Both tokens are cleared by setting expired cookies
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
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *             example:
 *               status: "success"
 *               data: null
 *               message: "Logout successful"
 *
 *       401:
 *         description: Unauthorized — No active session (user not logged in)
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
 *                   example: "You are not logged in"
 *             example:
 *               status: "error"
 *               message: "You are not logged in"
 */
router.post('/sign-out', userController.signOut);
/**
 * @openapi
 * /user/sign-out-all:
 *   post:
 *     summary: Log out from all devices (global sign-out)
 *     description: |
 *       Immediately terminates **all active sessions** of the authenticated user across every device and browser.
 *
 *       Actions performed:
 *       • Invalidates **all refresh token families** belonging to the user (revokes every active session)
 *       • Clears `accessToken` and `refreshToken` cookies on the current device
 *       • Ensures the user is fully logged out everywhere
 *
 *       Ideal for "Sign out from all devices" feature after a security concern or password change.
 *       Requires a valid authenticated session.
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out from all devices and sessions revoked globally
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: |
 *                 accessToken=expired; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict
 *                 refreshToken=expired; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict
 *             description: Cookies are cleared on the current device by setting expired values
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
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *             example:
 *               status: "success"
 *               data: null
 *               message: "Logout successful"
 *
 *       401:
 *         description: Unauthorized — No active session (user not logged in)
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
 *                   example: "You are not logged in"
 *             example:
 *               status: "error"
 *               message: "You are not logged in"
 */
router.post('/sign-out-all', userController.signOutFromAllDevices);
/**
 * @openapi
 * /user/profile:
 *   get:
 *     summary: Get authenticated user's profile
 *     description: |
 *       Retrieves the complete profile of the currently logged-in user.
 *       Requires a valid authenticated session (access token in cookie).
 *       Returns all user fields including registration status, referral info, and activity timestamps.
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User's profile retrieved successfully
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
 *                         example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                       email:
 *                         type: string
 *                         nullable: true
 *                         example: "uchennadavid2404@gmail.com"
 *                       firstName:
 *                         type: string
 *                         nullable: true
 *                         example: "David"
 *                       lastName:
 *                         type: string
 *                         nullable: true
 *                         example: "David"
 *                       username:
 *                         type: string
 *                         example: "Davheed"
 *                       lastActive:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: "2025-11-15T03:13:19.260Z"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       role:
 *                         type: string
 *                         example: "user"
 *                       gender:
 *                         type: string
 *                         example: ""
 *                       dob:
 *                         type: string
 *                         example: ""
 *                       phone:
 *                         type: string
 *                         example: ""
 *                       isRegistrationComplete:
 *                         type: boolean
 *                         example: false
 *                       isSuspended:
 *                         type: boolean
 *                         example: false
 *                       isDeleted:
 *                         type: boolean
 *                         example: false
 *                       referredBy:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       referralCount:
 *                         type: integer
 *                         example: 0
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T02:53:04.888Z"
 *                 message:
 *                   type: string
 *                   example: "Profile retrieved successfully"
 *             example:
 *               status: "success"
 *               data:
 *                 - id: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                   email: "uchennadavid2404@gmail.com"
 *                   firstName: "David"
 *                   lastName: "David"
 *                   username: "Davheed"
 *                   lastActive: "2025-11-15T03:13:19.260Z"
 *                   photo: null
 *                   role: "user"
 *                   gender: ""
 *                   dob: ""
 *                   phone: ""
 *                   isRegistrationComplete: false
 *                   isSuspended: false
 *                   isDeleted: false
 *                   referredBy: null
 *                   referralCount: 0
 *                   created_at: "2025-11-15T02:53:04.888Z"
 *               message: "Profile retrieved successfully"
 *
 *       400:
 *         description: Bad Request — No active session (token missing or invalid)
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
 *                   example: "Please log in again"
 *
 *       404:
 *         description: Not Found — User no longer exists in database
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
 */
router.get('/profile', userController.getProfile);
/**
 * @openapi
 * /user/update:
 *   post:
 *     summary: Update user profile & complete registration
 *     description: |
 *       Allows an authenticated user to update personal details such as name, username, email, phone, gender, date of birth, password, and apply a referral code.
 *       If all required fields are filled after the update, `isRegistrationComplete` becomes `true`, a wallet is created, referral codes are generated, and a welcome email is sent.
 *       This endpoint is protected — requires valid access token (user must be authenticated).
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "David"
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 example: "David"
 *                 description: User's last name
 *               username:
 *                 type: string
 *                 example: "Davheed"
 *                 description: Unique username (case-sensitive)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "uchennadavid2404@gmail.com"
 *                 description: Updated email (must not be taken by another user)
 *               phone:
 *                 type: string
 *                 example: "+2348012345678"
 *                 description: Updated phone number in international format
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, ""]
 *                 example: "male"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1995-06-15"
 *                 description: Date of birth in YYYY-MM-DD format
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "MySecurePass123!"
 *                 description: New password (will be hashed)
 *               referralCode:
 *                 type: string
 *                 example: "REF2025ABC"
 *                 description: Optional referral code from another user
 *             additionalProperties: false
 *           example:
 *             firstName: "David"
 *             lastName: "David"
 *             username: "Davheed"
 *             gender: "male"
 *             dob: "1995-06-15"
 *             referralCode: "REF2025ABC"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                         example: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                       email:
 *                         type: string
 *                         nullable: true
 *                         example: "uchennadavid2404@gmail.com"
 *                       firstName:
 *                         type: string
 *                         nullable: true
 *                         example: "David"
 *                       lastName:
 *                         type: string
 *                         nullable: true
 *                         example: "David"
 *                       username:
 *                         type: string
 *                         example: "Davheed"
 *                       lastActive:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T03:01:47.403Z"
 *                       photo:
 *                         type: string
 *                         nullable: true
 *                       role:
 *                         type: string
 *                         example: "user"
 *                       gender:
 *                         type: string
 *                         example: "male"
 *                       dob:
 *                         type: string
 *                         example: "1995-06-15"
 *                       phone:
 *                         type: string
 *                         example: "+2348012345678"
 *                       isRegistrationComplete:
 *                         type: boolean
 *                         example: true
 *                       isSuspended:
 *                         type: boolean
 *                         example: false
 *                       isDeleted:
 *                         type: boolean
 *                         example: false
 *                       referredBy:
 *                         type: string
 *                         nullable: true
 *                         example: "a1b2c3d4-..."
 *                       referralCount:
 *                         type: integer
 *                         example: 0
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-15T02:53:04.888Z"
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *             example:
 *               status: "success"
 *               data:
 *                 - id: "44ed85fb-901a-4102-ab00-e814108338dd"
 *                   email: "uchennadavid2404@gmail.com"
 *                   firstName: "David"
 *                   lastName: "David"
 *                   username: "Davheed"
 *                   lastActive: "2025-11-15T03:01:47.403Z"
 *                   photo: null
 *                   role: "user"
 *                   gender: "male"
 *                   dob: "1995-06-15"
 *                   phone: ""
 *                   isRegistrationComplete: true
 *                   isSuspended: false
 *                   isDeleted: false
 *                   referredBy: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
 *                   referralCount: 0
 *                   created_at: "2025-11-15T02:53:04.888Z"
 *               message: "Profile updated successfully"
 *
 *       400:
 *         description: Bad Request — Invalid referral code
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
 *                   example: "Invalid referral code"
 *
 *       401:
 *         description: Unauthorized — Account is suspended
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
 *                   example: "Your account is currently suspended"
 *
 *       404:
 *         description: Not Found — User not found or deleted
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
 *                   examples:
 *                     not_found:
 *                       value: { status: "error", message: "User not found" }
 *                     deleted:
 *                       value: { status: "error", message: "Account not found" }
 *
 *       409:
 *         description: Conflict — Email, phone, or username already taken by another user
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
 *                   examples:
 *                     email:
 *                       value: { status: "error", message: "User with this email already exists" }
 *                     phone:
 *                       value: { status: "error", message: "User with this phone number already exists" }
 *                     username:
 *                       value: { status: "error", message: "User with this username already exists" }
 *
 *       500:
 *         description: Internal Server Error — Failed to update user or create wallet/referral
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
 *                   example: "Failed to update user details"
 */
router.post('/update', userController.updateUserDetails);
/**
 * @openapi
 * /user/change-password:
 *   post:
 *     summary: Change authenticated user's password
 *     description: |
 *       Allows a logged-in user to update their current password.
 *       Validates that:
 *       • Both password fields are provided
 *       • New passwords match
 *       • New password is different from the current one
 *
 *       On success:
 *       • Hashes and saves the new password
 *       • Resets password-related retry counters and tokens
 *       • Updates `passwordChangedAt` timestamp
 *       • Sends a confirmation email
 *       • Returns success response with no sensitive data
 *
 *       Requires valid authentication (active session).
 *     tags:
 *       - User
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewStrongPass123!"
 *                 description: New desired password
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *                 example: "NewStrongPass123!"
 *                 description: Must exactly match the new password
 *             required:
 *               - password
 *               - confirmPassword
 *             additionalProperties: false
 *           example:
 *             password: "NewStrongPass123!"
 *             confirmPassword: "NewStrongPass123!"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                 message:
 *                   type: string
 *                   example: "Password reset successfully"
 *             example:
 *               status: "success"
 *               data: null
 *               message: "Password reset successfully"
 *
 *       400:
 *         description: Bad Request — Validation or business logic failure
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
 *               examples:
 *                 missing_fields:
 *                   value:
 *                     status: "error"
 *                     message: "Password and confirm password are required"
 *                 same_as_old:
 *                   value:
 *                     status: "error"
 *                     message: "New password cannot be the same as the old password"
 *                 user_not_found:
 *                   value:
 *                     status: "error"
 *                     message: "User not found"
 *                 reset_failed:
 *                   value:
 *                     status: "error"
 *                     message: "Password reset failed"
 *
 *       401:
 *         description: Unauthorized — User not logged in
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
 *                   example: "You are not logged in"
 *
 *       403:
 *         description: Forbidden — Password validation failed
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
 *               examples:
 *                 mismatch:
 *                   value:
 *                     status: "error"
 *                     message: "Passwords do not match"
 */
router.post('/change-password', userController.changePassword);

router.get('/friends-wishlists', friendsController.getFriendsWishlists);
router.get('/friends', friendsController.getFriendsList);
router.post('/remove-friend', friendsController.removeFriend);
router.get('/referral-stats', friendsController.getReferralStats);
router.get('/referral-code', friendsController.getMyReferralCode);
router.get('/search', userController.partialFindByUsernameOrEmail);

export { router as userRouter };
