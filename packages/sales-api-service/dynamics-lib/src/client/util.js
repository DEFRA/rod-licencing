const stringSubstitutions = {
  '%': '%25',
  '+': '%2B',
  '/': '%2F',
  '?': '%3F',
  '#': '%23',
  '&': '%26',
  "'": "''"
}
const escapeODataStringValueRegex = new RegExp(`[${Object.keys(stringSubstitutions).join('')}]`, 'g')

/**
 * Sanitise a string value used in an ODATA query
 * @param {string|number|boolean} value the value to be sanitised
 * @returns {string} the sanitised string
 */
export const escapeODataStringValue = value => String(value).replace(escapeODataStringValueRegex, char => stringSubstitutions[char])
