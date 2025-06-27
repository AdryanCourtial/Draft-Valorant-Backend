import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';

// Generates a UUID using the uuid library
export const generateUuid = () => uuidv4();

// Generates a short ID using nanoid with a custom alphabet of 6 characters
const nanoid = customAlphabet('1234567890abcdef', 6);

export const generateShortId = () => nanoid();