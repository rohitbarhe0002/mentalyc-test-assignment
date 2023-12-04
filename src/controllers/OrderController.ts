import { Request, Response } from 'express';
import Order from '../models/Order'; 

const orderController = {
    async createOrder(req: Request, res: Response) {
        try {
          const order = await Order.create(req.body);
          res.status(201).json(order);
        } catch (error) {
          res.status(500).json({ error: 'An error occurred while creating the order.' });
        }
      },

  async getAllOrder(req: any, res: Response) {
    try {
      const { page , perPage , isAdmin, sortByDueDate, sortByCompleted } = req.query;

      const query = isAdmin !== undefined ? { isAdmin: isAdmin === 'true' } : {};
      if (!req.session) {
        return res.status(401).json({ error: 'Session is not present' });
      }
      const sortOptions: any = {};
      if (sortByDueDate) sortOptions.dueDate = sortByDueDate === 'asc' ? 1 : -1;
      if (sortByCompleted) sortOptions.completed = sortByCompleted === 'asc' ? 1 : -1;

    
      if (req.session.loggedIn) {
      const orders = await Order.find(query,{ _id: 0 }).lean()
        .sort(sortOptions)
        .skip((+page - 1) *+perPage)
        .limit(+perPage);
      res.json(orders);
      }else {
        return res.status(200).json({ error: 'Session is expired' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching orders.' });
    }
  },

  async getOrderById(req: Request, res: Response) {
    try {
      const order = await Order.findOne({orderID:req.params.id});
      if (order) {
        res.json(order);
      } else {
        res.status(404).json({ error: 'order not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the order.' });
    }
  },

  async updateOrder (req: Request, res: Response) {
    const filter = { orderID: req.params.id };
    const update = req.body;
    try {
      const updatedOrder = await Order.findOneAndUpdate(filter,update, {
        returnOriginal: false,
        projection: { _id: 0 },
     });
      if (updatedOrder) {
        res.json(updatedOrder);
      } else {
        res.status(404).json({ error: 'Order not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating the order.' });
    }
  },

  async deleteOrder (req: Request, res: Response) {
    try {
      const order = await Order.findOneAndDelete({orderID:req.params.id});
      if (order) {
        res.json({ message: 'Order deleted successfully'});
      } else {
        res.status(404).json({ error: 'Order not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while deleting the order.' });
    }
  },

};

export default orderController;