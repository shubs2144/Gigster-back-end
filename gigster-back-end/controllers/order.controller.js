import createError from "../utils/createError.js";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import Stripe from "stripe";

export const createOrder = async (req, res, next) => {
  try {
    const gig = await Gig.findById(req.params.gigId);
    const existingOrder = await Order.findOne({ gigId: gig._id });
    const stripe = new Stripe(process.env.STRIPE);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: gig.price * 100,
      currency: "inr",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (existingOrder) {
      if (existingOrder.isCompleted == true) {
        throw new Error("You have already placed an order for this gig");
      }
      existingOrder.payment_intent = paymentIntent.id;
      await existingOrder.save();
      return res.status(200).send({
        message: "Order updated successfully.",
      });
    }

    const newOrder = new Order({
      gigId: gig._id,
      img: gig.cover,
      title: gig.title,
      buyerId: req.body.buyerId,
      sellerId: gig.userId,
      price: gig.price,
      payment_intent: paymentIntent.id,
    });
    await newOrder.save();
    const payment_intent_id = paymentIntent.id;
    res.status(200).send({
      paymentIntentId: payment_intent_id,
    });
  } catch (err) {
    console.log("order not created");
    next(err);
  }
};

export const intent = async (req, res, next) => {
  try {
    const stripe = new Stripe(process.env.STRIPE);

    const gig = await Gig.findById(req.params.id);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: gig.price * 100,
      currency: "inr",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const existingOrder = await Order.findOne({ gigId: gig._id });

    if (existingOrder) {
      // Handle the case where an order with the same gigId already exists
      // You can either update the existing order or return an error message
      existingOrder.payment_intent = paymentIntent.id;
      await existingOrder.save();
      return res.status(200).send({
        message: "Order updated successfully.",
      });
    }

    const newOrder = new Order({
      gigId: gig._id,
      img: gig.cover,
      title: gig.title,
      buyerId: req.userId,
      sellerId: gig.userId,
      price: gig.price,
      payment_intent: paymentIntent.id,
    });
    // stripe checkout session
    await newOrder.save();
    res.status(200).send({
      paymentIntentId: newOrder.payment_intent,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }),
      isCompleted: true,
    });

    res.status(200).send(orders);
  } catch (err) {
    next(err);
  }
};
export const confirm = async (req, res, next) => {
  try {
    const orders = await Order.findOneAndUpdate(
      {
        payment_intent: req.body.payment_intent,
      },
      {
        $set: {
          isCompleted: true,
        },
      }
    );

    res.status(200).send("Order has been confirmed.");
  } catch (err) {
    next(err);
  }
};
