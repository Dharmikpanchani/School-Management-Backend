import { Router } from 'express';
import * as PaymentController from '../controller/PaymentController.js';

const paymentRoutes = Router();

paymentRoutes.post('/create-order', PaymentController.createOrder);
paymentRoutes.post('/verify', PaymentController.verifyPayment);
paymentRoutes.post('/webhook', PaymentController.razorpayWebhook);
paymentRoutes.get('/transactions', PaymentController.getTransactions);

export default paymentRoutes;
