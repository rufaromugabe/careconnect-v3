import crypto from "crypto"

// The encryption key should be stored in environment variables
const ENCRYPTION_KEY ="12345678901234567890123456789012"
const IV_LENGTH = 16 // For AES, this is always 16 bytes

// Check if encryption key is valid
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  console.warn(
    "WARNING: ENCRYPTION_KEY is missing or invalid. It should be a 32-character string. Encryption will not work properly.",
  )
}

/**
 * Encrypts data using AES-256-CBC
 * @param text The text to encrypt
 * @returns Encrypted data as a base64 string with IV prepended
 */
export function encrypt(text: string): string {
  if (!text) return text
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error("Cannot encrypt: Invalid encryption key")
    return text // Return original text if key is invalid
  }

  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher with key and iv
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)

    // Encrypt the data
    let encrypted = cipher.update(text, "utf8", "base64")
    encrypted += cipher.final("base64")

    // Prepend IV to encrypted data for use in decryption
    return iv.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("Encryption error:", error)
    return text // Return original text on error
  }
}

/**
 * Decrypts data using AES-256-CBC
 * @param encryptedData The data to decrypt (IV:encryptedData format)
 * @returns Decrypted text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return encryptedData
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error("Cannot decrypt: Invalid encryption key")
    return encryptedData // Return encrypted data if key is invalid
  }

  try {
    // Split IV and encrypted data
    const textParts = encryptedData.split(":")
    if (textParts.length !== 2) {
      throw new Error("Invalid encrypted data format")
    }

    const iv = Buffer.from(textParts[0], "hex")
    const encryptedText = textParts[1]

    // Create decipher with key and iv
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv)

    // Decrypt the data
    let decrypted = decipher.update(encryptedText, "base64", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption error:", error)
    return encryptedData // Return encrypted data on error
  }
}

/**
 * Determines if a string is encrypted (has the IV:data format)
 * @param text Text to check
 * @returns Boolean indicating if the text appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false

  // Check if the text has the format of IV:encryptedData
  const parts = text.split(":")
  if (parts.length !== 2) return false

  // Check if the first part is a valid hex string of correct length (IV)
  const hexRegex = /^[0-9a-fA-F]+$/
  return hexRegex.test(parts[0]) && parts[0].length === IV_LENGTH * 2
}

/**
 * Safely decrypts data, checking if it's encrypted first
 * @param data Data that may or may not be encrypted
 * @returns Decrypted data if encrypted, original data otherwise
 */
export function safeDecrypt(data: string): string {
  if (!data) return data
  return isEncrypted(data) ? decrypt(data) : data
}

/**
 * Encrypts an object's specified fields
 * @param obj Object containing data to encrypt
 * @param fields Array of field names to encrypt
 * @returns New object with encrypted fields
 */
export function encryptObject<T extends Record<string, any>>(obj: T, fields: string[]): T {
  const result = { ...obj } as { [key: string]: any }

  fields.forEach((field) => {
    if (result[field] && typeof result[field] === "string") {
      result[field] = encrypt(result[field])
    }
  })

  return result as T
}

/**
 * Decrypts an object's specified fields
 * @param obj Object containing data to decrypt
 * @param fields Array of field names to decrypt
 * @returns New object with decrypted fields
 */
export function decryptObject<T extends Record<string, any>>(obj: T, fields: string[]): T {
  const result = { ...obj } as { [key: string]: any }

  fields.forEach((field) => {
    if (result[field] && typeof result[field] === "string" && isEncrypted(result[field])) {
      result[field] = decrypt(result[field])
    }
  })

  return result as T
  
}
