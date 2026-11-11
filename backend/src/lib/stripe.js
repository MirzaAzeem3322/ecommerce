import Stripe from 'stripe';
import { config, stripeEnabled } from '../config.js';

export const stripe = stripeEnabled ? new Stripe(config.stripeSecretKey) : null;
