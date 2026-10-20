# Zoho Cliq chat drawer

Cliq connections belong to individual ERP users and are independent of the company Bigin connection.

## Setup

Cliq now uses the shared Zoho module. Follow [shared Zoho setup](../zoho/README.md), then press **Connect Zoho** directly on the Connectors card. There is no separate Cliq OAuth client, callback, or connect button.

Requested scopes: `ZohoCliq.Chats.READ`, `ZohoCliq.Messages.READ`, `ZohoCliq.Channels.READ`, `ZohoCliq.Users.READ`, `ZohoCliq.Webhooks.CREATE`.

The drawer reads the latest 100 chats, joined channels, or people, and the latest 50 messages in a conversation. It polls chats every 30 seconds and an open conversation every 15 seconds. My Pins uses Cliq's pinned chat flag; unread filtering uses unread counts where provided by Cliq. People and the new conversation button open the full Cliq client. Rich attachments are opened in Cliq. No external messages are sent until the user presses Send in the composer.

API references: https://www.zoho.com/cliq/help/restapi/v2/chats/ and https://www.zoho.com/cliq/help/restapi/v2/messages/
