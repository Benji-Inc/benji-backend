import ExtendableError from 'extendable-error-class';

export class GenerateHandleError extends ExtendableError {}

/**
 * Remove whitespace from string
 * @param {String} str
 * @returns {String}
 */
const stripWhitespace = (str) => str.replace(/\s+/g, '');

/**
 * HANDLE is the user friendly address for users in a conversation
 * handle = givenName + last initial + _ + reservation position
 * @param {String} givenName
 * @param {String} familyName
 * @param {Number} position
 * @returns {String}
 */
const generateHandle = (givenName, familyName, position) => {
  if (!givenName || typeof givenName !== 'string') {
    throw new GenerateHandleError('[s4j9fgYe] Invalid arg givenName');
  }
  if (!familyName || typeof familyName !== 'string') {
    throw new GenerateHandleError('[r67Qe8j4] Invalid arg familyName');
  }
  if (typeof position !== 'number') {
    throw new GenerateHandleError('[PbtV1ku9] Invalid arg position');
  }

  return `${stripWhitespace(givenName).toLowerCase()}${familyName
    .charAt(0)
    .toLowerCase()}_${stripWhitespace(String(position))}`;
};

export default generateHandle;
