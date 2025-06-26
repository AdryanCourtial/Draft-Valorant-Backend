import jwt from 'jsonwebtoken';

export const generateToken = (id: number, email: string): string => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
  };