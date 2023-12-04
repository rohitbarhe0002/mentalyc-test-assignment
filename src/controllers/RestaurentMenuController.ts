import { Request, Response } from 'express';
import RestaurentMenu from '../models/RestaurentMenu'; 

const RestaurentMenuController = {
    async createRestaurentMenu(req: Request, res: Response) {
        try {
          const restaurentMenu = await RestaurentMenu.create(req.body);
          res.status(201).json(restaurentMenu);
        } catch (error) {
          res.status(500).json({ error: 'An error occurred while creating the order.' });
        }
      },

  async getAllRestaurentMenu(req: Request, res: Response) {
    try {
      const { page , perPage , isAdmin, sortByDueDate, sortByCompleted } = req.query;

      const query = isAdmin !== undefined ? { isAdmin: isAdmin === 'true' } : {};

      const sortOptions: any = {};
      if (sortByDueDate) sortOptions.dueDate = sortByDueDate === 'asc' ? 1 : -1;
      if (sortByCompleted) sortOptions.completed = sortByCompleted === 'asc' ? 1 : -1;
      const restaurentMenus = await RestaurentMenu.find(query,{ _id: 0 }).lean()
        .sort(sortOptions)
        .skip((+page - 1) *+perPage)
        .limit(+perPage);
      res.json(restaurentMenus);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching restaurentMenus.' });
    }
  },

  async getRestaurentMenuById(req: Request, res: Response) {
    try {
      const restaurentMenu = await RestaurentMenu.findOne({id:req.params.id});
      if (restaurentMenu) {
        res.json(restaurentMenu);
      } else {
        res.status(404).json({ error: 'RestaurentMenu not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching the restaurentMenu.' });
    }
  },

  async updateRestaurentMenu(req: Request, res: Response) {
    const filter = { id: req.params.id };
    const update = req.body;
    try {
      const updatedRestaurentMenu = await RestaurentMenu.findOneAndUpdate(filter,update, {
        returnOriginal: false,
        projection: { _id: 0 },
     });

      if (updatedRestaurentMenu) {
        res.json(updatedRestaurentMenu);
      } else {
        res.status(404).json({ error: 'RestaurentMenu not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating the restaurentMenu.' });
    }
  },

  async deleteRestaurentMenu (req: Request, res: Response) {
    try {
      const restaurentMenu = await RestaurentMenu.findOneAndDelete({id:req.params.id});
      if (restaurentMenu) {
        res.json({ message: 'RestaurentMenu deleted successfully'});
      } else {
        res.status(404).json({ error: 'RestaurentMenu not found.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while deleting the restaurentMenu.' });
    }
  },

};

export default RestaurentMenuController;