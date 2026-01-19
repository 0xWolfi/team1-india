# How to Generate VAPID Keys

VAPID keys are required for Web Push API authentication.

## Generate Keys

Run this Node.js script once:

```bash
npx web-push generate-vapid-keys
```

## Output Example

```
=======================================

Public Key:
BHxGEjSq5z_wh8N3PqKD_yOe7RG_yjUg4K4fP3sFj6jL-vE9k8W4tNp2mZxCv7H6uL3oS1pQwR9g5tYuI7kN2fE

Private Key:
s8j9a1K2b3lL4mM5nN6oO7pP8qQ9rR0sS1tT2uU3vV4

=======================================
```

## Add to .env

Copy the keys to your `.env` file:

```bash
# Push Notifications - VAPID Keys
VAPID_PUBLIC_KEY=BHxGEjSq5z_wh8N3PqKD_yOe7RG_yjUg4K4fP3sFj6jL-vE9k8W4tNp2mZxCv7H6uL3oS1pQwR9g5tYuI7kN2fE
VAPID_PRIVATE_KEY=s8j9a1K2b3lL4mM5nN6oO7pP8qQ9rR0sS1tT2uU3vV4
VAPID_SUBJECT=mailto:admin@team1india.com
```

## Important

- **NEVER** commit these keys to version control
- **NEVER** expose the private key to the client
- Only the public key is sent to the browser
- Generate new keys for production (don't use example keys)

## Testing

After adding keys, test the endpoint:

```bash
curl http://localhost:3000/api/push/vapid-key
```

Should return:
```json
{
  "publicKey": "BHxGEj..."
}
```

## Key Rotation

To rotate keys:
1. Generate new keys with `npx web-push generate-vapid-keys`
2. Update `.env` with new keys
3. Restart application
4. Users will need to re-subscribe to push notifications
