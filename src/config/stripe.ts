import Stripe from "stripe";
import config from "./index.js";

const stripe: Stripe = new Stripe(config.stripe.secretKey);


export default stripe;