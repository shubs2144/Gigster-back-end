import express, { json } from "express";

import Stripe from "stripe";
const serverAddress =
  process.env.NODE_ENV == "development"
    ? "http://localhost:5173"
    : "https://gigster.netlify.app";

const router = express.Router();

// app.use(json());
const stripe = new Stripe(process.env.STRIPE);

export const successController = async (req, res, next) => {
  const bodyData = JSON.parse(req.body.body);

  const { payment_intent, items } = bodyData;
  console.log("request body is -->", req.body);
  // console.log("line items are->", items);
  // console.log("payment_intent is -->", payment_intent);
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: items,
      mode: "payment",
      success_url: `${serverAddress}/success?payment_intent=${payment_intent}`,
    });
    // res.json({ sessionId: session.id });
    res.json({ url: session.url });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
