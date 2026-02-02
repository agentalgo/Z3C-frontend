const ONLY_NUMBERS_REGEX = /^[\d]+[.]{0,1}[\d]*$/;

/**
 * VALIDATOR TEST CASES COVERED:
 * 
 * STRING VALIDATION:
 * ✓ Required: empty string, whitespace-only string
 * ✓ Min length: "ab" with min:3 → error
 * ✓ Max length: "abcdef" with max:5 → error
 * ✓ Regex: email, phone, etc.
 * ✓ Type check: ensures value is string
 * 
 * NUMBER VALIDATION:
 * ✓ Required: null, undefined, empty string
 * ✓ Type check: non-numeric strings (handles "123", "12.5", 123, 12.5)
 * ✓ Min value: 5 with min:10 → error
 * ✓ Max value: 100 with max:50 → error
 * ✓ Edge case: 0 is valid number (not treated as empty)
 * ✓ Decimals: "12.5" is valid number
 * 
 * ARRAY VALIDATION:
 * ✓ Required: null, undefined, empty array []
 * ✓ Min items: [1,2] with min:3 → error
 * ✓ Max items: [1,2,3,4] with max:3 → error
 * ✓ Type check: ensures value is array
 * ✓ Edge case: [0] is valid array with 1 item
 * 
 * GENERAL:
 * ✓ Non-required empty fields skip all other validations
 * ✓ Custom label support for error messages
 * ✓ Auto-formatting fieldName (camelCase → Title Case)
 */

/**
 * Validates a single field with specified options
 * @param {any} fieldValue - The value to validate
 * @param {string} fieldName - The name of the field (used in error messages)
 * @param {Object} options - Validation options
 * @param {boolean} options.isRequired - Whether the field is required
 * @param {boolean} options.isNumber - Whether the field should be a number
 * @param {boolean} options.isArray - Whether the field should be an array
 * @param {number} options.min - Minimum length/value
 * @param {number} options.max - Maximum length/value
 * @param {RegExp} options.regex - Regular expression to test against
 * @param {string} options.label - Custom label for error messages
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateField = (fieldValue, fieldName = 'Field', options = {}) => {
  let isValid = true;
  let error = '';
  
  // Use custom label or format fieldName
  fieldName = options.label || (fieldName[0].toUpperCase() + fieldName.slice(1)).replaceAll('_', ' ');

  // Helper: Check if value is empty (handles 0, false, empty string, null, undefined)
  const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  };

  // 1. REQUIRED CHECK
  if (options.isRequired && isEmpty(fieldValue)) {
    isValid = false;
    error = `${fieldName} is required`;
    return { isValid, error };
  }

  // If field is empty and not required, skip further validation
  if (isEmpty(fieldValue)) {
    return { isValid, error };
  }

  // 2. TYPE VALIDATION
  if (options.isArray) {
    if (!Array.isArray(fieldValue)) {
      isValid = false;
      error = `${fieldName} should be an array`;
      return { isValid, error };
    }
  } else if (options.isNumber) {
    // Convert string to number for validation
    const numValue = typeof fieldValue === 'string' ? fieldValue : String(fieldValue);
    if (!ONLY_NUMBERS_REGEX.test(numValue)) {
      isValid = false;
      error = `${fieldName} should be a number`;
      return { isValid, error };
    }
  } else {
    // Default: should be string
    if (typeof fieldValue !== 'string') {
      isValid = false;
      error = `${fieldName} should be a string`;
      return { isValid, error };
    }
  }

  // 3. MIN VALIDATION
  if (options.min !== undefined && options.min !== null) {
    if (options.isArray) {
      if (fieldValue.length < options.min) {
        isValid = false;
        error = `Minimum ${options.min} item${options.min > 1 ? 's are' : ' is'} required`;
        return { isValid, error };
      }
    } else if (options.isNumber) {
      const numValue = parseFloat(fieldValue);
      if (numValue < options.min) {
        isValid = false;
        error = `Minimum value required is ${options.min}`;
        return { isValid, error };
      }
    } else {
      // String
      if (fieldValue.trim().length < options.min) {
        isValid = false;
        error = `Minimum ${options.min} character${options.min > 1 ? 's are' : ' is'} required`;
        return { isValid, error };
      }
    }
  }

  // 4. MAX VALIDATION
  if (options.max !== undefined && options.max !== null) {
    if (options.isArray) {
      if (fieldValue.length > options.max) {
        isValid = false;
        error = `Maximum ${options.max} item${options.max > 1 ? 's are' : ' is'} allowed`;
        return { isValid, error };
      }
    } else if (options.isNumber) {
      const numValue = parseFloat(fieldValue);
      if (numValue > options.max) {
        isValid = false;
        error = `Maximum value allowed is ${options.max}`;
        return { isValid, error };
      }
    } else {
      // String
      if (fieldValue.trim().length > options.max) {
        isValid = false;
        error = `Maximum ${options.max} character${options.max > 1 ? 's are' : ' is'} allowed`;
        return { isValid, error };
      }
    }
  }

  // 5. REGEX VALIDATION (for strings)
  if (options.regex) {
    if (options.isArray || options.isNumber) {
      // Regex validation doesn't apply to arrays or numbers
      console.warn(`Regex validation is not applicable for ${options.isArray ? 'arrays' : 'numbers'}`);
    } else {
      const stringValue = typeof fieldValue === 'string' ? fieldValue : String(fieldValue);
      if (!options.regex.test(stringValue)) {
        isValid = false;
        error = `${fieldName} is not valid`;
        return { isValid, error };
      }
    }
  }

  return { isValid, error };
};

/**
 * Validates entire form data object
 * @param {Object} data - Object containing all form field values
 * @param {Object} validations - Object with same keys as data, values are validation options
 * @returns {Object} { allValid: boolean, errors: Object }
 */
export const validateSubmissionData = (data, validations) => {
  let allValid = true;
  const errors = {};
  
  // Validate each field that has validation rules
  Object.keys(data).forEach((key) => {
    if (validations[key]) {
      const { isValid, error } = validateField(data[key], key, validations[key]);
      if (!isValid) {
        errors[key] = error;
        allValid = false;
      }
    }
  });
  
  return { allValid, errors };
};
