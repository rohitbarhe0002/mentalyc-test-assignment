import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';

const authenticateUser = (req: any, res: Response, next: NextFunction) => {
  const authToken = req.header('Authorization');

  if (!authToken) {
    return res.status(401).json({ error: 'Authorization header missing.' });
  }

  const token = authToken.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN) as { userId: string, exp: number };

    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ error: 'Authorization token has expired.' });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authorization token.' });
  }
};

export default authenticateUser;

