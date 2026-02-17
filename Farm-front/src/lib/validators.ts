/**
 * Form Validation Utilities
 * 
 * Reusable validation functions for forms
 */

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Indian format)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/; // 10 digits starting with 6-9
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  return phoneRegex.test(cleaned);
};

// Required field validation
export const validateRequired = (value: string | number | undefined | null): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== undefined && value !== null && value !== '';
};

// Minimum length validation
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.trim().length >= minLength;
};

// Maximum length validation
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.trim().length <= maxLength;
};

// Price validation
export const validatePrice = (price: string | number): boolean => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(numPrice) && numPrice > 0;
};

// Quantity validation
export const validateQuantity = (quantity: string | number, min: number = 1): boolean => {
  const numQty = typeof quantity === 'string' ? parseInt(quantity) : quantity;
  return !isNaN(numQty) && numQty >= min && Number.isInteger(numQty);
};

// PIN code validation (Indian)
export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  return pincodeRegex.test(pincode);
};

// Aadhaar validation
export const validateAadhaar = (aadhaar: string): boolean => {
  const cleaned = aadhaar.replace(/\s|-/g, '');
  return /^\d{12}$/.test(cleaned);
};

// OTP validation
export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

// URL validation
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validation error messages
export const getValidationError = (field: string, rule: string): string => {
  const errors: Record<string, Record<string, string>> = {
    email: {
      required: 'Email is required',
      invalid: 'Please enter a valid email address',
    },
    phone: {
      required: 'Phone number is required',
      invalid: 'Please enter a valid 10-digit phone number',
    },
    password: {
      required: 'Password is required',
      minLength: 'Password must be at least 8 characters',
    },
    price: {
      required: 'Price is required',
      invalid: 'Please enter a valid price (greater than 0)',
    },
    quantity: {
      required: 'Quantity is required',
      invalid: 'Please enter a valid quantity',
      min: 'Minimum quantity required',
    },
    pincode: {
      required: 'PIN code is required',
      invalid: 'Please enter a valid 6-digit PIN code',
    },
    aadhaar: {
      required: 'Aadhaar number is required',
      invalid: 'Please enter a valid 12-digit Aadhaar number',
    },
    otp: {
      required: 'OTP is required',
      invalid: 'Please enter a valid 6-digit OTP',
    },
  };

  return errors[field]?.[rule] || 'Invalid value';
};

// Generic validator function
export const validate = (value: any, rules: Array<(val: any) => boolean>): boolean => {
  return rules.every(rule => rule(value));
};







