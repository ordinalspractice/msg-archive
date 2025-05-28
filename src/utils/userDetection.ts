import { z } from 'zod';
import { readFileWithProperEncoding, fixEncoding } from './encoding';
import { logger } from './logger';

// Schema for autofill_information.json
// Note: Data is nested under autofill_information_v2, and values can be arrays
const AutofillDataSchema = z
  .object({
    FULL_NAME: z.union([z.string(), z.array(z.string())]).optional(),
    FIRST_NAME: z.union([z.string(), z.array(z.string())]).optional(),
    LAST_NAME: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .passthrough();

const AutofillInfoSchema = z
  .object({
    autofill_information_v2: AutofillDataSchema.optional(),
  })
  .passthrough();

/**
 * Simple function to get the user's name from autofill_information.json
 * Returns the FULL_NAME if available, otherwise combines FIRST_NAME + LAST_NAME
 */
export const detectUserName = async (
  directoryHandle: FileSystemDirectoryHandle,
): Promise<string | null> => {
  try {
    logger.debug('READING_AUTOFILL_INFO');

    const autofillFile = await directoryHandle.getFileHandle('autofill_information.json');
    const file = await autofillFile.getFile();
    const content = await readFileWithProperEncoding(file);

    const data = JSON.parse(content);
    const validatedData = AutofillInfoSchema.parse(data);

    // Extract the nested autofill data
    const autofillData = validatedData.autofill_information_v2;

    if (!autofillData) {
      logger.debug('AUTOFILL_NO_V2_DATA');
      return null;
    }

    logger.debug('AUTOFILL_RAW_DATA', {
      FULL_NAME: autofillData.FULL_NAME,
      FIRST_NAME: autofillData.FIRST_NAME,
      LAST_NAME: autofillData.LAST_NAME,
      fullNameType: typeof autofillData.FULL_NAME,
      fullNameIsArray: Array.isArray(autofillData.FULL_NAME),
    });

    let userName: string | null = null;

    // Helper function to get string value from string or array
    const getStringValue = (value: string | string[] | undefined): string | null => {
      if (!value) return null;
      if (typeof value === 'string') return value.trim();
      if (Array.isArray(value) && value.length > 0) return value[0].trim();
      return null;
    };

    const fullName = getStringValue(autofillData.FULL_NAME);
    const firstName = getStringValue(autofillData.FIRST_NAME);
    const lastName = getStringValue(autofillData.LAST_NAME);

    if (fullName) {
      userName = fixEncoding(fullName);
    } else if (firstName && lastName) {
      userName = fixEncoding(`${firstName} ${lastName}`);
    } else if (firstName) {
      userName = fixEncoding(firstName);
    }

    logger.debug('USER_NAME_DETECTED', {
      userName,
      source: fullName
        ? 'FULL_NAME'
        : firstName && lastName
          ? 'FIRST_LAST'
          : firstName
            ? 'FIRST_ONLY'
            : 'NONE',
    });
    return userName;
  } catch (error) {
    logger.debug('AUTOFILL_READ_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
};
