import { NextResponse } from "next/server"
import { encrypt, decrypt, isEncrypted } from "@/lib/encryption"

export async function GET() {
  // Test if encryption key is valid
  const encryptionKeyValid = process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length === 32

  // Test encryption and decryption
  const testText = "This is a test of the encryption system"
  let encryptedText = ""
  let decryptedText = ""
  let encryptionWorking = false

  try {
    // Try to encrypt
    encryptedText = encrypt(testText)

    // Check if it's actually encrypted
    const isActuallyEncrypted = isEncrypted(encryptedText)

    // Try to decrypt
    decryptedText = decrypt(encryptedText)

    // Check if decryption worked
    encryptionWorking = decryptedText === testText && isActuallyEncrypted
  } catch (error) {
    console.error("Encryption test failed:", error)
  }

  return NextResponse.json({
    encryptionKeyValid,
    encryptionWorking,
    testText,
    encryptedText: encryptedText ? `${encryptedText.substring(0, 20)}...` : "",
    decryptedText,
    encryptionKeyLength: process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.length : 0,
    message: encryptionWorking
      ? "Encryption is working correctly"
      : "Encryption is NOT working correctly. Check your ENCRYPTION_KEY environment variable.",
  })
}
