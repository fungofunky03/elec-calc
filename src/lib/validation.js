export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function parseNumber(value, {
  name,
  min = -Infinity,
  max = Infinity,
  integer = false
}) {
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value);

  if (!Number.isFinite(numericValue)) {
    throw new ValidationError(`${name} must be a valid number`);
  }

  if (integer && !Number.isInteger(numericValue)) {
    throw new ValidationError(`${name} must be a whole number`);
  }

  if (numericValue < min || numericValue > max) {
    if (Number.isFinite(min) && Number.isFinite(max)) {
      throw new ValidationError(`${name} must be between ${min} and ${max}`);
    }

    if (Number.isFinite(min)) {
      throw new ValidationError(`${name} must be at least ${min}`);
    }

    throw new ValidationError(`${name} must be at most ${max}`);
  }

  return numericValue;
}

export function parseChoice(value, choices, name) {
  if (!choices.includes(value)) {
    throw new ValidationError(`${name} must be one of: ${choices.join(', ')}`);
  }

  return value;
}

export function validateNumericInput(value, options) {
  try {
    parseNumber(value, options);
    return true;
  } catch (error) {
    return error.message;
  }
}
