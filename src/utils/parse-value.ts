/**
 * Parse a string value to its appropriate type
 * Attempts to convert strings to their native types (number, boolean, object, array)
 * @param value The string value to parse
 * @returns The parsed value with the appropriate type
 */
export function parseValue(value: string): any {
  try {
    // Try to parse as JSON if it looks like a JSON value
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']')) ||
      value === 'null' ||
      value === 'true' ||
      value === 'false' ||
      !isNaN(Number(value))
    ) {
      return JSON.parse(value);
    }
  } catch (e) {
    // If parsing fails, use the original string value
  }
  return value;
} 
